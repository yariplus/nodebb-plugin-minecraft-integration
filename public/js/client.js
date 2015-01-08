"use strict";

/*global hljs, RELATIVE_PATH*/

/*$(window).bind("load", function() {*/
$(function () {
    $('body').tooltip({
        selector: '.has-tooltip'
    });
	$('body').popover({
        selector: '.has-popover'
    });
});
