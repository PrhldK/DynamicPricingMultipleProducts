import json

import tornado.web

from core.regression import LogisticRegressor
from core.simulation import Simulator


class SimulationHandler(tornado.web.RequestHandler):
    # Constants
    PRICE_STEP = 0.5
    OBSERVATIONS = 1000
    DELTA = 0.99

    def get(self):
        # Get query parameter
        min_price = int(self.get_argument('minPrice'))
        max_price = int(self.get_argument('maxPrice'))
        simulation_length = int(self.get_argument('simulationLength'))
        competitor_prices = json.loads(self.get_argument('competitorPrices'))
        competitors_count = len(competitor_prices[0])

        # Run regression
        regressor = LogisticRegressor(min_price, max_price, self.PRICE_STEP,
                                      competitors_count, self.OBSERVATIONS)
        betas = regressor.train()

        # Run simulation
        simulator = Simulator(min_price, max_price, self.PRICE_STEP, competitor_prices,
                              simulation_length, betas, self.DELTA)
        simulations = simulator.simulate()

        # Write json output
        self.write(json.dumps({
            'competitorPrices': simulations[0].tolist(),
            'prices': simulations[1].tolist(),
            'sales': simulations[2].tolist(),
            'profit': simulations[3].tolist(),
            'expectedProfit': simulations[4].tolist(),
            'naiveExpectedProfit': simulations[5].tolist()
        }))
