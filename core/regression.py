import math

from sklearn.linear_model import LogisticRegression

from core.helpers import *


class LogisticRegressor:
    def __init__(self, min_price, max_price, price_step, competitors_count, observations_count):
        self.min_price = min_price
        self.max_price = max_price
        self.price_step = price_step
        self.competitors_count = competitors_count
        self.observations_count = observations_count

        self.products = range(2)
        self.competitors = range(self.competitors_count)
        self.observations = range(self.observations_count)
        self.price_range = get_price_range(self.min_price, self.max_price, self.price_step)

    def train(self, coeff_intercept, coeff_price_A, coeff_price_B,
              coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        # Calculate sale probabilities
        sale_probs, ranks, prices, competitor_prices = self.generate_situation(coeff_intercept,
                                                                               coeff_price_A, coeff_price_B,
                                                                               coeff_min_comp_A, coeff_min_comp_B,
                                                                               coeff_rank_A, coeff_rank_B)

        # Run regression
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        models = [LogisticRegression(fit_intercept=False).fit(explanatory_vars[i].transpose(), sale_probs[i])
                  for i in self.products]

        return [model.coef_[0].tolist() for model in models]

    def train_iteratively(self, coeff_intercept, coeff_price_A, coeff_price_B,
                         coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B, min_observations=10):
        # Calculate sale probabilities
        sale_probs, ranks, prices, competitor_prices = self.generate_situation(coeff_intercept,
                                                                               coeff_price_A, coeff_price_B,
                                                                               coeff_min_comp_A, coeff_min_comp_B,
                                                                               coeff_rank_A, coeff_rank_B)

        # Run regressions
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        betas = np.empty(shape=(2, self.observations_count, len(explanatory_vars[0])))
        for k in range(min_observations, self.observations_count):
            models = [LogisticRegression(fit_intercept=False).fit(explanatory_vars[i].transpose()[:(k + 1)], sale_probs[i][:(k + 1)])
                      for i in self.products]
            for i in self.products:
                betas[i, k] = models[i].coef_[0].tolist()

        return np.swapaxes(betas, 1, 2).tolist()

    def generate_situation(self, coeff_intercept, coeff_price_A, coeff_price_B,
                           coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        # Generate prices
        prices = np.array([generate_prices(self.price_range, self.observations_count) for i in self.products])
        competitor_prices = generate_competitor_prices(self.price_range, self.competitors_count, self.observations_count)
        ranks = np.array([self.calculate_ranks(prices[i], competitor_prices[i]) for i in self.products])

        # Calculate sale probabilities
        sale_probs = [self.calculate_sale_probs(prices, competitor_prices, ranks, coeff_intercept[i],
                                                coeff_price_A[i], coeff_price_B[i],
                                                coeff_min_comp_A[i], coeff_min_comp_B[i],
                                                coeff_rank_A[i], coeff_rank_B[i])
                      for i in self.products]

        return sale_probs, ranks, prices, competitor_prices

    def calculate_ranks(self, prices, competitor_prices):
        return [1 + len([1 for j in self.competitors if competitor_prices[j, k] < prices[k]])
                for k in self.observations]

    def price_index(self, price):
        return int(price / self.price_step - self.min_price / self.price_step)

    def calculate_sale_probs(self, prices, competitor_prices, ranks, coeff_intercept, coeff_price_A, coeff_price_B,
                             coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        max_prob = lambda i: coeff_intercept + \
                             coeff_price_A * prices[0, i] + \
                             coeff_price_B * prices[1, i] + \
                             coeff_min_comp_A * min(competitor_prices[0, j, i] for j in self.competitors) + \
                             coeff_min_comp_B * min(competitor_prices[1, j, i] for j in self.competitors) + \
                             coeff_rank_A * ranks[0, i] + \
                             coeff_rank_B * ranks[1, i]

        return [max(0, round(np.random.uniform(0, min(1, max_prob(i))))) for i in self.observations]

    def get_all_competitor_prices(self, competitor_prices, observation):
        for i in self.products:
            for j in self.competitors:
                yield competitor_prices[i, j, observation]

    def get_explanatory_vars(self, product, ranks, prices, competitor_prices):
        explanatory_1 = [1] * self.observations_count
        explanatory_2 = [ranks[product, k] for k in self.observations]
        explanatory_3 = [prices[product, k] - min(self.get_all_competitor_prices(competitor_prices, k)) for k in self.observations]
        explanatory_4 = [prices[product, k] - min(prices[i, k] for i in self.products) for k in self.observations]
        explanatory_5 = list(map(lambda x: math.pow(x, 2), explanatory_4))

        return np.matrix([explanatory_1, explanatory_2, explanatory_3, explanatory_4, explanatory_5])
