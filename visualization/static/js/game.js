$(document).ready(function() {
    var rawValues, optimalPrices;

    $('#btnGenerateSituation').click(function() {
        var competitorCount = $('#competitorCount').val();

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
            url: '/bellman',
            data: {
                competitorsCount: competitorCount
            },
            dataType: 'json',
            success: function(res) {
                // Set solution globally
                rawValues = res.rawValues;
                optimalPrices = res.optimalPrices;

                // Fill and show competitor price table
                fillCompetitorTable(res.competitorPrices, competitorCount);
                $('.competitor-price-table').removeClass('hide');

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
    });

    function fillCompetitorTable(competitorPrices, competitorCount) {
        // Remove existing beta rows
        $('.competitor-price-table > tr').remove();

        for(var j = 0; j < competitorCount; j++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('Competitor ' + (j + 1))
                .appendTo(row);

            // Add prices for each product to row
            for(var i = 0; i < competitorPrices.length; i++) {
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