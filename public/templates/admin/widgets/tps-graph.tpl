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

<div class="form-group">
	<div class="checkbox">
		<label>
			<input type="checkbox" name="parseFormatCodes" checked>Parse format codes in Server Name and MOTD?
		</label>
	</div>
</div>
