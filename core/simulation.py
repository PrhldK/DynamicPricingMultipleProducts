import numpy as np

from core.bellman import BellmanCalculator
from core.helpers import *


class Simulator:
    def __init__(self, min_price, max_price, price_step, initial_competitor_prices, simulation_length, betas, delta):
        self.min_price = min_price
        self.max_price = max_price
        self.price_step = price_step
        self.initial_competitor_prices = np.array(initial_competitor_prices)
        self.simulation_length = simulation_length
        self.betas = betas
        self.delta = delta

        self.competitors_count = len(initial_competitor_prices)
        self.products = range(2)
        self.competitors = range(self.competitors_count)
        self.price_range = get_price_range(self.min_price, self.max_price, self.price_step)
        self.price_indices = get_price_indices(self.min_price, self.max_price, self.price_step)

        self.bellman_calculator = BellmanCalculator(self.min_price, self.max_price, self.price_step,
                                                    self.initial_competitor_prices, self.betas, self.delta)

    def simulate(self):
        # Run initial bellman
        sale_probs, opt_prices, bellman_results = self.bellman_calculator.calculate()

        # Competitor prices over the time period
        competitor_prices_time = np.zeros(shape=(self.simulation_length, self.competitors_count, 2))
        for i in self.products:
            for j in self.competitors:
                competitor_prices_time[0, j, i] = self.initial_competitor_prices[j, i]

        # Own prices over the time period
        prices_time = np.zeros(shape=(self.simulation_length, 2))
        prices_time[0, 0] = opt_prices[0]
        prices_time[0, 1] = opt_prices[1]

        # count number of sales
        product_sales = np.zeros(shape=(self.simulation_length, 2))
        profit_time = np.zeros(shape=(self.simulation_length, 2))
        expected_profit = np.zeros(shape=self.simulation_length)

        # Naive Prices
        naive_prices_time = np.zeros(shape=(self.simulation_length, 2))
        naive_prices_time[0, 0] = max(self.min_price, np.swapaxes(competitor_prices_time, 1, 2)[0, 0].min() - self.price_step)
        naive_prices_time[0, 1] = max(self.min_price, np.sort(np.swapaxes(competitor_prices_time, 1, 2)[0, 1])[1] - self.price_step)
        naive_product_sales = np.zeros(shape=(self.simulation_length, 2))
        naive_profit_time = np.zeros(shape=(self.simulation_length, 2))
        naive_expected_profit = np.zeros(shape=self.simulation_length)

        for step in range(1, self.simulation_length):
            calculate_bellman_again = False
            for i in self.products:
                # own sales for previous period
                sale_prob = sale_probs[i, 1, self.price_indices[prices_time[step - 1, 0]], self.price_indices[prices_time[step - 1,1]]]
                if np.random.uniform(0, 1) < sale_prob:
                    product_sales[step, i] = product_sales[step-1, i] + 1
                    profit_time[step, i] = profit_time[step-1, i] + prices_time[step-1, i]
                else:
                    product_sales[step, i] = product_sales[step-1, i]
                    profit_time[step, i] = profit_time[step-1, i]
                expected_profit[step] = bellman_results[self.price_indices[prices_time[step - 1, 0]], self.price_indices[prices_time[step - 1, 1]]]
                naive_expected_profit[step] = bellman_results[self.price_indices[naive_prices_time[step - 1, 0]], self.price_indices[naive_prices_time[step - 1, 1]]]

                # naive sales for previous period
                naive_sale_prob = sale_probs[i, 1, self.price_indices[naive_prices_time[step - 1, 0]], self.price_indices[naive_prices_time[step - 1,1]]]
                if np.random.uniform(0, 1) < naive_sale_prob:
                    naive_product_sales[step, i] = naive_product_sales[step-1, i] + 1
                    naive_profit_time[step, i] = naive_profit_time[step-1, i] + naive_prices_time[step-1, i]
                else:
                    naive_product_sales[step, i] = naive_product_sales[step-1, i]
                    naive_profit_time[step, i] = naive_profit_time[step-1, i]

                # vary competitor prices
                for j in self.competitors:
                    if np.random.uniform(0, 1) < 0.1:
                        boost = np.random.uniform(0.8, 1.2)
                        competitor_prices_time[step, j, i] = min(self.max_price, round(competitor_prices_time[step - 1, j, i] * boost, 1))
                        calculate_bellman_again = True
                    else:
                        competitor_prices_time[step, j, i] = competitor_prices_time[step-1, j, i]

            # adjust own prices for next period
            if calculate_bellman_again:
                sale_probs, opt_prices, bellman_results = self.bellman_calculator.recalculate(competitor_prices_time[step])
                prices_time[step, 0] = opt_prices[0]
                prices_time[step, 1] = opt_prices[1]
            else:
                prices_time[step, 0] = prices_time[step-1, 0]
                prices_time[step, 1] = prices_time[step-1, 1]

            # adjust naive prices for next period
            naive_prices_time[step, 0] = max(self.min_price, round((np.swapaxes(competitor_prices_time, 1, 2)[step, 0].min() - self.price_step) * 2) / 2)
            naive_prices_time[step, 1] = max(self.min_price, round((np.sort(np.swapaxes(competitor_prices_time, 1, 2)[step, 1])[1] - self.price_step) * 2) / 2)

        # Swap axes
        prices_time = np.swapaxes(prices_time, 0, 1)
        product_sales = np.swapaxes(product_sales, 0, 1)
        profit_time = np.swapaxes(profit_time, 0, 1)

        naive_prices_time = np.swapaxes(naive_prices_time, 0, 1)
        naive_product_sales = np.swapaxes(naive_product_sales, 0, 1)
        naive_profit_time = np.swapaxes(naive_profit_time, 0, 1)

        competitor_prices_time = np.swapaxes(competitor_prices_time, 0,2)

        return competitor_prices_time, prices_time, product_sales, profit_time, naive_profit_time
