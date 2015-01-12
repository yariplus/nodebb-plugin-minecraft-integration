<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Minecraft Essentials Server Configuration</div>
			<div class="panel-body">
                <div class="well">
                    <form class="form minecraft-essentials-settings">
                        <div class="row">
                            <fieldset>
                                <h4 style="margin-top:0;">Server</h4>
                                <div class="col-sm-12 col-xs-12">
                                    <div class="form-group">
                                        <label>Server Name</label>
                                        <input type="text" class="form-control" name="server1serverConfigName" placeholder="Minecraft Server" />
                                    </div>
                                </div>
                                <div class="col-sm-12 col-xs-12">
                                    <div class="form-group">
                                        <label>Server Display Name</label>
                                        <input type="text" class="form-control" name="server1serverName" placeholder="Minecraft Server" />
                                    </div>
                                </div>
                                <div class="col-sm-6 col-xs-12">
                                    <div class="form-group">
                                        <label>Server Host</label>
                                        <input type="text" class="form-control" name="server1serverHost" placeholder="0.0.0.0" />
                                    </div>
                                </div>
                                <div class="col-sm-6 col-xs-12">
                                    <div class="form-group">
                                        <label>Server Port</label>
                                        <input type="text" class="form-control" name="server1serverPort" placeholder="25565" />
                                    </div>
                                </div>
                                <div class="col-sm-6 col-xs-12">
                                    <div class="form-group">
                                        <label>Query Port</label>
                                        <input type="text" class="form-control" name="server1queryPort" placeholder="25565" />
                                    </div>
                                </div>
                                <div class="col-sm-6 col-xs-12">
                                    <div class="form-group">
                                        <label>RCON Port</label>
                                        <input type="text" class="form-control" name="server1rconPort" placeholder="25575" />
                                    </div>
                                </div>
                                <div class="col-sm-12 col-xs-12">
                                    <div class="form-group">
                                        <label>RCON Pass</label>
                                        <input type="text" class="form-control" name="server1rconPort" placeholder="password" />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </form>
                </div>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Minecraft Essentials Server Configuration</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('minecraft-essentials', $('.minecraft-essentials-settings'), function(err, settings) {
			var defaults = {
                'server1serverName': 'Server One',
                'server1serverHost': '0.0.0.0',
                'server1serverIP': '0.0.0.0',
                'server1serverPort': '25565',
                'server1queryPort': '25565',
                'server1rconPort': '25575',
                'server1rconPass': 'password',
                'server1widgetPass': 'password'
			};

			// Set defaults
			for(var setting in defaults) {
				if (!settings.hasOwnProperty(setting)) {
					if (typeof defaults[setting] === 'boolean') {
						$('#' + setting).prop('checked', defaults[setting]);
					} else {
						$('#' + setting).val(defaults[setting]);
					}
				}
			}
		});

		$('#save').on('click', function() {
			Settings.save('minecraft-essentials', $('.minecraft-essentials-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'markdown-saved',
					title: 'Reload Required',
					message: 'Please reload your NodeBB to have your changes take effect',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>
