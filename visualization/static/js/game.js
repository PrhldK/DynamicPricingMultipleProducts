$(document).ready(function() {
    var rawValues, optimalPrices;

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
                var minPrice = res.minPrice;
                var maxPrice = res.maxPrice;
                var priceStep = res.priceStep;
                var competitorPrices = res.competitorPrices;

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
        var priceA = parseFloat($('.game-price-input.a').val());
        var priceB = parseFloat($('.game-price-input.b').val());

        // Show correct result
        $('.game-result').addClass('hide');
        if(optimalPrices[0].toFixed(2) === priceA.toFixed(2) && optimalPrices[1].toFixed(2) == priceB.toFixed(2)) {
            $('.game-result.success').removeClass('hide');
        }
        else {
            $('.game-result.fail').removeClass('hide');
        }
    });

    $('#btnSolveGame').click(function() {
        $('.optimal-price.a').text(optimalPrices[0].toFixed(2));
        $('.optimal-price.b').text(optimalPrices[1].toFixed(2));
        $('.game-result.solution').removeClass('hide');
    });
});
