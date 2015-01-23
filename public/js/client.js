/*global ajaxify*/

// I've seen the other side of rainbow
// And it was black and white

if (!Chart) {
	$.getScript("/vendor/chart.js/chart.min.js?v=v0.6.0");
}

$(function () {
    $('body').tooltip({
        selector: '.has-tooltip'
    });
	$('body').popover({
        selector: '.has-popover'
    });
});

var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 300;
$(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
    }
});

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;
		resizeCanvases();
    }               
};

function resizeCanvases() {
	$('.canvasResizable').each(function(index){
		$(this).attr('width', $(this).parent().width());
		$(this).attr('height', $(this).parent().width() / 3);
		var data = window[$(this).attr('id') + 'Data'];
		var options = window[$(this).attr('id') + 'Options'];
		var chart = new Chart($(this)[index].getContext('2d')).Line(data, options);
	});
};

$(document).ajaxComplete(function(event, response, settings) {
	if (!!~settings.url.indexOf("/api/widgets/render")) {
		$('.widgetFillContainer').each(function(index){
			var parent = $(this).parent();
			if (!$(parent).prop('widget-area')) {
				$(parent).css('padding-top', '0').css('padding-left', '0').css('padding-right', '0').css('padding-bottom', '0');
			}
		});
		resizeCanvases();
	}
	
    if (settings.url == "/api/admin/extend/widgets") {
        $('input.ajaxSelectSibling').each(function(index){
            var MCWESN = $(this);
            MCWESN.prev().val($(this).val());
            MCWESN.prev().on('change', function(){
                MCWESN.val($(this).val())
            });
        });
        
        var IDcounter = 1;
        $('#widgets .widget-area').on('click', '.toggle-widget', function() {
            var jWidgetPanel = $(this).parents('.widget-panel').children('.panel-body');
            if ( !jWidgetPanel.hasClass('hidden') ) {
                jWidgetPanel.find('input.ajaxInputColorPicker').each(function(index){
                    var MCWECP = $(this);
                    var id = 'ajaxInputColorPicker' + IDcounter;
                    MCWECP.attr('id',id);
                    $('#'+id).ColorPicker({
                        color: MCWECP.val() || '#000',
                        onChange: function(hsb, hex) {
                            MCWECP.val(hex);
                            MCWECP.css('color', '#' + hex);
                        },
                        onShow: function(colpkr) {
                            $(colpkr).css('z-index', 1051);
                        }
                    })
                    .css('color', '#' + $(this).val())
                    .bind('keyup', function(){
                        $(this).ColorPickerSetColor($(this).val());
                        $(this).css('color', '#' + $(this).val());
                    });
                    IDcounter++;
                });
            }
        });
    }
});