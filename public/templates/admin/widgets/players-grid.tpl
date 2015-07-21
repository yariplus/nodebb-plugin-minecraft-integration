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
			<input type="checkbox" name="show-avatar-borders"> [[mi:show-avatar-borders]]
		</label>
	</div>
</div>

<div class="form-group">
	<label>[[mi:avatar-border-style]]</label>
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
	<input type="hidden" class="ajaxSelectSibling" name="avatar-border-style">
</div>

<div class="form-group">
	<label class="control-label">[[mi:avatar-border-start]]</label>
	<div>
		<input type="text" class="form-control ajaxInputColorPicker" name="avatar-border-start">
	</div>
</div>

<div class="form-group">
	<label class="control-label">[[mi:avatar-border-end]]</label>
	<div>
		<input type="text" class="form-control ajaxInputColorPicker" name="avatar-border-end">
	</div>
</div>
