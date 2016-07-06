import json

import tornado.web

from core.simulation import Simulator
from core.sales import SalesGeneratorFactory
from core.regression import LogisticRegressor


class SimulationHandler(tornado.web.RequestHandler):
    # Constants
    OBSERVATIONS_COUNT = 1000
    DELTA = 0.99

    def get(self):
        # Get query parameter
        min_price = int(self.get_argument('minPrice'))
        max_price = int(self.get_argument('maxPrice'))
        price_step = float(self.get_argument('priceStep'))
        simulation_length = int(self.get_argument('simulationLength'))
        competitor_prices = json.loads(self.get_argument('competitorPrices'))
        competitors_count = len(competitor_prices[0])

        # Create sale generator
        sales_generator_factory = SalesGeneratorFactory(min_price, max_price, price_step, competitors_count)
        sales_generator = sales_generator_factory.create_simple()

        # Run regression
        regressor = LogisticRegressor(sales_generator, self.OBSERVATIONS_COUNT)
        betas = regressor.train()

        # Run simulation
        simulator = Simulator(min_price, max_price, price_step, competitor_prices,
                              simulation_length, betas, self.DELTA)
        simulations = simulator.simulate()

        # Write json output
        self.write(json.dumps({
            'competitorPrices': simulations[0].tolist(),
            'prices': simulations[1].tolist(),
            'sales': simulations[2].tolist(),
            'profit': simulations[3].tolist(),
            'naiveProfit': simulations[4].tolist()
        }))
