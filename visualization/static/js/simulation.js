$(document).ready(function() {
    $('#btnGenerateSituation-simulation').click(function() {
        var competitorCount = $('#competitorCount-simulation').val();
        var simulationSteps = $('#simulationLength-simulation').val();
        var minPrice = $('#priceRangeBegin-simulation').val();
        var maxPrice = $('#priceRangeEnd-simulation').val();

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
                competitorsCount: competitorCount
            },
            dataType: 'json',
            success: function(res) {
                // Fill and show competitor price table
                fillCompetitorTable(res.competitorPrices, competitorCount);
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

    function fillCompetitorTable(competitorPrices, competitorCount) {

        // Remove existing rows
        $('#competitor-price-table--simulation > tr').remove();

        for(var j = 0; j < competitorCount; j++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('Competitor ' + (j + 1))
                .appendTo(row);



            // Add prices for each product to row
            for(var i = 0; i < competitorPrices.length; i++) {
              var input = document.createElement("input");
              input.type = "number";
              input.className = "-small";
              input.value = competitorPrices[i][j].toFixed(2);
              $('<td />').append(input)
                  .appendTo(row);
            }

            // Append row to table
            $('#competitor-price-table--simulation').append(row);
        }
    }
});
