<!-- IMPORT admin/widgets/partials/server-select.tpl -->

<label>Map Plugin</label>
<select class="form-control" name="mapplugin">
	<option value="dynmap" selected="selected">Dynmap</option>
	<option value="overviewer">Overviewer</option>
</select>

<br>

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

<!-- IMPORT admin/widgets/partials/style-colors-check.tpl -->

<!-- IMPORT admin/widgets/partials/style-color-title.tpl -->
