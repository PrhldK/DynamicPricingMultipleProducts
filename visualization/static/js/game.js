$(document).ready(function() {
    var minPrice, maxPrice, priceStep, competitorPrices, rawValues, optimalPrices, tries;

    $('#btnGenerateSituation').click(function() {
        var competitorsCount = $('#competitorsCount').val();

        // Reset game
        $('#gamePriceA').val('');
        $('#gamePriceB').val('');
        $('.game-result').addClass('hide');
        $('.game-price-input').prop('disabled', true);
        $('#btnCheckPrices').addClass('disabled');

        // Show preloader and hide results
        $('#btnGenerateSituation').addClass('disabled');
        $('.game-preloader').removeClass('hide');
        $('.competitor-price-table').addClass('hide');

        $.ajax({
            type: 'GET',
            url: '/competitors',
            data: {
                competitorsCount: competitorsCount
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

                        // Enable game inputs
                        $('.game-price-input').prop('disabled', false);
                        $('#btnCheckPrices').removeClass('disabled');
                    },
                    complete: function() {
                        // Hide loading indicators
                        $('#btnGenerateSituation').removeClass('disabled');
                        $('.game-preloader').addClass('hide');
                        $('.competitor-price-table').removeClass('hide');
                    }
                });
            }
        });
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


    $('#btnCheckPrices').click(function() {
        // Get prices
        var optimalPriceA = optimalPrices[0];
        var optimalPriceB = optimalPrices[1];
        var priceA = parseFloat($('.game-price-input.a').val());
        var priceB = parseFloat($('.game-price-input.b').val());

        // Show correct result
        $('.game-result').addClass('hide');
        if(optimalPrices[0].toFixed(2) === priceA.toFixed(2) && optimalPrices[1].toFixed(2) == priceB.toFixed(2)) {
            $('.game-result.success').removeClass('hide');
        }
        else {
            // Add try to tries list
            var tried = tries.some(function(combination) {
                return combination[0] === priceA && combination[1] === priceB;
            });
            if(!tried) {
                tries.push([priceA, priceB]);
            }

            // Show profit difference
            var profitDifference = getExpectedProfit(optimalPriceA, optimalPriceB) - getExpectedProfit(priceA, priceB);
            $('.profit-difference').text(profitDifference.toFixed(2));

            // Show number of remaining tries
            var remainingTries = Math.pow(rawValues.length, 2) - tries.length;
            $('.remaining-tries').text(remainingTries);

            $('.game-result.fail').removeClass('hide');
        }
    });

    $('#btnSolveGame').click(function() {
        $('.optimal-price.a').text(optimalPrices[0].toFixed(2));
        $('.optimal-price.b').text(optimalPrices[1].toFixed(2));
        $('.game-result.solution').removeClass('hide');
    });

    function getExpectedProfit(priceA, priceB) {
        return rawValues[getPriceIndex(priceA)][getPriceIndex(priceB)];
    }

    function getPriceIndex(price) {
        return price / priceStep - minPrice / priceStep;
    }
});
