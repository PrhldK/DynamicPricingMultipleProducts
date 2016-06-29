$(document).ready(function() {
    $('#btnStartRegression').click(function() {
        // Show preloader and hide results
        $('#btnStartRegression').addClass('disabled');
        $('.regression-preloader').removeClass('hide');
        $('.result-container').addClass('hide');

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
        }, function(res) {
            // Show results
            fillResultTable(res.meta.betaCount, res.meta.maxObservations, res.data);
            renderCharts(res.meta.minObservations, res.meta.maxObservations, res.data);

            // Hide loading indicators
            $('#btnStartRegression').removeClass('disabled');
            $('.regression-preloader').addClass('hide');
            $('.result-container').removeClass('hide');
        });
    });

    function fillResultTable(betaCount, maxObservations, data) {
        // Remove existing beta rows
        $("#betaResults > tr").remove();

        for(var j = 0; j < betaCount; j++) {
            // Create new row
            var row = $('<tr />');
            $('<td />')
                .text('$\\beta_' + j + '$')
                .appendTo(row);

            // Add betas for each product to row
            for(var i = 0; i < data.length; i++) {
                $('<td />')
                    .text(Math.round(data[i][j][maxObservations - 1] * 10000) / 10000)
                    .appendTo(row);
            }

            // Append row to table
            $('#betaResults').append(row);
        }

        // Render mathjax content
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'betaResults']);
    }

    function renderCharts(minObservations, maxObservations, data) {
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
            labels: _.range(minObservations, maxObservations),
            series: data[0]
        }, options);
        new Chartist.Line('#betaBChart', {
            labels: _.range(minObservations, maxObservations),
            series: data[1]
        }, options);
    }
});