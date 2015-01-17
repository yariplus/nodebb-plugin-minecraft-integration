<div class="well">
<div class="form-horizontal" style="overflow: hidden;">
    <label class="col-sm-2 col-xs-12" for="serverNumber">Server Number</label>
    <div class="col-sm-6 col-xs-12">
        <select name="serverNumber">
            <!-- BEGIN serverConfigNames -->
            <option value="{serverConfigNames.serverNumber}">{serverConfigNames.configName}</option>
            <!-- END serverConfigNames -->
        </select>
    </div>
    <div class="col-sm-4 col-xs-12">
        
    </div>
</div>
</div>

<script type="text/javascript">

if (!isOnlinePlayersLoaded) {
    var isOnlinePlayersLoaded = true;
}

$(".serverNumber").bind("change", function () {

}).change();
    
</script>