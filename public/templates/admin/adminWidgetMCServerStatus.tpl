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
    <div class="form-group">
        <label class="col-sm-2 control-label">Show MOTD</label>
        <div class="col-sm-8">
            <select class="form-control">
                <option value="afterTitle">After Container Title</option>
                <option value="replaceTitle">Replacing Container Title</option>
                <option value="asRow">As Separate Row</option>
                <option value="nowhere">Nowhere</option>
            </select>
            <input type="hidden" class="ajaxSelectSibling" name="showMOTD">
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="parseFormatCodes" checked>Parse format codes in Server Name and MOTD?
                </label>
            </div>
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="showPlayerCount">Show Player count after server status?
                </label>
            </div>
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="showIP">Show IP after Host? &nbsp; (&nbsp;e.g. "someserver.com (1.2.3.4)"&nbsp;)
                </label>
            </div>
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="showDebugIcons">Show debug icons?
                </label>
            </div>
        </div>
    </div>
    
    <div class="form-group">
        <label class="col-md-12 col-lg-2 control-label">Name&nbsp;Color</label>
        <div class="col-md-12 col-lg-2">
            <input type="text" class="form-control ajaxInputColorPicker" name="colorServerName">
        </div>
    </div>
    <div class="form-group">
        <label class="col-sm-2 control-label">Labels&nbsp;Color</label>
        <div class="col-sm-2">
            <input type="text" class="form-control ajaxInputColorPicker" name="colorLabels">
        </div>
    </div>
    <div class="form-group">
        <label class="col-sm-2 control-label">Text&nbsp;Color</label>
        <div class="col-sm-2">
            <input type="text" class="form-control ajaxInputColorPicker" name="colorText">
        </div>
    </div>
    
    <div class="form-group">
        <label class="col-sm-2 control-label">Custom Row 1</label>
        <div class="col-sm-2">
            <select class="form-control">
                <option value="name" selected="selected">After Title</option>
                <option value="status">After Status</option>
                <option value="address">After Address</option>
                <option value="version">After Version</option>
                <option value="players">After Players</option>
            </select>
            <input type="hidden" class="ajaxSelectSibling" name="custom1orderafter">
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom1label" name="custom1label" placeholder="Label" />
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom1text" name="custom1text" placeholder="Text" />
        </div>
        <div class="col-sm-2">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="usecustom1">Enable
                </label>
            </div>
        </div>
    </div>
    
    <div class="form-group">
        <label class="col-sm-2 control-label">Custom Row 2</label>
        <div class="col-sm-2">
            <select class="form-control">
                <option value="name" selected="selected">After Title</option>
                <option value="status">After Status</option>
                <option value="address">After Address</option>
                <option value="version">After Version</option>
                <option value="players">After Players</option>
            </select>
            <input type="hidden" class="ajaxSelectSibling" name="custom2orderafter">
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom2label" name="custom2label" placeholder="Label" />
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom2text" name="custom2text" placeholder="Text" />
        </div>
        <div class="col-sm-2">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="usecustom2">Enable
                </label>
            </div>
        </div>
    </div>
    
    <div class="form-group">
        <label class="col-sm-2 control-label">Custom Row 3</label>
        <div class="col-sm-2">
            <select class="form-control">
                <option value="name" selected="selected">After Title</option>
                <option value="status">After Status</option>
                <option value="address">After Address</option>
                <option value="version">After Version</option>
                <option value="players">After Players</option>
            </select>
            <input type="hidden" class="ajaxSelectSibling" name="custom3orderafter">
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom3label" name="custom3label" placeholder="Label" />
        </div>
        <div class="col-sm-2">
            <input type="text" class="form-control" id="custom3text" name="custom3text" placeholder="Text" />
        </div>
        <div class="col-sm-2">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="usecustom3">Enable
                </label>
            </div>
        </div>
    </div>
    
    <div class="well" style="overflow:hidden;">
        <div class="form-group">
            <div class="checkbox">
                <label>
                    <input type="checkbox" name="showGlory">Show Glory Border?
                </label>
            </div>
        </div>
        <div class="form-group">
            <label>Glory Border Style</label>
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
            <label class="control-label">Glory Border starting color.</label>
            <div>
                <input type="text" class="form-control ajaxInputColorPicker" name="gloryStart">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label">Glory Border ending color.</label>
            <div>
                <input type="text" class="form-control ajaxInputColorPicker" name="gloryEnd">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label">Widget Title Color</label>
            <div>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorTitle">
            </div>
        </div>
        <div class="form-group">
            <label class="control-label">MOTD Color</label>
            <div>
                <input type="text" class="form-control ajaxInputColorPicker" name="colorMOTD">
            </div>
        </div>
    </div>
    
</div>