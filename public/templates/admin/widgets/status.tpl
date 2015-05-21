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
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="hidePluginList">Hide plugin list?
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
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showGlory">Show Avatar Border?
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Avatar Border Style</label>
                <select class="form-control">
                    <option value="double" selected="selected">Double</option>
                    <option value="ridge">Ridge</option>
                    <option value="groove">Groove</option>
                    <option value="inset">Inset</option>
                    <option value="outset">Outset</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>
                <input type="hidden" class="ajaxSelectSibling" name="styleGlory">
            </div>
            <div class="form-group">
                <label class="control-label">Avatar Border gradient starting color.</label>
                <div>
                    <input type="text" class="form-control ajaxInputColorPicker" name="gloryStart">
                </div>
            </div>
            <div class="form-group">
                <label class="control-label">Avatar Border gradient ending color.</label>
                <input type="text" class="form-control ajaxInputColorPicker" name="gloryEnd">
            </div>
        </div>
    </div>
    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-dynmap-options" data-toggle="collapse">
            <span class="panel-title">[[mi:dynmap_options]]</span>
        </div>
        <div class="panel-body collapse mi-dynmap-options">
            <div class="form-group">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="showMiniMap">Attach mini map.
                    </label>
                </div>
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
        </div>
    </div>
    <div class="panel panel-success">
        <div class="panel-heading" data-target=".mi-custom-rows" data-toggle="collapse">
            <span class="panel-title">[[mi:custom_rows]]</span>
        </div>
        <div class="panel-body collapse mi-custom-rows">
            <h4><u>Custom Row 1</u></h4>
            <div class="form-group well">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="usecustom1">Enable
                    </label>
                </div>
                <label class="control-label" for="custom1orderafter">Place Row</label>
                <select class="form-control" id="custom1orderafter">
                    <option value="name" selected="selected">After Title</option>
                    <option value="status">After Status</option>
                    <option value="address">After Address</option>
                    <option value="version">After Version</option>
                    <option value="players">After Players</option>
                </select>
                <input type="hidden" class="ajaxSelectSibling" name="custom1orderafter">
                <label class="control-label" for="custom1label">
                    Label
                    <input type="text" class="form-control" id="custom1label" name="custom1label" placeholder="Label" />
                </label>
                <label class="control-label" for="custom1text">
                    Text
                    <input type="text" class="form-control" id="custom1text" name="custom1text" placeholder="Text" />
                </label>
            </div>

            <h4><u>Custom Row 2</u></h4>
            <div class="form-group well">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="usecustom2">Enable
                    </label>
                </div>
                <label class="control-label" for="custom2orderafter">Place Row</label>
                <select class="form-control" id="custom2orderafter">
                    <option value="name" selected="selected">After Title</option>
                    <option value="status">After Status</option>
                    <option value="address">After Address</option>
                    <option value="version">After Version</option>
                    <option value="players">After Players</option>
                </select>
                <input type="hidden" class="ajaxSelectSibling" name="custom2orderafter">
                <label class="control-label" for="custom2label">
                    Label
                    <input type="text" class="form-control" id="custom2label" name="custom2label" placeholder="Label" />
                </label>
                <label class="control-label" for="custom2text">
                    Text
                    <input type="text" class="form-control" id="custom2text" name="custom2text" placeholder="Text" />
                </label>
            </div>

            <h4><u>Custom Row 3</u></h4>
            <div class="form-group well">
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="usecustom3">Enable
                    </label>
                </div>
                <label class="control-label" for="custom3orderafter">Place Row</label>
                <select class="form-control" id="custom3orderafter">
                    <option value="name" selected="selected">After Title</option>
                    <option value="status">After Status</option>
                    <option value="address">After Address</option>
                    <option value="version">After Version</option>
                    <option value="players">After Players</option>
                </select>
                <input type="hidden" class="ajaxSelectSibling" name="custom3orderafter">
                <label class="control-label" for="custom3label">
                    Label
                    <input type="text" class="form-control" id="custom3label" name="custom3label" placeholder="Label" />
                </label>
                <label class="control-label" for="custom3text">
                    Text
                    <input type="text" class="form-control" id="custom3text" name="custom3text" placeholder="Text" />
                </label>
            </div>
        </div>
    </div>
</div>
