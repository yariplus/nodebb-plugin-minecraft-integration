<div class="panel panel-default">
  <div class="panel-heading">
    <span class="panel-title">[[mi:name]]</span>
  </div>
  <div class="panel-body">
    <div class="row input-row form-group">
      <div class="col-sm-7 col-xs-12 input-field">
        <label class="control-label">[[mi:server_name]]</label>
        <input name="name" class="form-control" type="text" placeholder=""/>
      </div>
      <div class="col-sm-5 help-text" data-help="[[mi:help_server_name]]"></div>
    </div>
    <div class="row input-row form-group">
      <div class="col-sm-7 col-xs-12 input-field">
        <label class="control-label">[[mi:server_address]] <small>([[mi:required]])</small></label>
        <input name="address" class="form-control" type="text" placeholder=""/>
      </div>
      <div class="col-sm-5 help-text" data-help="[[mi:help_server_address]]"></div>
    </div>
    <div class="row input-row form-group">
      <div class="col-sm-7 col-xs-12 input-field">
        <label for="api-key">API Key</label>
        <div class="input-group">
          <input name="api-key" type="text" class="form-control" readonly/>
          <span type="button" class="regen-key input-group-btn">[[mi:regenerate]]</span>
        </div>
      </div>
      <div class="col-sm-5 help-text" data-help="[[mi:help_api_key]]"></div>
    </div>
    <div class="row input-row form-group">
      <div class="checkbox input-field">
        <label for="hidePlugins" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
          <input id="hidePlugins" class="mdl-switch__input" type="checkbox" name="hidePlugins">
          <span class="mdl-switch__label"><strong>Hide Plugins</strong></span>
        </label>
      </div>
      <div class="col-sm-5 help-text" data-help="[[mi:help_hide_plugins]]"></div>
    </div>
    <div>
      <button type="button" class="save btn btn-success">Save</button>
    </div>
  </div>
</div>
