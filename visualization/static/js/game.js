$(document).ready(function() {
    var minPrice, maxPrice, priceStep, competitorPrices, rawValues, optimalPrices, tries;

    $('#btnStartGame').click(function() {
        var competitorsCount = $('#gameCompetitorCount').val();

        // Reset game
        $('#gamePriceA').val('');
        $('#gamePriceB').val('');
        $('.game-price-input').prop('disabled', true);
        $('#btnCheckPrices').addClass('disabled');
        $('#btnSolveGame').addClass('disabled');
        $('#gameCompetitorPricesContainer').addClass('hide');
        $('#gamePriceCombinationCheck').addClass('hide');
        $('.game-result').addClass('hide');
        $('.surface-plot-container').addClass('hide');

        // Show preloader and hide results
        $('#btnStartGame').addClass('disabled');
        $('.game-preloader').removeClass('hide');

        $.ajax({
            type: 'GET',
            url: '/competitors',
            data: {
                competitorsCount: competitorsCount,
                priceStep: 0.1
            },
            dataType: 'json',
            success: function(res) {
                // Store situation globally
                minPrice = res.minPrice;
                maxPrice = res.maxPrice;
                priceStep = res.priceStep;
                competitorPrices = res.competitorPrices;

                // Reset tries array
                tries = [];

                // Fill and show competitor price table
                fillCompetitorTable(competitorPrices);
                $('.competitor-price-table').removeClass('hide');

                // Request optimal prices for generated competitor prices
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
                        // Store results globally
                        rawValues = res.rawValues;
                        optimalPrices = res.optimalPrices;

                        // Fill in optimal prices
                        $('.optimal-price.a').text(optimalPrices[0].toFixed(2));
                        $('.optimal-price.b').text(optimalPrices[1].toFixed(2));

                        // Enable game inputs
                        $('.game-price-input').prop('disabled', false);
                        $('#btnCheckPrices').removeClass('disabled');
                    },
                    complete: function() {
                        // Hide loading indicators
                        $('#btnStartGame').removeClass('disabled');
                        $('#btnSolveGame').removeClass('disabled');
                        $('.game-preloader').addClass('hide');
                        $('#gamePriceCombinationCheck').removeClass('hide');
                        $('#gameCompetitorPricesContainer').removeClass('hide');
                    }
                });
            }
        });
    });


    $('#btnCheckPrices').click(function() {
        // Get prices
        var optimalPriceA = optimalPrices[0];
        var optimalPriceB = optimalPrices[1];
        var priceA = parseFloat($('.game-price-input.a').val());
        var priceB = parseFloat($('.game-price-input.b').val());

        // Add try to tries list
        var tried = tries.some(function(combination) {
            return combination[0] === priceA && combination[1] === priceB;
        });
        if(!tried) {
            tries.push([priceA, priceB]);
        }

        // Show correct result
        $('.game-result').addClass('hide');
        if(optimalPrices[0].toFixed(2) === priceA.toFixed(2) && optimalPrices[1].toFixed(2) == priceB.toFixed(2)) {
            // Show result
            $('.tries-count').text(tries.length);
            $('.game-result.success').removeClass('hide');

            // Render surface plot
            $('.surface-plot-container').removeClass('hide');
            renderSurfacePlot($('.surface-plot-container'), rawValues);
        }
        else {
            // Show profit difference
            var profitDifference = getExpectedProfit(optimalPriceA, optimalPriceB) - getExpectedProfit(priceA, priceB);
            $('.profit-difference').text(profitDifference.toFixed(2));

            // Show number of remaining tries
            var remainingTries = Math.pow(rawValues.length, 2) - tries.length;
            $('.remaining-tries').text(remainingTries);

            // Show result
            $('.game-result.fail').removeClass('hide');
        }
    });


    $('#btnSolveGame').click(function() {
        $('.game-result').addClass('hide');
        $('.game-result.solution').removeClass('hide');

        // Render surface plot
        $('.surface-plot-container').removeClass('hide');
        renderSurfacePlot($('.surface-plot-container'), rawValues);
    });


    function fillCompetitorTable(competitorPrices) {
        // Remove existing beta rows
        $('.competitor-price-table > tr').remove();

        for(var i = 0; i < competitorPrices.length; i++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('Competitor ' + (i + 1))
                .appendTo(row);

            // Add prices for each product to row
            for(var j = 0; j < competitorPrices[i].length; j++) {
                $('<td />')
                    .text(competitorPrices[i][j].toFixed(2) + '€')
                    .appendTo(row);
            }

            // Append row to table
            $('.competitor-price-table').append(row);
        }
    }

    function getExpectedProfit(priceA, priceB) {
        return rawValues[getPriceIndex(priceA)][getPriceIndex(priceB)];
    }

    function getPriceIndex(price) {
        return parseInt(price / priceStep - minPrice / priceStep);
    }

    function renderSurfacePlot(container, values) {
        var data = new vis.DataSet();
        for(var i = 0; i < values.length; i+=5) {
            for (var j = 0; j < values[i].length; j+=5) {
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

        return new vis.Graph3d(container.get(0), data, {
            style: 'surface',
            width: container.parent().width(),
            height: '600px',
            showPerspective: true,
            showGrid: true,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: 0.5,
            xLabel: 'Price A',
            yLabel: 'Price B',
            zLabel: 'Expected profit',
            xValueLabel: formatLabel,
            yValueLabel: formatLabel,
            zValueLabel: function(value) {
                return value + '€';
            }
        });
    }
});
