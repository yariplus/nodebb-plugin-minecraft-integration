<div class="well form-horizontal" style="overflow:hidden;">
    <div class="form-group">
        <label class="col-sm-2 control-label">Server</label>
        <div class="col-sm-8">
            <select class="form-control">
                <!-- BEGIN serverConfigNames -->
                <option value="{serverConfigNames.serverNumber}">{serverConfigNames.configName}</option>
                <!-- END serverConfigNames -->
            </select>
            <input type="hidden" class="ajaxSelectSibling" name="serverNumber">
        </div>
    </div>
</div>