import numpy as np

from core.helpers import *


class SalesGenerator:
    def __init__(self, min_price, max_price, price_step, competitor_count, formula, coefficients=None):
        self.formula = formula
        self.coefficients = coefficients
        self.competitor_count = competitor_count

        self.products = range(2)
        self.price_range = get_price_range(min_price, max_price, price_step)

    def generate(self, observations_count, coefficients=None, prices=None, competitor_prices=None):
        # Get static coefficients, if not provided
        if coefficients is None:
            if self.coefficients is None:
                raise ValueError('You have to provide coefficients when creating the object or when calling generate.')
            coefficients = self.coefficients

        # Generate prices, if not provided
        if prices is None:
            prices = np.array([generate_prices(self.price_range) for i in range(observations_count)])
        if competitor_prices is None:
            competitor_prices = generate_competitor_prices(self.price_range, self.competitor_count, observations_count)

        # Calculate price ranks
        ranks = calculate_ranks(prices, competitor_prices, observations_count)

        # Calculate sale probabilities
        sale_probs = [self.get_sale_probs(i, prices, competitor_prices, ranks, coefficients[i], observations_count)
                      for i in self.products]

        return prices, competitor_prices, ranks, sale_probs

    def get_sale_probs(self, product, prices, competitor_prices, ranks, coefficients, observations_count):
        max_prob = lambda k: self.formula(product, prices[k], competitor_prices[k], ranks[k], coefficients)

        return [max(0, round(np.random.uniform(0, min(1, max_prob(k))))) for k in range(observations_count)]


class SalesGeneratorFactory:
    def __init__(self, min_price, max_price, price_step, competitor_count):
        self.min_price = min_price
        self.max_price = max_price
        self.price_step = price_step
        self.competitor_count = competitor_count

    def create_simple(self):
        coefficients = [
            [1, 0.3, 0.05, -0.0125, 0.25],
            [1, 0.3, 0.05, 0.0125, 0.25],
        ]

        return self.create_generator(SalesGeneratorFactory.simple_formula, coefficients)

    def create_extended(self):
        return self.create_generator(SalesGeneratorFactory.extended_formula)

    def create_generator(self, formula, coefficients=None):
        return SalesGenerator(self.min_price, self.max_price, self.price_step, self.competitor_count,
                              formula, coefficients)

    @classmethod
    def simple_formula(cls, product, prices, competitor_prices, ranks, coefficients):
        other_product = (product + 1) % 2

        return coefficients[0] - \
               ((coefficients[1] * ranks[product]) / (len(competitor_prices) + 1)) - \
               coefficients[2] * prices[product] + \
               (coefficients[3] * (prices[product] - prices[other_product]) + coefficients[4])

    @classmethod
    def extended_formula(cls, product, prices, competitor_prices, ranks, coefficients):
        other_product = (product + 1) % 2

        return coefficients[0] + \
               coefficients[1] * prices[product] + \
               coefficients[2] * prices[other_product] + \
               coefficients[3] * min(competitor_prices[product, j] for j in range(len(competitor_prices[product]))) + \
               coefficients[4] * min(competitor_prices[other_product, j] for j in range(len(competitor_prices[other_product]))) + \
               coefficients[5] * ranks[product] + \
               coefficients[6] * ranks[other_product]

