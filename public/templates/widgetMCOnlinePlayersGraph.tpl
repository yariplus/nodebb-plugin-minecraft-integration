<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading">{title}</div>
    <div class="status-widget">
        <canvas id="mcCanvas{cid}" class="widgetFillCanvas" style="border:1px solid #000000;margin-left:auto;margin-right:auto;display:block;">Your browser does not support the HTML5 canvas tag.</canvas>
    </div>
</div>
</div>

<script type="text/javascript" src="/vendor/chart.js/chart.min.js?v=v0.6.0"></script>

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

var mcCanvas{cid} = $('#mcCanvas{cid}');
var mcCanvasContext{cid} = $('#mcCanvas{cid}')[0].getContext("2d");

$(window).on('resize', function (event) {
    $(mcCanvas{cid}).attr('width', $(mcCanvas{cid}).parent().width());
    $(mcCanvas{cid}).attr('height', $(mcCanvas{cid}).parent().width() / 3);
    myLine = new Chart(mcCanvasContext{cid}).Line(mcCanvas{cid}Data, mcCanvas{cid}Options);
}).trigger('resize');

</script>