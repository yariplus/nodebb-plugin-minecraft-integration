<div id="minecraft-integration-admin" role="tabpanel">

	<ul class="nav nav-tabs" role="tablist">
		<li role="presentation" class="active"><a href="#mi-tab-servers" aria-controls="mi-tab-servers" role="tab" data-toggle="tab">[[mi:servers]]</a></li>
		<li role="presentation"><a href="#mi-tab-settings"    aria-controls="mi-tab-settings"    role="tab" data-toggle="tab">[[mi:settings]]</a></li>
		<li role="presentation"><a href="#mi-tab-users"       aria-controls="mi-tab-users"       role="tab" data-toggle="tab">[[mi:registered-users]]</a></li>
		<li role="presentation"><a href="#mi-tab-avatars"     aria-controls="mi-tab-avatars"     role="tab" data-toggle="tab">[[mi:avatars]]</a></li>
		<li role="presentation"><a href="#mi-tab-players"     aria-controls="mi-tab-players"     role="tab" data-toggle="tab">[[mi:players]]</a></li>
		<li role="presentation"><a href="#mi-tab-maintenance" aria-controls="mi-tab-maintenance" role="tab" data-toggle="tab">[[mi:maintenance]]</a></li>
	</ul>

	<div class="tab-content">

		<div role="tabpanel" class="tab-pane active" id="mi-tab-servers">
			<div class="panel panel-primary">
				<div class="panel-body">
					<div class="panel-group" id="server-list"></div>
					<button id="mia-add-server" type="button" class="btn btn-success"><i class="fa fa-plus fa-fw"></i> [[mi:add_server]]</button>
				</div>
			</div>
		</div>

		<div role="tabpanel" class="tab-pane" id="mi-tab-settings">
			<div class="panel panel-primary">
				<div class="panel-body">

					<form id="minecraft-integration" autocomplete="off">

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

						<div class="row input-row">
							<div class="col-sm-7 col-xs-12 input-field">
								<label class="control-label">
									<input name="showPrefixes" class="" type="checkbox" style="width:16px;height:16px;">
									Show Prefixes
								</label>
							</div>
							<div class="col-sm-5 help-text" data-help="Show vault prefixes next to forum names."></div>
						</div>

						<div class="row input-row">
							<div class="col-sm-7 col-xs-12 input-field">
								<label class="control-label">
									<input name="usePrimaryPrefixOnly" class="" type="checkbox" style="width:16px;height:16px;">
									Use primary prefix only.
								</label>
							</div>
							<div class="col-sm-5 help-text" data-help=""></div>
						</div>

						<div class="row input-row">
							<div class="col-sm-7 col-xs-12 input-field">
								<label class="control-label">
									<input name="debug" class="" type="checkbox" style="width:16px;height:16px;">
									Debug Mode
								</label>
							</div>
							<div class="col-sm-5 help-text" data-help="This will log a huge amount of data from the plugin."></div>
						</div>

						<div>
							<button type="button" class="save btn btn-success">Save Settings</button>
						</div>

					</form>

				</div>
			</div>
		</div>

		<div role="tabpanel" class="tab-pane" id="mi-tab-users">
			<div class="panel panel-primary">
				<table class="table table-striped table-bordered">
					<thead>
						<tr>
							<th>User</th>
							<th>Players</th>
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
								<button id="mi-btn-reset-avatars" type="button" class="btn btn-primary">Clear Avatar Cache</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

	</div>

</div>


<br>

<div class="alert alert-warning clearfix beg">
	<p><b>Hello!</b> I'm <a href="https://github.com/yariplus">yariplus</a>, creator of this fine plugin. If you found this plugin useful, consider supporting me by making a financial contribution using one of the services below. And thanks for using my plugins!</p>
	<div>
		<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="pay">
			<input type="hidden" name="cmd" value="_s-xclick">
			<input type="hidden" name="hosted_button_id" value="DQP2MAQGKT7KC">
			<input type="image" src="https://www.paypalobjects.com/webstatic/en_US/btn/btn_donate_pp_142x27.png" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
			<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
		</form>
		<a href="https://www.patreon.com/yariplus">
			<img src="https://s3.amazonaws.com/patreon_public_assets/toolbox/patreon.png" width="82px" class="ptr">
		</a>
	</div>
	<p>Having trouble using this plugin? <a href="https://github.com/yariplus/nodebb-plugin-minecraft-integration/issues/new">Open an issue here.</a></p>
	<p>Interested in having me make a custom Minecraft or NodeBB plugin for you? Email me at tafike@gmail.com</p>
</div>

<br><br>

<style>

#minecraft-widgets .tooltip-inner {
	max-width: 300px;
	color: #757575;
	background: #fff;
	border: 1px #727272 solid;
	border-radius: 10px;
}

.beg .h1 {
	margin-top: 0;
	color: white;
}

.beg p {
	margin-bottom: 15px;
}

.pay {
	display: inline-block;
}

.pay input {
	border-radius: 4px;
}

.ptr {
	border-radius: 4px;
	vertical-align: baseline;
	margin-left: 5px;
	background: white none repeat scroll 0% 0%;
	padding: 5px;
	display: inline-block;
	outline: medium none;
	cursor: pointer;
	text-align: center;
	text-decoration: none;
	-webkit-border-radius: 20px;
	-moz-border-radius: 20px;
	-webkit-box-shadow: inset 1px -4px 2px rgba(0, 0, 0, 0.2)
	-moz-box-shadow: inset 1px -4px 2px rgba(0, 0, 0, 0.2);
	box-shadow: inset 1px -4px 2px rgba(0, 0, 0, 0.2);
}

</style>
