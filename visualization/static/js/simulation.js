$(document).ready(function() {
    const colors = ['#f44336', '#3f51b5', '#009688', '#ff9800', '#9c27b0'];
    var priceStep = 0.5;
    var minPrice, maxPrice, competitorCount, simulationLength, competitorPrices;


    $('#btnGenerateSituation-simulation').click(function() {
        competitorCount = parseInt($('#competitorCount-simulation').val());
        simulationLength = parseInt($('#simulationLength-simulation').val());
        minPrice = parseFloat($('#priceRangeBegin-simulation').val());
        maxPrice = parseFloat($('#priceRangeEnd-simulation').val());

        // Show preloader and hide results
        $('#btnGenerateSituation-simulation').addClass('disabled');
        $('.simulation-preloader').removeClass('hide');
        $('#competitor-price-table--simulation').addClass('hide');

        $.ajax({
            type: 'GET',
            url: '/competitors',
            data: {
                minPrice: minPrice,
                maxPrice: maxPrice,
                priceStep: priceStep,
                competitorsCount: competitorCount
            },
            dataType: 'json',
            success: function(res) {
                competitorPrices = res.competitorPrices;

                // Fill and show competitor price table
                fillCompetitorTable(competitorPrices);
                $('#competitor-price-table--simulation').removeClass('hide');
            },
            complete: function() {
                // Hide loading indicators
                $('#btnGenerateSituation-simulation').removeClass('disabled');
                $('.simulation-preloader').addClass('hide');
                $('#competitor-price-table--simulation').removeClass('hide');
                $('#btnSimulate-simulation').removeClass('hide');
            }
        });
    });

    $('#btnSimulate-simulation').click(function() {
        $('.simulation-preloader-2').removeClass('hide');
        $('.result-container--simulation').addClass('hide');

        // Calculate bellman values to render 3D plot
        $.ajax({
            type: 'GET',
            url: '/bellman',
            data: {
                minPrice: minPrice,
                maxPrice: maxPrice,
                priceStep: priceStep,
                competitorPrices: JSON.stringify(competitorPrices)
            },
            dataType: 'json',
            success: function(res) {
                renderSurfacePlot($('.simulation-surface-plot-container'), res.rawValues);
                $('#optimal-pice-A--simulation').text('Optimal Price A: ' + res.optimalPrices[0]);
                $('#optimal-pice-B--simulation').text('Optimal Price B: ' + res.optimalPrices[1]);
            }
        });

        // Start simulation
        $.ajax({
            type: 'GET',
            url: '/simulation',
            data: {
                minPrice: minPrice,
                maxPrice: maxPrice,
                priceStep: priceStep,
                competitorsCount: competitorCount,
                simulationLength: simulationLength,
                competitorPrices: JSON.stringify(competitorPrices)
            },
            dataType: 'json',
            success: function(res) {
                renderPricesChart($('.simulation-prices-container'), res.prices);
                renderSalesCharts($('.simulation-sales-container'), res.sales);
                renderCompetitorChart($('.simulation-competitor-A-container'), 'Competitor Prices Product A', res.prices[0], res.competitorPrices[0]);
                renderCompetitorChart($('.simulation-competitor-B-container'), 'Competitor Prices Product B', res.prices[1], res.competitorPrices[1]);
                renderProfitChart($('.simulation-profit-container'), res.profit, simulationLength);
                renderNaiveComparisonChart($('.simulation-naive-comparison-container'), res.profit, res.naiveProfit, simulationLength);

                $('.simulation-preloader-2').addClass('hide');
                $('.result-container--simulation').removeClass('hide');
            }
        });
    });

    function fillCompetitorTable(competitorPrices) {

        // Remove existing rows
        $('#competitor-price-table--simulation > tr').remove();

        for(var i = 0; i < competitorPrices.length; i++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('Competitor ' + (i + 1))
                .appendTo(row);

            // Add prices for each product to row
            for(var j = 0; j < competitorPrices[i].length; j++) {
                var input = $('<input />', { type: 'number' })
                    .addClass('-small')
                    .val(competitorPrices[i][j].toFixed(2));

                $('<td />').append(input)
                    .appendTo(row);
            }

            // Append row to table
            $('#competitor-price-table--simulation').append(row);
        }
    }

    function renderPricesChart(container, prices) {
        var series = prices.map(function(value, index) {
            return {
                name: 'Product ' + (index + 1),
                data: value,
                lineWidth: 1,
                color: colors[index],
                marker: {
                    enabled: false
                }
            };
        });

        container.highcharts({
            title: {
                text: 'Prices'
            },
            xAxis: {
                title: {
                    text: 'Simulation steps'
                },
                tickInterval: 10
            },
            yAxis: {
              title: {
                  text: 'Prices'
              }
            },
            series: series
        });
    }

    function renderSalesCharts(container, sales) {
        var series = sales.map(function(value, index) {
            return {
                name: 'Product ' + (index + 1),
                data: value,
                lineWidth: 1,
                color: colors[index],
                marker: {
                    enabled: false
                }
            };
        });

        container.highcharts({
            title: {
                text: 'Sales'
            },
            xAxis: {
                title: {
                    text: 'Simulation steps'
                },
                tickInterval: 10
            },
            yAxis: {
                title: {
                    text: 'Sales'
                }
            },
            series: series
        });
    }

    function renderCompetitorChart(container, title, prices, competitorPrices) {
        var series = [{
            name: 'Own price',
            data: prices,
            lineWidth: 3,
            color: colors[0],
            marker: {
                enabled: false
            }
        }].concat(competitorPrices.map(function(value, index) {
            return {
                name: 'Competitor ' + (index + 1),
                data: value,
                lineWidth: 1,
                color: colors[index + 1],
                marker: {
                    enabled: false
                }
            };
        }));

        container.highcharts({
            title: {
                text: title
            },
            xAxis: {
                title: {
                    text: 'Simulation steps'
                },
                tickInterval: 10
            },
            yAxis: {
                title: {
                    text: 'Prices'
                }
            },
            series: series
        });
    }

    function renderProfitChart(container, profits, simulationLength) {
        var series = [{
            name: 'Overall profit',
            data: sumProfits(profits, simulationLength),
            lineWidth: 1,
            color: colors[0],
            marker: {
                enabled: false
            }
        }].concat(profits.map(function(value, index) {
            return {
                name: 'Product ' + (index + 1),
                data: value,
                lineWidth: 1,
                color: colors[index + 1],
                marker: {
                    enabled: false
                }
            };
        }));

        container.highcharts({
            title: {
                text: 'Profit'
            },
            xAxis: {
                title: {
                    text: 'Simulation steps'
                },
                tickInterval: 10
            },
            yAxis: {
                title: {
                    text: 'Profit'
                }
            },
            series: series
        });
    }

    function renderNaiveComparisonChart(container, profits, naiveProfits, simulationLength) {
        var series = [
            {
                name: 'Own overall profit',
                data: sumProfits(profits, simulationLength),
                lineWidth: 1,
                color: colors[0],
                marker: {
                    enabled: false
                }
            },
            {
                name: 'Naive overall profit',
                data: sumProfits(naiveProfits, simulationLength),
                lineWidth: 1,
                color: colors[1],
                marker: {
                    enabled: false
                }
            }
        ];

        container.highcharts({
            title: {
                text: 'Strategy Compatison'
            },
            xAxis: {
                title: {
                    text: 'Simulation steps'
                },
                tickInterval: 10
            },
            yAxis: {
                title: {
                    text: 'Profit'
                }
            },
            series: series
        });
    }

    function renderSurfacePlot(container, values) {
        var data = new vis.DataSet();
        for(var i = 0; i < values.length; i++) {
            for (var j = 0; j < values[i].length; j++) {
                data.add({
                    x: i,
                    y: j,
                    z: values[i][j]
                });
            }
        }

        var formatLabel = function(value) {
            return minPrice + value * priceStep + '€';
        };

        new vis.Graph3d(container.get(0), data, {
            style: 'surface',
            showPerspective: true,
            showGrid: false,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: 0.5,
            xLabel: 'Price A',
            yLabel: 'Price B',
            zLabel: 'Expected profit',
            xValueLabel: formatLabel,
            yValueLabel: formatLabel
        });
    }


    function sumProfits(profits) {
        var summedProfits = [];
        for(var i = 0; i < simulationLength; i++) {
            summedProfits[i] = 0;
            for(var j = 0; j < profits.length; j++) {
                summedProfits[i] += profits[j][i];
            }
        }

        return summedProfits;
    }
});
