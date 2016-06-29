import json

import tornado.web

from core.regression import LogisticRegressor
from core.bellman import BellmanCalculator
from core.helpers import *


class BellmanHandler(tornado.web.RequestHandler):
    # Constants
    MIN_PRICE = 1
    MAX_PRICE = 20
    PRICE_STEP = 0.1
    DELTA = 0.99
    OBSERVATIONS = 1000

    def get(self):
        # Get query parameter
        competitors_count = int(self.get_argument('competitorsCount'))

        # Generate competitor prices
        competitor_prices = generate_competitor_prices(get_price_range(self.MIN_PRICE, self.MAX_PRICE, self.PRICE_STEP),
                                                       competitors_count)

        # Run regression
        regressor = LogisticRegressor(self.MIN_PRICE, self.MAX_PRICE, self.PRICE_STEP,
                                      competitors_count, self.OBSERVATIONS)
        betas = regressor.train((1, 1), (1, 1), (1, 1), (1, 1), (1, 1), (1, 1), (1, 1))  # TODO better coefficients

        # Compute bellman
        bellman_calculator = BellmanCalculator(self.MIN_PRICE, self.MAX_PRICE, self.PRICE_STEP,
                                               competitors_count, betas, self.DELTA)
        opt_prices, bellman_results = bellman_calculator.calculate(competitor_prices)

        # Write result
        self.write(json.dumps({
            'competitorPrices': competitor_prices.tolist(),
            'optimalPrices': opt_prices,
            'rawValues': bellman_results.tolist()
        }))
