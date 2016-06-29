import math
import numpy as np
import statsmodels.api as sm


class LogisticRegressor:
    def __init__(self, min_price, max_price, price_step, competitors_count, observations_count):
        self.min_price = min_price
        self.max_price = max_price
        self.price_step = price_step
        self.competitors_count = competitors_count
        self.observations_count = observations_count

        self.prices_ranges = [np.arange(self.min_price, self.max_price + self.price_step, self.price_step)
                              for i in range(2)]

    def train(self, coeff_intercept, coeff_price_A, coeff_price_B,
              coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        # Generate prices
        prices = np.array([self.generate_prices(self.prices_ranges[i]) for i in range(2)])
        competitor_prices = np.array([self.generate_competitor_prices(self.prices_ranges[i]) for i in range(2)])
        ranks = np.array([self.calculate_ranks(prices[i], competitor_prices[i]) for i in range(2)])

        # Calculate sale probabilities
        sale_probs = [self.calculate_sale_probs(prices, competitor_prices, ranks, coeff_intercept[i],
                                                coeff_price_A[i], coeff_price_B[i],
                                                coeff_min_comp_A[i], coeff_min_comp_B[i],
                                                coeff_rank_A[i], coeff_rank_B[i])
                      for i in range(2)]

        # Run regression
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in range(2)]
        logits = [sm.Logit(sale_probs[i], explanatory_vars[i].transpose()) for i in range(2)]
        results = [logits[i].fit() for i in range(2)]
        return [results[i].params.tolist() for i in range(2)]

    def generate_prices(self, prices_range):
        return np.random.choice(prices_range, self.observations_count)

    def generate_competitor_prices(self, prices_range):
        return np.array([self.generate_prices(prices_range)
                         for j in range(self.competitors_count)])

    def calculate_ranks(self, prices, competitor_prices):
        return [1 + len([1 for j in range(self.competitors_count) if competitor_prices[j, k] < prices[k]])
                for k in range(self.observations_count)]

    def price_index(self, price):
        return int(price / self.price_step - self.min_price / self.price_step)

    def calculate_sale_probs(self, prices, competitor_prices, ranks, coeff_intercept, coeff_price_A, coeff_price_B,
                             coeff_min_comp_A, coeff_min_comp_B, coeff_rank_A, coeff_rank_B):
        max_prob = lambda i: coeff_intercept + \
                             coeff_price_A * prices[0, i] + \
                             coeff_price_B * prices[1, i] + \
                             coeff_min_comp_A * min(competitor_prices[0, j, i] for j in range(self.competitors_count)) + \
                             coeff_min_comp_B * min(competitor_prices[1, j, i] for j in range(self.competitors_count)) + \
                             coeff_rank_A * ranks[0, i] + \
                             coeff_rank_B * ranks[1, i]

        return [max(0, round(np.random.uniform(0, min(1, max_prob(i))))) for i in range(self.observations_count)]

    def get_all_competitor_prices(self, competitor_prices, observation):
        for i in range(2):
            for j in range(self.competitors_count):
                yield competitor_prices[i, j, observation]

    def get_explanatory_vars(self, product, ranks, prices, competitor_prices):
        explanatory_1 = [1] * self.observations_count
        explanatory_2 = [ranks[product, k] for k in range(self.observations_count)]
        explanatory_3 = [prices[product, k] - min(self.get_all_competitor_prices(competitor_prices, k)) for k in range(self.observations_count)]
        explanatory_4 = [prices[product, k] - min(prices[i, k] for i in range(2)) for k in range(self.observations_count)]
        explanatory_5 = list(map(lambda x: math.pow(x, 2), explanatory_4))

        return np.matrix([explanatory_1, explanatory_2, explanatory_3, explanatory_4, explanatory_5])
