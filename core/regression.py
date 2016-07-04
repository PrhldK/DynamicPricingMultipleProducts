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
        sale_probs, ranks, prices, competitor_prices = self.generate_situation_default()

        # Run regression
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        coeffs = [self.fit_model(explanatory_vars[i], sale_probs[i]) for i in self.products]

        return coeffs

    def train_iteratively(self, coeff_intercept, coeff_price_A, coeff_price_B,
                         coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        # Calculate sale probabilities
        sale_probs, ranks, prices, competitor_prices = self.generate_situation(coeff_intercept,
                                                                               coeff_price_A, coeff_price_B,
                                                                               coeff_min_comp_A, coeff_min_comp_B,
                                                                               coeff_rank_A, coeff_rank_B)
        # Determine lower obervations count bound depending on generated situation
        min_observations = 2
        max_observations = self.observations_count
        observations_count = max_observations - min_observations + 1
        for k in range(min_observations, max_observations + 1):
            if all([len(np.unique(sale_probs[i][:k])) == 2 for i in self.products]):
                min_observations = k
                break

        # Run regressions
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        betas = np.empty(shape=(observations_count, 2, len(explanatory_vars[0])))
        for k in range(min_observations, max_observations + 1):
            betas[k - min_observations] = [self.fit_model(explanatory_vars[i], sale_probs[i], k) for i in self.products]

        return np.swapaxes(np.swapaxes(betas, 0, 1), 1, 2).tolist(), min_observations, max_observations

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

    def generate_situation_default(self):
        # Generate prices
        prices = np.array([generate_prices(self.price_range, self.observations_count) for i in self.products])
        competitor_prices = generate_competitor_prices(self.price_range, self.competitors_count, self.observations_count)
        ranks = np.array([self.calculate_ranks(prices[i], competitor_prices[i]) for i in self.products])

        # Calculate sale probabilities
        sale_probs = [self.calculate_sale_probs_default_A(prices, ranks),
                      self.calculate_sale_probs_default_B(prices, ranks)]

        return sale_probs, ranks, prices, competitor_prices

    def calculate_ranks(self, prices, competitor_prices):
        return [1 + len([1 for j in self.competitors if competitor_prices[j, k] < prices[k]])
                for k in self.observations]

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

    def calculate_sale_probs_default_A(self, prices, ranks):
        max_prob = lambda i: 1 - ((0.3 * ranks[0, i]) / (self.competitors_count + 1)) - \
                             0.05 * prices[0, i] + \
                             (-0.0125 * (prices[0, i] - prices[1, i]) + 0.25)

        return [max(0, round(np.random.uniform(0, max_prob(i)))) for i in self.observations]

    def calculate_sale_probs_default_B(self, prices, ranks):
        max_prob = lambda i: 1 - ((0.3 * ranks[1, i]) / (self.competitors_count + 1)) - \
                             0.05 * prices[1, i] + \
                             (0.0125 * (prices[0, i] - prices[1, i]) + 0.25)

        return [max(0, round(np.random.uniform(0, max_prob(i)))) for i in self.observations]

    def get_explanatory_vars(self, product, ranks, prices, competitor_prices):
        explanatory_1 = [1] * self.observations_count
        explanatory_2 = [ranks[product, k] for k in self.observations]
        explanatory_3 = [prices[product, k] - np.min(np.swapaxes(competitor_prices, 0, 2)[k]) for k in self.observations]
        explanatory_4 = [prices[product, k] - min(prices[i, k] for i in self.products) for k in self.observations]
        explanatory_5 = list(map(lambda x: math.pow(x, 2), explanatory_4))

        return np.matrix([explanatory_1, explanatory_2, explanatory_3, explanatory_4, explanatory_5])

    def fit_model(self, explanatory_vars, sale_probs, n=None):
        if n is None:
            n = len(sale_probs)

        regressor = LogisticRegression(fit_intercept=False)
        model = regressor.fit(explanatory_vars.transpose()[:n], sale_probs[:n])
        coeffs = model.coef_[0].tolist()

        return coeffs
