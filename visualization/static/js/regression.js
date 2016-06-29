$(document).ready(function() {
    $('#btnStartRegression').click(function() {
        // Show preloader and hide results
        $('#btnStartRegression').addClass('disabled');
        $('.regression-preloader').removeClass('hide');
        $('.result-container').addClass('hide');

        $.ajax({
            type: 'GET',
            url: '/regression',
            data: {
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
            },
            dataType: 'json',
            success: function(res) {
                // Show results
                fillResultTable(res.meta.betaCount, res.meta.maxObservations, res.data);

                renderChart($('.beta-chart.a'), 'Beta Coefficients Product A',
                            res.meta.minObservations , res.meta.maxObservations, res.data[0]);
                renderChart($('.beta-chart.b'), 'Beta Coefficients Product B',
                            res.meta.minObservations , res.meta.maxObservations, res.data[1]);
            },
            complete: function() {
                // Hide loading indicators
                $('#btnStartRegression').removeClass('disabled');
                $('.regression-preloader').addClass('hide');
                $('.result-container').removeClass('hide');
            }
        });
    });

    function fillResultTable(betaCount, maxObservations, data) {
        // Remove existing beta rows
        $(".beta-table > tr").remove();

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
            $('.beta-table').append(row);
        }

        // Render mathjax content
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'betaResults']);
    }

    function renderChart(container, title, minObservations, maxObservations, data) {
        var colors = ['#f44336', '#3f51b5', '#009688', '#ff9800', '#9c27b0'];

        var series = data.map(function(value, index) {
            return {
                name: 'Beta ' + index,
                data: value,
                lineWidth: 1,
                color: colors[index]
            };
        });

        container.highcharts({
            title: {
                text: title
            },
            xAxis: {
                title: {
                    text: 'Observations'
                },
                categories: _.range(minObservations, maxObservations + 1),
                tickInterval: 100
            },
            yAxis: {
                min: -2,
                max: 2
            },
            series: series
        });
    }
});


// Global Highcharts Configuration
Highcharts.setOptions({
    chart: {
        style: {
            fontFamily: 'Roboto'
        }
    }
});