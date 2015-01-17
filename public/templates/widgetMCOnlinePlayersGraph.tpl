<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading">{title}</div>
    <div class="panel-body widget-topplayerslist" style="height:130px">
        <canvas id="mcCanvas{cid}" style="border:1px solid #000000;margin-left:auto;margin-right:auto;display:block;" width="280" height="100">Your browser does not support the HTML5 canvas tag.</canvas>
    </div>
</div>
</div>

<script type="text/javascript" src="/vendor/chart.js/chart.min.js?v=v0.6.0"></script>

<script>
var canvas = document.getElementById("mcCanvas{cid}");
var ctx = canvas.getContext("2d");

var options = {
    showScale: false,
    scaleShowGridLines : true,
    scaleGridLineColor : "rgba(0,0,0,.05)",
    scaleGridLineWidth : 1,
    scaleShowHorizontalLines: true,
    scaleShowVerticalLines: true,
    bezierCurve : false,
    bezierCurveTension : 0.4,
    pointDot : false,
    pointDotRadius : 4,
    pointDotStrokeWidth : 1,
    pointHitDetectionRadius : 1,
    datasetStroke : true,
    datasetStrokeWidth : 2,
    datasetFill : true,
    scaleBeginAtZero: true,
    tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Players Online"
};

var data = {
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

var myBarChart = new Chart(ctx).Line(data, options);

</script>