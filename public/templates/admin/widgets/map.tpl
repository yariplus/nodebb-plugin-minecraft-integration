<div class="form-group">
    <label>Server</label>
    <select class="form-control">
        <!-- BEGIN servers -->
        <option value="{servers.sid}">{servers.name}</option>
        <!-- END servers -->
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="sid">
</div>

<div class="form-group">
    <label>Map Plugin</label>
    <select class="form-control">
        <option value="dynmap">Dynmap</option>
        <option value="overviewer">Overviewer</option>
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="type">
</div>

<div class="form-group">
    <div class="checkbox">
        <label>
            <input type="checkbox" name="showlargemap" checked>Show link to a full-screen map.
        </label>
    </div>
</div>

<div class="form-group">
    <label class="control-label">Map Address</label>
    <input type="text" class="form-control" name="mapuri" placeholder="http://localhost:8123/">
</div>
<div class="form-group">
    <label class="control-label">World Name</label>
    <input class="form-control" type="text" name="mapworld" placeholder="world">
</div>
<div class="form-group">
    <label class="control-label">Map Name</label>
    <input class="form-control" type="text" name="maptype" placeholder="surface">
</div>

<div class="form-group">
    <label class="control-label">Zoom Level</label>
    <input class="form-control" type="text" name="mapzoom" placeholder="-2">
</div>

<div class="form-group">
    <label class="control-label">X Coordinate</label>
    <input class="form-control" type="text" name="mapx" placeholder="0">
</div>

<div class="form-group">
    <label class="control-label">Z Coordinate</label>
    <input class="form-control" type="text" name="mapz" placeholder="0">
</div>

<div class="form-group">
	<div class="checkbox">
		<label>
			<input type="checkbox" name="parseFormatCodes" checked>Parse format codes in Server Name and MOTD?
		</label>
	</div>
</div>

<div class="form-group">
	<label class="control-label">Title&nbsp;Color</label>
	<input type="text" class="form-control ajaxInputColorPicker" name="colorTitle" preview=".panel-heading">
</div>

<div class="form-group">
	<label class="control-label">MOTD Color</label>
	<input type="text" class="form-control ajaxInputColorPicker" name="colorMOTD" preview=".mcWidgetMOTD">
</div>
