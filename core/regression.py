import math

from sklearn.linear_model import LogisticRegression

from core.helpers import *


class LogisticRegressor:
    def __init__(self, sales_generator, observations_count):
        self.sales_generator = sales_generator
        self.observations_count = observations_count

        self.products = range(2)
        self.observations = range(self.observations_count)

    def train(self, coefficients=None):
        # Calculate sale probabilities
        prices, competitor_prices, ranks, sale_probs = self.sales_generator.generate(self.observations_count, coefficients)

        # Run regression
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        coeffs = [self.fit_model(explanatory_vars[i], sale_probs[i]) for i in self.products]

        return coeffs

    def train_iteratively(self, coefficients=None):
        # Calculate sale probabilities
        prices, competitor_prices, ranks, sale_probs = self.sales_generator.generate(self.observations_count, coefficients)

        # Determine lower observations count bound depending on generated situation
        min_observations = 2
        max_observations = self.observations_count
        observations_count = max_observations - min_observations + 1
        for k in range(min_observations, max_observations + 1):
            if all([len(np.unique(sale_probs[i][:k])) == 2 for i in self.products]):
                min_observations = k
                break

        # Run regressions
        explanatory_vars = [self.get_explanatory_vars(i, ranks, prices, competitor_prices) for i in self.products]
        coeffs = np.empty(shape=(observations_count, 2, len(explanatory_vars[0])))
        for k in range(min_observations, max_observations + 1):
            coeffs[k - min_observations] = [self.fit_model(explanatory_vars[i], sale_probs[i], k) for i in self.products]

        sale_probs = np.swapaxes(sale_probs, 0, 1)
        coeffs = np.swapaxes(np.swapaxes(coeffs, 0, 1), 1, 2).tolist()

        return coeffs, prices, competitor_prices, sale_probs, min_observations, max_observations

    def get_explanatory_vars(self, product, ranks, prices, competitor_prices):
        explanatory_1 = [1] * self.observations_count
        explanatory_2 = [ranks[k, product] for k in self.observations]
        explanatory_3 = [prices[k, product] - np.min(competitor_prices[k]) for k in self.observations]
        explanatory_4 = [prices[k, product] - min(prices[k, i] for i in self.products) for k in self.observations]
        explanatory_5 = list(map(lambda x: math.pow(x, 2), explanatory_4))

        return np.matrix([explanatory_1, explanatory_2, explanatory_3, explanatory_4, explanatory_5])

    def fit_model(self, explanatory_vars, sale_probs, n=None):
        if n is None:
            n = len(sale_probs)

        regressor = LogisticRegression(fit_intercept=False)
        model = regressor.fit(explanatory_vars.transpose()[:n], sale_probs[:n])
        coeffs = model.coef_[0].tolist()

        return coeffs
