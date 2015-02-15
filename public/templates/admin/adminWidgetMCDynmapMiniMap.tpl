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
    <div class="checkbox">
        <label>
            <input type="checkbox" name="showModalMap">Show link to large map.
        </label>
    </div>
</div>
<div class="form-group">
    <label class="control-label">Dynmap URI</label>
    <input type="text" class="form-control" name="mapURI" placeholder="http://ServerHost:8123/">
</div>
<div class="form-group">
    <label class="control-label">World Name</label>
    <input class="form-control" type="text" name="worldname">
</div>
<div class="form-group">
    <label class="control-label">Map Name</label>
    <input class="form-control" type="text" name="mapname">
</div>
<div class="form-group">
    <label class="control-label">Zoom Level</label>
    <input class="form-control" type="text" name="zoom">
</div>
<div class="form-group">
    <label class="control-label">X Coordinate</label>
    <input class="form-control" type="text" name="X">
</div>
<div class="form-group">
    <label class="control-label">Z Coordinate</label>
    <input class="form-control" type="text" name="Z">
</div>

<br></br>

<div class="form-group">
    <label class="control-label">Title&nbsp;Color</label>
    <div>
        <input type="text" class="form-control ajaxInputColorPicker" name="colorTitle">
    </div>
</div>