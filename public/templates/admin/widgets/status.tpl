<div class="well" style="overflow:hidden;margin-bottom:15px;display:none;">
<div class="mcWidgetPreview" style="width:380px;">
<div class="panel panel-default">
<div class="panel-heading">Server Name</div>
<div style="padding: 0px;" class="panel-body">
<div class="widgetFillContainer">
    <table class="table table-striped widgetTable">
    <tbody>
    <tr>
        <td class="td-label">
            <span class="mcWidgetLabel">
                <strong>Status</strong>
            </span>
        </td>
        <td>
            <span class="mcWidgetText">
                <a class="fa fa-check-circle text-success has-tooltip" data-placement="top" data-title="Pinged server at 0.0.0.0:25565"></a>&nbsp;<strong><span class="text-success">Online</span></strong>
            </span>
        </td>
    </tr>
    <tr>
        <td class="td-label">
            <span class="mcWidgetLabel">
                <strong>Address</strong>
            </span>
        </td>
        <td>
            <span class="mcWidgetText">
                play.minecraft.net (0.0.0.0)
            </span>
        </td>
    </tr>
        <tr>
        <td class="td-label">
            <span class="mcWidgetLabel">
                <strong>Version</strong>
            </span>
        </td>
        <td>
            <span class="mcWidgetText">
                1.8&nbsp;<a class="fa fa-plug text-info has-popover" data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom" data-content="<h6>Essentials, NoCheatPlus, RandomLocation</h6>"></a>
            </span>
        </td>
    </tr>
        <tr>
        <td class="td-label">
            <span class="mcWidgetLabel">
                <strong>Players</strong>
            </span>
        </td>
        <td>
            <span class="mcWidgetText">
                <img class="has-tooltip mcAvatar" data-original-title="yariplus" src="http://cravatar.eu/avatar/yariplus/40" data-placement="top" data-toggle="tooltip" rel="tooltip" title="yariplus" style="margin-right:5px; margin-bottom:5px; border-style:; border-width: 6px; border-radius: 4px; border-color:;">
                <img class="has-tooltip mcAvatar" data-original-title="rikkyyxd" src="http://cravatar.eu/avatar/rikkyyxd/40" data-placement="top" data-toggle="tooltip" rel="tooltip" title="rikkyyxd" style="margin-right:5px; margin-bottom:5px; border-style:; border-width: 6px; border-radius: 4px; border-color:;">
                <img class="has-tooltip mcAvatar" data-original-title="jazma1503" src="http://cravatar.eu/avatar/jazma1503/40" data-placement="top" data-toggle="tooltip" rel="tooltip" title="jazma1503" style="margin-right:5px; margin-bottom:5px; border-style:; border-width: 6px; border-radius: 4px; border-color:;">
            </span>
        </td>
    </tr>
    </tbody>
    </table>
</div></div></div></div></div>

<div class="form-group">
    <label>Server</label>
    <select class="form-control">
        <!-- BEGIN servers -->
        <option value="{servers.sid}">{servers.name}</option>
        <!-- END servers -->
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="sid">
</div>

<div class="mi-accordion">
    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-display-options" data-toggle="collapse">
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
