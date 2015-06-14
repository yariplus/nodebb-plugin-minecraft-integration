<form id="minecraft-integration" autocomplete="off">
	<div role="tabpanel">
		<ul class="nav nav-tabs" role="tablist">
			<li role="presentation" class="active"><a href="#mi-tab-settings" aria-controls="mi-tab-settings" role="tab" data-toggle="tab">Settings</a></li>
			<li role="presentation"><a href="#mi-tab-players" aria-controls="mi-tab-players" role="tab" data-toggle="tab">Players</a></li>
		</ul>
		<div class="tab-content">
			<div role="tabpanel" class="tab-pane active" id="mi-tab-settings">
				<div class="row">
					<div class="col-lg-9">
						<div class="panel panel-primary">
							<div class="panel-heading">
								<span class="panel-title">
									[[mi:minecraft_integration]]
								</span>
							</div>
							<div class="panel-body">
								<h3>[[mi:general_settings]]</h3>

								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="avatarCDN">[[mi:avatar_cdn]]</label>
										<select name="avatarCDN" class="form-control">
											<option value="mojang">Mojang</option>
											<option value="cravatar" selected="selected">Cravatar.eu</option>
											<option value="minotar">Minotar</option>
											<option value="signaturecraft">Signaturecraft</option>
											<option value="custom">[[mi:custom]]</option>
										</select>
									</div>
									<div class="col-sm-5 help-text" data-help="[[mi:help_avatar_cdn]]"></div>
								</div>

								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="custom-cdn">[[mi:custom_cdn]]</label>
										<input name="custom-cdn" type="text" class="form-control" placeholder="" />
									</div>
									<div class="col-sm-5 help-text" data-help="[[mi:help_custom_cdn]]"></div>
								</div>

								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="avatarSize">[[mi:avatar_size]]</label>
										<input name="avatarSize" type="number" class="form-control" placeholder="40" />
									</div>
									<div class="col-sm-5 help-text" data-help="[[mi:help_avatar_size]]"></div>
								</div>

								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="avatarStyle">[[mi:avatar_style]]</label>
										<select name="avatarStyle" class="form-control">
											<option value="flat" selected="selected">[[mi:flat]]</option>
										</select>
									</div>
									<div class="col-sm-5 help-text" data-help="[[mi:help_avatar_style]]"></div>
								</div>
								
								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="api-key">[[mi:api_key]]</label>
										<input name="api-key" type="text" class="form-control" placeholder="SECRETPASSWORD" />
									</div>
									<div class="col-sm-5 help-text" data-help="[[mi:help_api_key]]"></div>
								</div>
								
								<hr>
								<h3>[[mi:active_servers]]</h3>
								<div class="panel-group" id="server-list">
								</div>
								<button id="mia-add-server" type="button" class="btn btn-success"><i class="fa fa-plus fa-fw"></i> [[mi:add_server]]</button>
								<button id="mia-view-servers" type="button" class="btn btn-warning"><i class="fa fa-cog fa-fw"></i> [[mi:view_servers]]</button>
							</div>
						</div>
					</div>
					<div class="col-lg-3">
						<div class="panel acp-panel-primary">
							<div class="panel-heading">
								[[mi:actions]]
							</div>
							<div class="panel-body">
								<div class="form-group">
									<button type="button" class="btn btn-warning form-control" id="mia-reset">
										<i class="fa fa-fw fa-history"></i> [[mi:reset_admin]]
									</button>
								</div>
								<div class="form-group">
									<button type="button" class="btn btn-danger form-control" id="mia-delete">
										<i class="fa fa-fw fa-times"></i> [[mi:delete_admin]]
									</button>
								</div>
								<button type="button" class="btn btn-success form-control" id="mia-save">
									<i class="fa fa-fw fa-save"></i> [[mi:save_admin]]
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div role="tabpanel" class="tab-pane" id="mi-tab-players">...</div>
		</div>
	</div>
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="mia-modal-servers">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">[[mi:minecraft_servers]]</h4>
                </div>
                <div class="modal-body form-group form-horizontal">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">[[mi:close]]</button>
                </div>
            </div>
        </div>
    </div>
</form>
