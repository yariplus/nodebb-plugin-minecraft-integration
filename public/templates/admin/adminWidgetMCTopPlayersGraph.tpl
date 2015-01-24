<div class="well" style="overflow:hidden;">
    <div class="form-group">
        <label>Server</label>
        <select class="form-control">
            <!-- BEGIN serverConfigNames -->
            <option value="{serverConfigNames.serverNumber}">{serverConfigNames.configName}</option>
            <!-- END serverConfigNames -->
        </select>
        <input type="hidden" class="ajaxSelectSibling" name="serverNumber">
    </div>
    <div class="form-group">
        <label>Max&nbsp;Players</label>
        <select class="form-control">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10" selected="selected">10</option>
        </select>
        <input type="hidden" class="ajaxSelectSibling" name="showTopPlayers">
    </div>
    <div class="form-group">
        <label>Graph&nbsp;Style</label>
        <select class="form-control">
            <option value="pie" selected="selected">Pie</option>
            <option value="donut">Donut</option>
            <option value="bar">Bar</option>
            <option value="polar">Polar</option>
        </select>
        <input type="hidden" class="ajaxSelectSibling" name="styleChart">
    </div>
</div>