<label>Server</label>
<select class="form-control">
	<!-- BEGIN servers -->
	<option value="{servers.sid}">{servers.name}</option>
	<!-- END servers -->
</select>
<input type="hidden" class="ajaxSelectSibling" name="sid" />

<br>

<label class="control-label">Widget Title Color</label>
<input type="text" class="form-control ajaxInputColorPicker" name="colorTitle">

<br>

<label>Graph Fill Color</label>
<input type="text" class="form-control ajaxInputColorPicker" name="chartColorFill" />
