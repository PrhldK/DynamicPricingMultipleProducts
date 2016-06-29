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

            var maxObservationCount = betas[0][0].length;
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
                        .text(Math.round(betas[i][j][maxObservationCount - 1] * 10000) / 10000)
                        .appendTo(row);
                }

                // Append row to table
                $('#betaResults').append(row);
            }

            // Render mathjax content
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'betaResults']);

            // Render charts
            var options = {
                showPoint: false,
                lineSmooth: false,
                axisX: {
                    showGrid: false,
                    labelInterpolationFnc: function(value, index) {
                        return index % 100  === 0 ? value : null;
                    }
                },
                axisY: {
                    showGrid: false
                }
            };
            new Chartist.Line('#betaAChart', {
                labels: _.range(10, 1000),
                series: betas[0]
            }, options);
            new Chartist.Line('#betaBChart', {
                labels: _.range(10, 1000),
                series: betas[1]
            }, options);
        });
    });
});