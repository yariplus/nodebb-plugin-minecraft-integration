<div class="widgetFillContainer">
    <canvas id="mcCanvas{cid}" class="canvasResizable" style="border:1px solid #000000;margin-left:auto;margin-right:auto;display:block;">Your browser does not support the HTML5 canvas tag.</canvas>
</div>

<script>

var mcCanvas{cid}Options = {
    showScale: false,
    scaleShowGridLines : true,
    scaleGridLineColor : "rgba(0,0,0,.05)",
    scaleGridLineWidth : 1,
    scaleShowHorizontalLines: true,
    scaleShowVerticalLines: true,
    bezierCurve : false,
    bezierCurveTension : 0.4,
    pointDot : true,
    pointDotRadius : 2,
    pointDotStrokeWidth : 1,
    pointHitDetectionRadius : 2,
    datasetStroke : true,
    datasetStrokeWidth : 2,
    datasetFill : true,
    scaleBeginAtZero: true,
    responsive: true,
    tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Players Online"
};

var mcCanvas{cid}Data = {
    labels: {labels},
    datasets: [
        {
            label: "",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: {onlinePlayers}
        }
    ]
};

</script>