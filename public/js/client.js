"use strict";
/*global ajaxify*/

// I've seen the other side of rainbow
// And it was black and white

$(document).ready(function() {
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
}

function resizeCanvases() {
	// Find better solution, so that we can draw on widget config pages.
	if (typeof Chart == 'undefined') {
		require(['vendor/chart.js/chart.min.js'], function(Chart){
			$('.canvasResizable').each(function(i, e){
				var heightRatio = $(e).attr('height-ratio');
				heightRatio = typeof heightRatio == 'undefined' ? 3 : parseInt(heightRatio);
				heightRatio = isNaN(heightRatio) ? 3 : heightRatio < 1 ? 3 : heightRatio;
				$(e).attr('width', $(e).parent().width());
				$(e).attr('height', $(e).parent().width() / heightRatio);
				$(e).css('width', $(e).parent().width());
				$(e).css('height', $(e).parent().width() / heightRatio);
				var data = window[$(e).attr('id') + 'Data'];
				var options = window[$(e).attr('id') + 'Options'];			
				switch ($(e).attr('chart-type')) {
					case "Pie":
					case "pie":
						new Chart($(e)[0].getContext('2d')).Pie(data, options);
						break;
					case "Donut":
						new Chart($(e)[0].getContext('2d')).Pie(data, options);
						break;
					case "Line":
					case "line":
					default:
						new Chart($(e)[0].getContext('2d')).Line(data, options);
						break;
				}
			});
			var Chartjs = Chart.noConflict();
		});
	}
}

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
                MCWESN.val($(this).val());
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
                    }).css('color', '#' + $(this).val()).bind('keyup', function(){
                        $(this).ColorPickerSetColor($(this).val());
                        $(this).css('color', '#' + $(this).val());
                    });
                    IDcounter++;
                });
            }
        });
    }
});