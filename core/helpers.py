import numpy as np


def get_price_range(min_price, max_price, price_step):
    return np.arange(min_price, max_price + price_step, price_step)


def get_price_indices(min_price, max_price, price_step):
    return {price: int(price / price_step - min_price / price_step)
            for price in get_price_range(min_price, max_price, price_step)}


def generate_prices(prices_range, counts=2):
    return np.random.choice(prices_range, counts)


def generate_competitor_prices(price_range, competitors_count, observations_count=None):
    if observations_count:
        return np.array([[generate_prices(price_range) for j in range(competitors_count)]
                         for i in range(observations_count)])
    else:
        return np.array([generate_prices(price_range)
                         for j in range(competitors_count)])


def calculate_ranks(prices, competitor_prices, observations_count):
    rank = lambda i, k: 1 + len([1 for j in range(len(competitor_prices[k]))
                                    if competitor_prices[k, j, i] < prices[k, i]])

    return np.array([[rank(i, k) for i in range(2)] for k in range(observations_count)])
