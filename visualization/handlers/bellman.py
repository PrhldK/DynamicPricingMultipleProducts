import json

import tornado.web

from core.regression import LogisticRegressor
from core.bellman import BellmanCalculator


class BellmanHandler(tornado.web.RequestHandler):
    # Constants
    DELTA = 0.99
    OBSERVATIONS = 1000

    def get(self):
        # Get query parameter
        min_price = float(self.get_argument('minPrice'))
        max_price = float(self.get_argument('maxPrice'))
        price_step = float(self.get_argument('priceStep'))
        competitor_prices = json.loads(self.get_argument('competitorPrices'))
        competitors_count = len(competitor_prices[0])

        # Run regression
        regressor = LogisticRegressor(min_price, max_price, price_step,
                                      competitors_count, self.OBSERVATIONS)
        betas = regressor.train()

        # Compute bellman
        bellman_calculator = BellmanCalculator(min_price, max_price, price_step, competitor_prices,
                                               competitors_count, betas, self.DELTA)
        sale_probs, opt_prices, bellman_results = bellman_calculator.calculate()

        # Write result
        self.write(json.dumps({
            'optimalPrices': opt_prices,
            'rawValues': bellman_results.tolist()
        }))
