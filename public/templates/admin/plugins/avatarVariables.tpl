<!-- BEGIN avatar.variables -->

<!-- IF avatar.variables.select -->

<div class="row input-row">
  <div class="col-sm-7 col-xs-12 input-field">
    <label for="@key">{avatar.variables.name}</label>
    <select id="@key" name="@key" class="form-control">
    <!-- BEGIN avatar.variables.values -->
      <option value="@key"<!-- IF avatar.variables.values.default --> selected="selected"<!-- ENDIF avatar.variables.values.default -->>{avatar.variables.values.name}</option>-->
    <!-- END avatar.variables.values -->
    </select>
  </div>
  <div class="col-sm-5 help-text" data-help=""></div>
</div>

<!-- ELSE -->

<div class="row input-row">
  <div class="col-sm-7 col-xs-12 input-field">
    <label for="@key">{avatar.variables.name}</label>
    <input id="@key" name="@key" <!-- IF avatar.variables.number --> type="number"<!-- ENDIF avatar.variables.number --> class="form-control" value="{avatar.variables.default}" />
  </div>
  <div class="col-sm-5 help-text" data-help=""></div>
</div>

<!-- ENDIF avatar.variables.select -->

<!-- END avatar.variables -->
