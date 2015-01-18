"use strict";
/*global define, ajaxify, RELATIVE_PATH*/

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
        $('input.ajaxInputColorPicker').each(function(index){
            var MCWECP = $(this);
            var id = 'ajaxInputColorPicker' + index;
            MCWECP.attr('id',id);
            $('#'+id).ColorPicker({
                color: MCWECP.val() || '#000',
                onChange: function(hsb, hex) {
                    MCWECP.val(hex);
                    MCWECP.css('color', '#' + hex);
                    if(hsb.b > 75) {
                        MCWECP.css('background', '#111111');
                    }else{
                        MCWECP.css('background', '#ffffff');
                    }
                },
                onShow: function(colpkr) {
                    $(colpkr).css('z-index', 1051);
                }
            })
            .bind('keyup', function(){
                MCWECP.ColorPickerSetColor(MCWECP.val());
            });
        });
        
        $('input.ajaxSelectSibling').each(function(index){
            var MCWESN = $(this);
            MCWESN.prev().val($(this).val());
            MCWESN.prev().on('change', function(){
                MCWESN.val($(this).val())
            });
        });
    }
});