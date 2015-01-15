<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading">Online Players</div>
    <div class="panel-body widget-topplayerslist" style="height:130px">
        <canvas id="mcCanvas" style="border:1px solid #000000;margin-left:auto;margin-right:auto;display:block;" width="280" height="100">Your browser does not support the HTML5 canvas tag.</canvas>
    </div>
</div>
</div>

<script>
var canvas = document.getElementById("mcCanvas");
var ctx = canvas.getContext("2d");

var range = 3;
var maxValue = 20;
var yStep = 100 / maxValue;

function drawGraph() {
    var y = maxValue/2;
    ctx.moveTo(0,y*yStep);

    for(var x = 0; x <= 280; x += 8) {
        var a = Math.floor((Math.random() * (range * 2 + 1)) - (range));
        y = y + a;
        if(y<0) y = 0;
        if(y*yStep>maxValue*yStep) y = maxValue;
        ctx.lineTo(x,y*yStep);
        ctx.moveTo(x,y*yStep);
        ctx.stroke();
    }
}

function writeMessage(message) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '9pt Calibri';
    ctx.fillStyle = 'black';
    ctx.fillText(message, 10, 25);
}

function getMousePos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
        y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
    };
}

canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(evt);
    var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
    writeMessage(message);
}, false);
</script>