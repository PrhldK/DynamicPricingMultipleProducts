import json

import tornado.web

from core.regression import LogisticRegressor


class RegressionHandler(tornado.web.RequestHandler):
    def get(self):
        # Define constants
        min_price = 1
        max_price = 20
        price_step = 0.1
        competitor_count = 5
        min_observations = 20
        max_observations = 1000

        # Get sale probability coefficients
        coeff_A_intercept = float(self.get_argument('coeffAIntercept'))
        coeff_A_price_A = float(self.get_argument('coeffAPriceA'))
        coeff_A_price_B = float(self.get_argument('coeffAPriceB'))
        coeff_A_min_comp_A = float(self.get_argument('coeffAMinCompA'))
        coeff_A_min_comp_B = float(self.get_argument('coeffAMinCompB'))
        coeff_A_rank_A = float(self.get_argument('coeffARankA'))
        coeff_A_rank_B = float(self.get_argument('coeffARankB'))

        coeff_B_intercept = float(self.get_argument('coeffBIntercept'))
        coeff_B_price_A = float(self.get_argument('coeffBPriceA'))
        coeff_B_price_B = float(self.get_argument('coeffBPriceB'))
        coeff_B_min_comp_A = float(self.get_argument('coeffBMinCompA'))
        coeff_B_min_comp_B = float(self.get_argument('coeffBMinCompB'))
        coeff_B_rank_A = float(self.get_argument('coeffBRankA'))
        coeff_B_rank_B = float(self.get_argument('coeffBRankB'))

        # Run regression
        regressor = LogisticRegressor(min_price, max_price, price_step, competitor_count, max_observations)
        result = regressor.train_iteratively((coeff_A_intercept, coeff_B_intercept),
                                             (coeff_A_price_A, coeff_B_price_A),
                                             (coeff_A_price_B, coeff_B_price_B),
                                             (coeff_A_min_comp_A, coeff_B_min_comp_A),
                                             (coeff_A_min_comp_B, coeff_B_min_comp_B),
                                             (coeff_A_rank_A, coeff_B_rank_A),
                                             (coeff_A_rank_B, coeff_B_rank_B),
                                             min_observations)

        self.write(json.dumps({
            'meta': {
                'minObservations': min_observations,
                'maxObservations': max_observations,
                'betaCount': min(len(x) for x in result)
            },
            'data': result
        }))


