import numpy as np


def get_price_range(min_price, max_price, price_step):
    return np.arange(min_price, max_price + price_step, price_step)


def generate_prices(prices_range, observations_count):
    return np.random.choice(prices_range, observations_count)


def generate_competitor_prices(price_range, competitors_count, observations_count=None):
    if observations_count:
        return np.array([[generate_prices(price_range, observations_count) for j in range(competitors_count)]
                         for i in range(2)])
    else:
        return np.array([generate_prices(price_range, competitors_count)
                         for i in range(2)])
