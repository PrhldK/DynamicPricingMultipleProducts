$(document).ready(function() {
    const ownColors = ['#d50000', '#3f51b5'];
    const competitorColors = ['#ff6d00', '#00c853', '#c6ff00', '#b388ff', '#795548', '#e91e63', '#4a148c', '#1a237e', '#009688', '#607d8b'];
    const productNames = ['Product A', 'Product B'];

    var priceStep = 0.5;
    var minPrice, maxPrice, competitorCount, simulationLength;


    // Initialize price range slider
    var priceRangeSlider = $('#simulationPriceRange').get(0);
    noUiSlider.create(priceRangeSlider, {
        start: [1, 20],
        connect: true,
        step: 0.5,
        range: {
            'min': 0,
            'max': 50
        },
        format: wNumb({
            decimals: 1
        })
    });


    $('#btnGenerateSimulationPrices').click(function() {
        competitorCount = parseInt($('#simulationCompetitorCount').val());
        minPrice = priceRangeSlider.noUiSlider.get()[0];
        maxPrice = priceRangeSlider.noUiSlider.get()[1];

        // Show preloader and hide results
        $('#simulationResults').addClass('hide');

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
                // Fill and show competitor price table
                fillCompetitorTable(res.competitorPrices);
                $('.simulation-competitor-container').removeClass('hide');

                // Enable simulation button
                $('#btnStartSimulation').removeClass('disabled');
            }
        });
    });

    $('#btnStartSimulation').click(function() {
        // Get simulation length parameter
        simulationLength = parseInt($('#simulationSteps').val());

        // Disable controls
        $('#simulation-container .btn').addClass('disabled');
        $('#simulation-container').find('input, #simulationPriceRange').attr('disabled', true);

        // Show preloader
        $('.simulation-preloader-2').removeClass('hide');
        $('#simulationResults').addClass('hide');

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
                competitorPrices: JSON.stringify(getCompetitorPrices())
            },
            dataType: 'json',
            success: function(res) {
                // Render charts
                renderPricesChart($('.simulation-chart.prices'), res.prices);
                renderSalesCharts($('.simulation-chart.sales'), res.sales);
                renderCompetitorChart($('.simulation-chart.competitor.a'), res.prices, res.competitorPrices, 0);
                renderCompetitorChart($('.simulation-chart.competitor.b'), res.prices, res.competitorPrices, 1);
                renderProfitChart($('.simulation-chart.profit'), res.profit, simulationLength);
                renderNaiveComparisonChart($('.simulation-chart.naive-comparison'), res.profit, res.naiveProfit, simulationLength);

                // Show results
                $('.simulation-preloader-2').addClass('hide');
                $('#simulationResults').removeClass('hide');

                // Reflow highchart to correctly size it
                $('.simulation-chart').each(function() {
                    $(this).highcharts().reflow();
                });
            },
            complete: function() {
                // Enable controls
                $('#simulation-container .btn').removeClass('disabled');
                $('#simulation-container').find('input, #simulationPriceRange').attr('disabled', false);
            }
        });
    });

    // Workaround to correctly size charts in hidden divs
    $('#simulationResults .collapsible-header').attrchange({
        trackValues: true,
        callback: function(e) {
            if(e.attributeName === 'class' && e.newValue.indexOf('active') !== -1) {
                $(this).parent().find('.simulation-chart').each(function() {
                   $(this).highcharts().reflow();
                });
            }
        }
    });

    function fillCompetitorTable(competitorPrices) {

        // Remove existing rows
        $('#simulationCompetitorPricesTable > tr').remove();

        for(var i = 0; i < competitorPrices.length; i++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('Competitor ' + (i + 1))
                .appendTo(row);

            // Add prices for each product to row
            for(var j = 0; j < competitorPrices[i].length; j++) {
                var input = $('<input />', {
                    type: 'number'
                })
                    .addClass('small')
                    .val(competitorPrices[i][j].toFixed(2));
                var unitSpan = $('<span />')
                    .text('€');

                $('<td />')
                    .append(input)
                    .append(unitSpan)
                    .appendTo(row);
            }

            // Append row to table
            $('#simulationCompetitorPricesTable').append(row);
        }
    }

    function getCompetitorPrices() {
        var competitorPrices = [];
        $('#simulationCompetitorPricesTable > tr').each(function() {
            var prices = [];
            $(this).find('input').each(function() {
                var price = parseFloat($(this).val());
                price = Math.round(price * 2) / 2;

                prices.push(price);
            });

            competitorPrices.push(prices);
        });

        return competitorPrices;
    }

    function renderPricesChart(container, prices) {
        var series = prices.map(function(value, index) {
            return {
                name: productNames[index],
                data: value,
                lineWidth: 1,
                color: ownColors[index],
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
                },
                labels: {
                    formatter: function () {
                        return this.value.toFixed(2) + '€';
                    }
                }
            },
            series: series
        });
    }

    function renderSalesCharts(container, sales) {
        var series = sales.map(function(value, index) {
            return {
                name: productNames[index],
                data: value,
                lineWidth: 1,
                color: ownColors[index],
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

    function renderCompetitorChart(container, prices, competitorPrices, productIndex) {
        var series = [{
            name: 'Own price',
            data: prices[productIndex],
            lineWidth: 3,
            color: ownColors[0],
            marker: {
                enabled: false
            }
        }].concat(competitorPrices[productIndex].map(function(value, index) {
            return {
                name: 'Competitor ' + (index + 1),
                data: value,
                lineWidth: 1,
                color: competitorColors[index],
                marker: {
                    enabled: false
                }
            };
        }));

        container.highcharts({
            title: {
                text: 'Competitor Prices ' + productNames[productIndex]
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
                },
                labels: {
                    formatter: function () {
                        return this.value.toFixed(2) + '€';
                    }
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
            color: '#009688',
            marker: {
                enabled: false
            }
        }].concat(profits.map(function(value, index) {
            return {
                name: productNames[index],
                data: value,
                lineWidth: 1,
                color: ownColors[index],
                marker: {
                    enabled: false
                }
            };
        }));

        container.highcharts({
            title: {
                text: 'Own Profit'
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
                },
                labels: {
                    formatter: function () {
                        return this.value.toFixed(2) + '€';
                    }
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
                color: '#009688',
                marker: {
                    enabled: false
                }
            },
            {
                name: 'Naive overall profit',
                data: sumProfits(naiveProfits, simulationLength),
                lineWidth: 1,
                color: '#f44336',
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
                },
                labels: {
                    formatter: function () {
                        return this.value.toFixed(2) + '€';
                    }
                }
            },
            series: series
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
