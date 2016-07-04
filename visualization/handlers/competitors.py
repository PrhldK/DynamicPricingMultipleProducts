import json

import tornado.web

from core.helpers import *


class CompetitorHandler(tornado.web.RequestHandler):
    # Constants
    MIN_PRICE = 1
    MAX_PRICE = 20
    PRICE_STEP = 0.5

    def get(self):
        # Get query parameter
        min_price = float(self.get_argument('minPrice', self.MIN_PRICE))
        max_price = float(self.get_argument('maxPrice', self.MAX_PRICE))
        price_step = float(self.get_argument('priceStep', self.PRICE_STEP))
        competitors_count = int(self.get_argument('competitorsCount'))

        # Generate competitor prices
        competitor_prices = generate_competitor_prices(get_price_range(min_price, max_price, price_step),
                                                       competitors_count)

        # Write json output
        self.write(json.dumps({
            'minPrice': min_price,
            'maxPrice': max_price,
            'priceStep': price_step,
            'competitorPrices': competitor_prices.tolist()
        }))
