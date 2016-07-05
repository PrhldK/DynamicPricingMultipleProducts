import math
import itertools

from core.helpers import *


class BellmanCalculator:
    def __init__(self, min_price, max_price, price_step, initial_competitor_prices, betas, delta):
        self.min_price = min_price
        self.max_price = max_price
        self.price_step = price_step
        self.betas = betas
        self.delta = delta

        self.products = range(2)
        self.competitors = range(len(initial_competitor_prices))
        self.price_range = get_price_range(self.min_price, self.max_price, self.price_step)
        self.price_indices = get_price_indices(self.min_price, self.max_price, self.price_step)

        self.explanatory_vars = [self.build_explanatory_vars(i, np.array(initial_competitor_prices))
                                 for i in self.products]

    def calculate(self):
        sale_probs = self.calculate_sale_probs(self.betas, self.explanatory_vars)
        opt_prices, bellman_results = self.bellman(sale_probs)
        return sale_probs, opt_prices, bellman_results

    def recalculate(self, competitor_prices):
        self.update_explanatory_vars(competitor_prices)
        return self.calculate()

    def build_explanatory_vars(self, product_index, competitor_prices):
        def price(price_A, price_B, index):
            return (price_A, price_B)[index]

        def current_price(price_A, price_B):
            return price(price_A, price_B, product_index)

        def other_price(price_A, price_B):
            return price(price_A, price_B, (product_index + 1) % 2)

        explanatory_1 = np.array([[1] * len(self.price_range)] * len(self.price_range))

        explanatory_2 = np.array([[1 + len([1 for j in self.competitors
                                            if competitor_prices[j, product_index] < current_price(price_A, price_B)])
                                   for price_B in self.price_range] for price_A in self.price_range])

        explanatory_3 = np.array([[current_price(price_A, price_B) - competitor_prices.min()
                                   for price_B in self.price_range] for price_A in self.price_range])

        explanatory_4 = np.array([[current_price(price_A, price_B) - other_price(price_A, price_B)
                                   for price_B in self.price_range] for price_A in self.price_range])

        explanatory_5 = np.array([[math.pow(explanatory_4[self.price_indices[price_A], self.price_indices[price_B]], 2)
                                   for price_B in self.price_range] for price_A in self.price_range])

        return np.array([explanatory_1, explanatory_2, explanatory_3, explanatory_4, explanatory_5])

    def update_explanatory_vars(self, competitor_prices):
        for i in self.products:
            def current_price(price_A, price_B):
                return (price_A, price_B)[i]

            self.explanatory_vars[i][1] = np.array([[1 + len([1 for j in self.competitors if competitor_prices[j, i] < current_price(price_A, price_B)])
                                                     for price_B in self.price_range] for price_A in self.price_range])

            self.explanatory_vars[i][2] = np.array([[current_price(price_A, price_B) - competitor_prices.min()
                                                     for price_B in self.price_range] for price_A in self.price_range])

    def calculate_sale_probs(self, beta, explanatory_vars):
        sale_probs = np.empty(shape=(2, 2, len(self.price_range), len(self.price_range)))
        for i in self.products:
            for price_A in self.price_range:
                for price_B in self.price_range:
                    L = sum([beta[i][l] * explanatory_vars[i][l, self.price_indices[price_A], self.price_indices[price_B]]
                             for l in range(len(beta[i]))])
                    p = np.exp(L) / (1 + np.exp(L))
                    sale_probs[0, i, self.price_indices[price_A], self.price_indices[price_B]] = 1 - p
                    sale_probs[1, i, self.price_indices[price_A], self.price_indices[price_B]] = p

        return sale_probs

    def bellman(self, sale_probs):
        bellman_results = np.empty(shape=(len(self.price_range), len(self.price_range)))
        for prices in itertools.product(self.price_range, repeat=2):
            result = 1 / (1 - self.delta) * sum(sum(sale_probs[e, i, self.price_indices[prices[0]], self.price_indices[prices[1]]] * e * prices[i]
                                                    for e in range(2))
                                                for i in self.products)
            bellman_results[self.price_indices[prices[0]], self.price_indices[prices[1]]] = result

        argmax = np.unravel_index(bellman_results.argmax(), bellman_results.shape)
        opt_price_A = self.price_range[argmax[0]]
        opt_price_B = self.price_range[argmax[1]]
        opt_prices = (opt_price_A, opt_price_B)

        return opt_prices, bellman_results
