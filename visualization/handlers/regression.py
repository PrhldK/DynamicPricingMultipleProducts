import json

import tornado.web

from core.regression import LogisticRegressor


class RegressionHandler(tornado.web.RequestHandler):
    def get(self):
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

        regressor = LogisticRegressor(1, 20, 0.1, 5, 1000)
        betas = regressor.train_iteratively((coeff_A_intercept, coeff_B_intercept),
                                            (coeff_A_price_A, coeff_B_price_A),
                                            (coeff_A_price_B, coeff_B_price_B),
                                            (coeff_A_min_comp_A, coeff_B_min_comp_A),
                                            (coeff_A_min_comp_B, coeff_B_min_comp_B),
                                            (coeff_A_rank_A, coeff_B_rank_A),
                                            (coeff_A_rank_B, coeff_B_rank_B))

        self.write(json.dumps(betas))


