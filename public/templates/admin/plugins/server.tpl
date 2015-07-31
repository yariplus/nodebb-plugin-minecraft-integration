<div class="panel panel-success">
    <div class="panel-heading">
        <span class="panel-title">
			<i class="fa fa-chevron-down" data-toggle="collapse" data-parent="#server-list" style="cursor: pointer;"></i>
			<a class="mia-server-label" data-toggle="collapse" data-parent="#server-list">[[mi:name]]</a>
		</span>
        <div class="pull-right pointer"><i class="fa fa-times"></i></div>
    </div>
    <div class="panel-body collapse">
        <div class="row input-row">
            <div class="col-sm-7 col-xs-12 input-field">
                <label class="control-label">[[mi:server_name]] <small>([[mi:required]])</small></label>
                <input name="name" class="form-control" type="text" placeholder=""/>
            </div>
            <div class="col-sm-5 help-text" data-help="[[mi:help_server_name]]"></div>
        </div>
        <div class="row input-row">
            <div class="col-sm-7 col-xs-12 input-field">
                <label class="control-label">[[mi:server_address]] <small>([[mi:required]])</small></label>
                <input name="address" class="form-control" type="text" placeholder=""/>
            </div>
            <div class="col-sm-5 help-text" data-help="[[mi:help_server_address]]"></div>
        </div>
        <div class="row input-row">
            <div class="col-sm-7 col-xs-12 input-field">
                <label class="control-label">[[mi:query_port]] <small>([[mi:optional]])</small></label>
                <input name="query-port" class="form-control" type="text" placeholder=""/>
            </div>
            <div class="col-sm-5 help-text" data-help="[[mi:help_query_port]]"></div>
        </div>
        <div class="row input-row">
            <div class="col-sm-7 col-xs-12 input-field">
                <label class="control-label">[[mi:xapi]] <small>([[mi:optional]])</small></label>
                <input name="xapi" class="form-control" type="text" placeholder=""/>
            </div>
            <div class="col-sm-5 help-text" data-help="[[mi:help_xapi]]"></div>
        </div>
        <div class="row input-row">
            <div class="col-sm-7 col-xs-12 input-field">
                <label class="control-label">
                    <input name="hide-plugins" class="form-control" type="checkbox"/>
                    [[mi:hide_plugins]]
                </label>
            </div>
            <div class="col-sm-5 help-text" data-help="[[mi:hide_plugins_help]]"></div>
        </div>
    </div>
</div>
