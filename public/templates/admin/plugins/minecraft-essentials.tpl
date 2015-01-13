<div class="row">
	<div class="col-lg-9">
        <form class="minecraftServers form-horizontal">
        <div class="panel">
            <div class="panel-heading">Minecraft Essentials Configuration</div>
            <div class="panel-body">
            
                <div class="well">
                    <h4>General Settings</h4>
                    <fieldset>
                        <div class="form-group">
                            <label class="col-sm-2 control-label" for="serverUpdateDelay">Update Frequency</label>
                            <div class="col-sm-4">
                                <input type="text" class="form-control" name="serverUpdateDelay" id="serverUpdateDelay" placeholder="1" />
                            </div>
                            <div class="col-sm-6"> </div>
                        </div>
                    </fieldset>
                </div>
                
                <div class="well">
                    <h4>Server One</h4>
                    <fieldset>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server1serverConfigName">Server Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server1serverConfigName" id="server1serverConfigName" placeholder="Minecraft Server One" />
                            </div>
                            <div class="col-sm-4 col-xs-12">
                                <div class="checkbox">
                                    <label for="server1isLegacy">
                                        <input type="checkbox" name="server1isLegacy" id="server1isLegacy" /> Is legacy? (<1.7)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server1serverName">Display Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server1serverName" id="server1serverName" placeholder="A Minecraft Server" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server1serverHost">Server Host</label>
                            <div class="col-sm-6" col-xs-12">
                                <input type="text" class="form-control" name="server1serverHost" id="server1serverHost" placeholder="0.0.0.0" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server1serverPort">Server Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server1serverPort" id="server1serverPort" placeholder="25565" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server1queryPort">Query Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server1queryPort" id="server1queryPort" placeholder="25565" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server1rconPort">RCON Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server1rconPort" id="server1rconPort" placeholder="25575" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server1rconPass">RCON Pass</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="password" class="form-control" name="server1rconPass" id="server1rconPass" placeholder="password" />
                            </div>
                        </div>
                    </fieldset>
                </div>
                
                <div class="well">
                    <h4>Server Two</h4>
                    <fieldset>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server2serverConfigName">Server Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server2serverConfigName" id="server2serverConfigName" placeholder="Minecraft Server Two" />
                            </div>
                            <div class="col-sm-4 col-xs-12">
                                <div class="checkbox">
                                    <label for="server2isLegacy">
                                        <input type="checkbox" name="server2isLegacy" id="server2isLegacy" /> Is legacy? (<1.7)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server2serverName">Display Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server2serverName" id="server2serverName" placeholder="A Minecraft Server" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server2serverHost">Server Host</label>
                            <div class="col-sm-6" col-xs-12">
                                <input type="text" class="form-control" name="server2serverHost" id="server2serverHost" placeholder="0.0.0.0" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server2serverPort">Server Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server2serverPort" id="server2serverPort" placeholder="25565" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server2queryPort">Query Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server2queryPort" id="server2queryPort" placeholder="25565" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server2rconPort">RCON Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server2rconPort" id="server2rconPort" placeholder="25575" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server2rconPass">RCON Pass</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="password" class="form-control" name="server2rconPass" id="server2rconPass" placeholder="password" />
                            </div>
                        </div>
                    </fieldset>
                </div>
                
                <div class="well">
                    <h4>Server Three</h4>
                    <fieldset>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server3serverConfigName">Server Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server3serverConfigName" id="server3serverConfigName" placeholder="Minecraft Server Three" />
                            </div>
                            <div class="col-sm-4 col-xs-12">
                                <div class="checkbox">
                                    <label for="server3isLegacy">
                                        <input type="checkbox" name="server3isLegacy" id="server3isLegacy" /> Is legacy? (<1.7)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server3serverName">Display Name</label>
                            <div class="col-sm-6 col-xs-12">
                                <input type="text" class="form-control" name="server3serverName" id="server3serverName" placeholder="A Minecraft Server" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server3serverHost">Server Host</label>
                            <div class="col-sm-6" col-xs-12">
                                <input type="text" class="form-control" name="server3serverHost" id="server3serverHost" placeholder="0.0.0.0" />
                            </div>
                            <div class="col-sm-4 col-xs-12"> </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server3serverPort">Server Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server3serverPort" id="server3serverPort" placeholder="25565" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server3queryPort">Query Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server3queryPort" id="server3queryPort" placeholder="25565" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 col-xs-12 control-label" for="server3rconPort">RCON Port</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="text" class="form-control" name="server3rconPort" id="server3rconPort" placeholder="25575" />
                            </div>
                            <label class="col-sm-2 col-xs-12 control-label" for="server3rconPass">RCON Pass</label>
                            <div class="col-sm-4 col-xs-12">
                                <input type="password" class="form-control" name="server3rconPass" id="server3rconPass" placeholder="password" />
                            </div>
                        </div>
                    </fieldset>
                </div>
			</div>
		</div>
        </form>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Minecraft Essentials Configuration</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button><br />
                <button class="btn btn-info" id="add-minecraft-server">Add a Server</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
    var iServers = 0;
	require(['settings'], function(Settings) {
		Settings.load('minecraft-essentials', $('.minecraftServers'), function(err, settings) {
			var defaults = {
                'server1serverName': 'Server One',
                'server1serverHost': '0.0.0.0',
                'server1serverIP': '0.0.0.0',
                'server1serverPort': '25565',
                'server1queryPort': '25565',
                'server1rconPort': '25575',
                'server1rconPass': 'password',
                
                'server2serverName': 'Server Two',
                'server2serverHost': '0.0.0.0',
                'server2serverIP': '0.0.0.0',
                'server2serverPort': '25565',
                'server2queryPort': '25565',
                'server2rconPort': '25575',
                'server2rconPass': 'password',
                
                'server3serverName': 'Server Three',
                'server3serverHost': '0.0.0.0',
                'server3serverIP': '0.0.0.0',
                'server3serverPort': '25565',
                'server3queryPort': '25565',
                'server3rconPort': '25575',
                'server3rconPass': 'password'
			};

			// Set defaults
			for(var setting in defaults) {
				if (!settings.hasOwnProperty(setting)) {
					if (typeof defaults[setting] === 'boolean') {
						$('#' + setting).prop('checked', defaults[setting]);
					} else {
                        $( "input[name*='" + setting + "']").val(defaults[setting]);
					}
				}
			}
		});
        
        $('#add-minecraft-server').on('click', function() {
            
        });

		$('#save').on('click', function() {
			Settings.save('minecraft-essentials', $('.minecraftServers'), function() {
				app.alert({
					type: 'success',
					alert_id: 'minecraft-essentials-saved',
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
