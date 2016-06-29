$(document).ready(function() {
    $('#btnStartRegression').click(function() {
        $.getJSON('/regression', {
            coeffAIntercept: $('#coeffAIntercept').val(),
            coeffAPriceA: $('#coeffAPriceA').val(),
            coeffAPriceB: $('#coeffAPriceB').val(),
            coeffAMinCompA: $('#coeffAMinCompA').val(),
            coeffAMinCompB: $('#coeffAMinCompB').val(),
            coeffARankA: $('#coeffARankA').val(),
            coeffARankB: $('#coeffARankB').val(),

            coeffBIntercept: $('#coeffBIntercept').val(),
            coeffBPriceA: $('#coeffBPriceA').val(),
            coeffBPriceB: $('#coeffBPriceB').val(),
            coeffBMinCompA: $('#coeffBMinCompA').val(),
            coeffBMinCompB: $('#coeffBMinCompB').val(),
            coeffBRankA: $('#coeffBRankA').val(),
            coeffBRankB: $('#coeffBRankB').val()
        }, function(betas) {
            // Remove existing beta rows
            $("#betaResults > tr").remove();

            var betaCounts = betas.map(function(value) {
               return value.length;
            });
            var minBetaCount = Math.min.apply(Math, betaCounts);
            for(var j = 0; j < minBetaCount; j++) {
                // Create new row
                var row = $('<tr />');
                $('<td />')
                    .text('$\\beta_' + j + '$')
                    .appendTo(row);

                // Add betas for each product to row
                for(var i = 0; i < betas.length; i++) {
                    $('<td />')
                        .text(Math.round(betas[i][j] * 10000) / 10000)
                        .appendTo(row);
                }

                // Append row to table
                $('#betaResults').append(row);
            }

            // Render mathjax content
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'betaResults']);
        });
    });
});