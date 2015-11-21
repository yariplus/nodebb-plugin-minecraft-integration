<!-- IMPORT admin/widgets/partials/server-select.tpl -->

<div class="mi-accordion">
    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-display-options" data-toggle="collapse">
            <i class="fa fa-fw fa-angle-down"></i>
			<span class="panel-title">[[mi:display_options]]</span>
        </div>
        <div class="panel-body collapse mi-display-options">
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showMOTD" checked>Show a row with the MOTD?
                    </label>
                </div>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="parseFormatCodes" checked>Parse format codes in Server Name and MOTD?
                    </label>
                </div>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showPlayerCount" checked>Show Player count after server status?
                    </label>
                </div>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showAvatars" checked>Show Player Avatars?
                    </label>
                </div>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showIP" checked>Show IP after Host? &nbsp; (&nbsp;e.g. "someserver.com (1.2.3.4)"&nbsp;)
                    </label>
                </div>
            </div>
        </div>
    </div>
    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-style-options" data-toggle="collapse">
            <span class="panel-title">[[mi:style_options]]</span>
        </div>
        <div class="panel-body collapse mi-style-options">

			<!-- IMPORT admin/widgets/partials/style-colors-check.tpl -->

            <div class="form-group">
                <label class="control-label">Title&nbsp;Color</label>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorTitle" preview=".panel-heading">
            </div>
            <div class="form-group">
                <label class="control-label">MOTD Color</label>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorMOTD" preview=".mcWidgetMOTD">
            </div>
            <div class="form-group">
                <label class="control-label">Labels&nbsp;Color</label>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorLabels" preview=".mcWidgetLabel">
            </div>
            <div class="form-group">
                <label class="control-label">Text&nbsp;Color</label>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorText" preview=".mcWidgetText">
            </div>

			<!-- IMPORT admin/widgets/partials/style-avatar-borders.tpl -->

        </div>
    </div>

    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-map-options" data-toggle="collapse">
            <span class="panel-title">[[mi:map_options]]</span>
        </div>

        <div class="panel-body collapse mi-map-options">
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="mapshow">Attach mini map.
                    </label>
                </div>
            </div>

            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="mapshowlarge">Show link to large map.
                    </label>
                </div>
            </div>

			<div class="form-group">
				<label>Map Plugin</label>
				<select class="form-control">
					<option value="dynmap">Dynmap</option>
					<option value="overviewer">Overviewer</option>
				</select>
				<input type="hidden" class="ajaxSelectSibling" name="mapplugin">
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
                <label class="control-label">Map Type</label>
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
        </div>
    </div>

</div>
