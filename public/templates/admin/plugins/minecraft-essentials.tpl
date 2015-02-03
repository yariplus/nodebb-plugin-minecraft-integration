<div class="row">
	<div class="col-lg-9">
        <form id="minecraftServers">
        <input type="hidden" name="resetDatabase">
        <div class="panel">
            <div class="panel-heading">Minecraft Essentials Configuration</div>
            <div class="panel-body">
                <h4>General Settings</h4>
                <div class="form-group">
                    <label class="control-label" for="serverUpdateDelay">
                        Ping Frequency (In minutes)
                        <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This can usually be left alone, but some servers will block the plugin if it pings to often."></a>
                        <input type="text" class="form-control" data-key="serverUpdateDelay" id="serverUpdateDelay" placeholder="1"></input>
                    </label>
                </div>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" data-type="check" data-key="logErrors"></input>
                            Log Errors?
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This logs all non-critical errors."></a>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" data-type="check" data-key="logDebug"></input>
                            Log Debug Messages?
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This sends a lot of data to the logs, which may be useful for filing bug reports."></a>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="control-label">
                        Primary Avatar CDN
                        <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The Avatar CDN is where avatars are downloaded from."></a>
                        <select class="form-control" data-key="avatarCDN">
                            <!--<option value="mojang">Mojang</option>-->
                            <option value="cravatar" selected="selected">Cravatar.eu</option>
                            <option value="minotar">Minotar</option>
                            <option value="signaturecraft">Signaturecraft</option>
                        </select>
                    </label>
                </div>
                <div class="form-group">
                    <label class="control-label">
                        Avatar Size (Pixels)
                        <input type="text" class="form-control" data-key="avatarSize" id="avatarSize" placeholder="40"></input>
                    </label>
                </div>
                <div class="form-group">
                    <label class="control-label">
                        Avatar Style
                        <select class="form-control" data-key="avatarStyle">
                            <option value="flat" selected="selected">Flat</option>
                        </select>
                    </label>
                </div>
                
                <div class="well">
                    <h3>Server One</h3>
                    <div class="checkbox">
                        <label for="server1isDisabled">
                            <input type="checkbox" data-type="check" data-key="server1isDisabled" id="server1isDisabled"></input>
                            Disable Server
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>Disabling the server stops node from regularly pinging the server. It will not delete already acquired ping data.</strong>"></a>
                        </label>
                    </div>
                    <div class="checkbox">
                        <label for="server1isLegacy">
                            <input type="checkbox" data-type="check" data-key="server1isLegacy" id="server1isLegacy"></input>
                            Legacy Server (<1.7)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>This option is required for servers below version 1.7.</strong>"></a>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server1serverConfigName">
                            Server Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the name used in the widget settings to identify the server."></a>
                            <input type="text" class="form-control" data-key="server1serverConfigName" id="server1serverConfigName" placeholder="Minecraft Server One"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server1serverName">
                            Display Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the text displayed on widgets to identify the server. Minecraft formatting codes are accepted here."></a>
                            <input type="text" class="form-control" data-key="server1serverName" id="server1serverName" placeholder="A Minecraft Server"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server1serverHost">
                            Server Host
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the address users can use to connect to the server, you can enter a port here or in the Server Port box. Supports SRV records and DNS addresses. Defaults to localhost."></a>
                            <input type="text" class="form-control" data-key="server1serverHost" id="server1serverHost" placeholder="0.0.0.0"></input>
                        </label>
                        <label class="control-label" for="server1serverPort">
                            Server Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server port. Defaults to 25565."></a>
                            <input type="text" class="form-control" data-key="server1serverPort" id="server1serverPort" placeholder="25565"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server1queryPort">
                            Query Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server query port. Defaults to the server port. Query must be enabled in the server's server.properties file. Older servers will provide only limited information without an open query port."></a>
                            <input type="text" class="form-control" data-key="server1queryPort" id="server1queryPort" placeholder=""></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server1rconPort">
                            RCON Port (Optional)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Allows the plugin to send commands to the server. Not currently used. When implemented, additional configuration is needed to secure the connection to the server."></a>
                            <input type="text" class="form-control" data-key="server1rconPort" id="server1rconPort" placeholder="25575"></input>
                        </label>
                        <label class="control-label" for="server1rconPass">
                            RCON Pass (Optional)
                            <input type="password" class="form-control" data-key="server1rconPass" id="server1rconPass" placeholder=""></input>
                        </label>
                    </div>
                </div>
                
                <div class="well">
                    <h3>Server Two</h3>
                    <div class="checkbox">
                        <label for="server2isDisabled">
                            <input type="checkbox" data-type="check" data-key="server2isDisabled" id="server2isDisabled"></input>
                            Disable Server
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>Disabling the server stops node from regularly pinging the server. It will not delete already acquired ping data.</strong>"></a>
                        </label>
                    </div>
                    <div class="checkbox">
                        <label for="server2isLegacy">
                            <input type="checkbox" data-type="check" data-key="server2isLegacy" id="server2isLegacy"></input>
                            Legacy Server (<1.7)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>This option is required for servers below version 1.7.</strong>"></a>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server2serverConfigName">
                            Server Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the name used in the widget settings to identify the server."></a>
                            <input type="text" class="form-control" data-key="server2serverConfigName" id="server2serverConfigName" placeholder="Minecraft Server Two"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server2serverName">
                            Display Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the text displayed on widgets to identify the server. Minecraft formatting codes are accepted here."></a>
                            <input type="text" class="form-control" data-key="server2serverName" id="server2serverName" placeholder="A Minecraft Server"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server2serverHost">
                            Server Host
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the address users can use to connect to the server, you can enter a port here or in the Server Port box. Supports SRV records and DNS addresses. Defaults to localhost."></a>
                            <input type="text" class="form-control" data-key="server2serverHost" id="server2serverHost" placeholder="0.0.0.0"></input>
                        </label>
                        <label class="control-label" for="server2serverPort">
                            Server Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server port. Defaults to 25565."></a>
                            <input type="text" class="form-control" data-key="server2serverPort" id="server2serverPort" placeholder="25565"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server2queryPort">
                            Query Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server query port. Defaults to the server port. Query must be enabled in the server's server.properties file. Older servers will provide only limited information without an open query port."></a>
                            <input type="text" class="form-control" data-key="server2queryPort" id="server2queryPort" placeholder=""></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server2rconPort">
                            RCON Port (Optional)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Allows the plugin to send commands to the server. Not currently used. When implemented, additional configuration is needed to secure the connection to the server."></a>
                            <input type="text" class="form-control" data-key="server2rconPort" id="server2rconPort" placeholder="25575"></input>
                        </label>
                        <label class="control-label" for="server2rconPass">
                            RCON Pass (Optional)
                            <input type="password" class="form-control" data-key="server2rconPass" id="server2rconPass" placeholder=""></input>
                        </label>
                    </div>
                </div>
                
                <div class="well">
                    <h3>Server Three</h3>
                    <div class="checkbox">
                        <label for="server3isDisabled">
                            <input type="checkbox" data-type="check" data-key="server3isDisabled" id="server3isDisabled"></input>
                            Disable Server
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>Disabling the server stops node from regularly pinging the server. It will not delete already acquired ping data.</strong>"></a>
                        </label>
                    </div>
                    <div class="checkbox">
                        <label for="server3isLegacy">
                            <input type="checkbox" data-type="check" data-key="server3isLegacy" id="server3isLegacy"></input>
                            Legacy Server (<1.7)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-html="true" data-title="<strong>This option is required for servers below version 1.7.</strong>"></a>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server3serverConfigName">
                            Server Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the name used in the widget settings to identify the server."></a>
                            <input type="text" class="form-control" data-key="server3serverConfigName" id="server3serverConfigName" placeholder="Minecraft Server Three"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server3serverName">
                            Display Name
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the text displayed on widgets to identify the server. Minecraft formatting codes are accepted here."></a>
                            <input type="text" class="form-control" data-key="server3serverName" id="server3serverName" placeholder="A Minecraft Server"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server3serverHost">
                            Server Host
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="This is the address users can use to connect to the server, you can enter a port here or in the Server Port box. Supports SRV records and DNS addresses. Defaults to localhost."></a>
                            <input type="text" class="form-control" data-key="server3serverHost" id="server3serverHost" placeholder="0.0.0.0"></input>
                        </label>
                        <label class="control-label" for="server3serverPort">
                            Server Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server port. Defaults to 25565."></a>
                            <input type="text" class="form-control" data-key="server3serverPort" id="server3serverPort" placeholder="25565"></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server3queryPort">
                            Query Port
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="The server query port. Defaults to the server port. Query must be enabled in the server's server.properties file. Older servers will provide only limited information without an open query port."></a>
                            <input type="text" class="form-control" data-key="server3queryPort" id="server3queryPort" placeholder=""></input>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="server3rconPort">
                            RCON Port (Optional)
                            <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Allows the plugin to send commands to the server. Not currently used. When implemented, additional configuration is needed to secure the connection to the server."></a>
                            <input type="text" class="form-control" data-key="server3rconPort" id="server3rconPort" placeholder="25575"></input>
                        </label>
                        <label class="control-label" for="server3rconPass">
                            RCON Pass (Optional)
                            <input type="password" class="form-control" data-key="server3rconPass" id="server3rconPass" placeholder=""></input>
                        </label>
                    </div>
                </div>
                
			</div>
		</div>
        </form>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Minecraft Essentials Configuration</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button><br /><br />
                <button class="btn btn-info" id="add-minecraft-server">Add a Server</button><br /><br />
                <button class="btn btn-danger" id="delete-minecraft-servers">Reset Database</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">

require(['settings'], function(settings) {

    settings.sync('minecraft-essentials', $('#minecraftServers'));
    settings.registerPlugin({
        Settings: {},
		types: ['check'],
        use: function () {
            Settings = this;
        },
        set: function (element, value) {
            element.prop('checked', value || false);
        },
        get: function (element, trim, empty) {
            return element.prop('checked');
        }
    });
    settings.registerPlugin({
        Settings: {},
		types: ['selectMultiple'],
        use: function () {
            Settings = this;
        },
        set: function (element, value) {
            if (value.constructor === Array) {
                for (var val in value) {
                    element.find('option[value=val]').attr("selected",true);
                }
            }
        },
        get: function (element, trim, empty) {
            var value = [];
            element.find('option:selected').each(function () {
                value.push($(this).val());
            });
            return value;
        }
    });

    $('#save').click( function (event) {
        //event.preventDefault();
        settings.persist('minecraft-essentials', $('#minecraftServers'), function(){
            socket.emit('admin.settings.syncMinecraftEssentials');
        });
    });

});

</script>
