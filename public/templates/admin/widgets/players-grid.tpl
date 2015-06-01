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
