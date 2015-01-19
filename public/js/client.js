"use strict";
/*global ajaxify*/

// I've seen the other side of rainbow
// And it was black and white

$(function () {
    $('body').tooltip({
        selector: '.has-tooltip'
    });
	$('body').popover({
        selector: '.has-popover'
    });
});

$(document).ajaxComplete(function(event, response, settings) {
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