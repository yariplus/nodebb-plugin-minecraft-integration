<form id="minecraft-integration" autocomplete="off">
	<h1>
		<img src="/plugins/nodebb-plugin-minecraft-integration/public/images/Grass.png">
		[[mi:minecraft_integration]]
	</h1>
	<div class="row">
		<div class="col-lg-9">
			<div role="tabpanel">
				<ul class="nav nav-tabs" role="tablist">
					<li role="presentation" class="active"><a href="#mi-tab-servers" aria-controls="mi-tab-servers" role="tab" data-toggle="tab">[[mi:active_servers]]</a></li>
					<li role="presentation"><a href="#mi-tab-settings" aria-controls="mi-tab-settings" role="tab" data-toggle="tab">[[mi:general_settings]]</a></li>
					<li role="presentation"><a href="#mi-tab-users" aria-controls="mi-tab-users" role="tab" data-toggle="tab">Registered Users</a></li>
					<li role="presentation"><a href="#mi-tab-avatars" aria-controls="mi-tab-avatars" role="tab" data-toggle="tab">Cached Avatars</a></li>
					<li role="presentation"><a href="#mi-tab-players" aria-controls="mi-tab-players" role="tab" data-toggle="tab">Cached Players</a></li>
					<li role="presentation"><a href="#mi-tab-maintenance" aria-controls="mi-tab-maintenance" role="tab" data-toggle="tab">Maintenance</a></li>
				</ul>
				<div class="tab-content">
					<div role="tabpanel" class="tab-pane active" id="mi-tab-servers">
						<div class="panel panel-primary">
							<div class="panel-body">
								<div class="info bg-info alert">
									<i class="fa fa-question"></i>
									<span>Servers listed here are pinged every minute and widgets are updated. If the NodeBB-Integration plugin is installed on the server, widgets are updated in real-time instead.</span>
								</div>
								<div class="panel-group" id="server-list">
								</div>
								<button id="mia-add-server" type="button" class="btn btn-success"><i class="fa fa-plus fa-fw"></i> [[mi:add_server]]</button>
								<button id="mia-view-servers" type="button" class="btn btn-warning"><i class="fa fa-cog fa-fw"></i> [[mi:view_servers]]</button>
							</div>
						</div>
					</div>
					<div role="tabpanel" class="tab-pane" id="mi-tab-settings">
						<div class="panel panel-primary">
							<div class="panel-body">
								<div class="row input-row">
									<div class="col-sm-7 col-xs-12 input-field">
										<label for="avatarCDN">[[mi:avatar_cdn]]</label>
										<select name="avatarCDN" class="form-control">
											<option value="mojang" selected="selected">Mojang</option>-->
											<option value="brony">Brony ModPack</option>
											<option value="cravatar">Cravatar.eu</option>
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
							</div>
						</div>
					</div>
					<div role="tabpanel" class="tab-pane" id="mi-tab-users">
						<div class="panel panel-primary">
							<table class="table table-striped">
								<thead>
									<tr>
										<th>User</th>
										<th>UUID</th>
										<th>Player Name</th>
										<th>Actions</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="miTableUsers"></tbody>
							</table>
						</div>
					</div>
					<div role="tabpanel" class="tab-pane" id="mi-tab-avatars">
						<div class="panel panel-primary">
							<table class="table table-striped">
								<thead>
									<tr>
										<th>#</th>
										<th>Player Name</th>
										<th>UUID</th>
										<th>Actions</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="miTableAvatars"></tbody>
							</table>
						</div>
					</div>
					<div role="tabpanel" class="tab-pane" id="mi-tab-players">
						<div class="panel panel-primary">
							<table class="table table-striped">
								<thead>
									<tr>
										<th>UUID</th>
										<th>Player Name</th>
										<th>Prefix</th>
										<th>Play Time</th>
										<th>Last Online</th>
										<th>Actions</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="miTablePlayers"></tbody>
							</table>
						</div>
					</div>
					<div role="tabpanel" class="tab-pane" id="mi-tab-maintenance">
						<div class="panel panel-primary">
							<table class="table table-striped">
								<tbody>
									<tr>
										<td>
											<button id="mi-btn-clear-avatar-cache" type="button" class="btn btn-primary">Clear Avatar Cache</button>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
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
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="mia-modal-servers">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">[[mi:minecraft_servers]]</h4>
                </div>
                <div class="modal-body">
					<table class="table">
						<tbody></tbody>
					</table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">[[mi:close]]</button>
                </div>
            </div>
        </div>
    </div>
</form>
