<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading"><span<!-- IF colorServerName --> style="color:#{colorServerName}"<!-- ENDIF colorServerName -->>{serverName}</span></div>
    <div class="status-widget">
        <table class="table table-striped">
        <tbody>
        
        <!-- BEGIN customaftername -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>{customaftername.label}</strong>
                </span>
            </td>
            <td>
                {customaftername.text}
            </td>
        </tr>
        <!-- END customaftername -->
        
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>Status</strong>
                </span>
            </td>
            <td>
            <!-- IF isServerOnline -->
                <a class="fa fa-check-circle text-success has-tooltip" data-placement="top" data-title="Online"></a>&nbsp;<strong><span class="text-success">Online</span></strong><!-- IF showPlayerCount -->&nbsp;({onlinePlayers}/{maxPlayers})<!-- ENDIF showPlayerCount -->
            <!-- ENDIF isServerOnline -->
            <!-- IF isServerOffline -->
                <a class="fa fa-exclamation-circle text-danger has-tooltip" data-placement="top" data-title="Offline"></a>&nbsp;<strong><span class="text-danger">Offline</span></strong>
            <!-- ENDIF isServerOffline -->
            <!-- IF isServerRestarting -->
                <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Restarting"></a>&nbsp;<strong><span class="text-info">Restarting</span></strong>
            <!-- ENDIF isServerRestarting -->
            <!-- IF failHost -->{msgFailHost}<!-- ENDIF failHost -->
            <!-- IF failPort -->{msgFailPort}<!-- ENDIF failPort -->
            <!-- IF failQuery -->{msgFailQuery}<!-- ENDIF failQuery -->
            <!-- IF failListPlayers -->{msgFailListPlayers}<!-- ENDIF failListPlayers -->
            <!-- IF failListMods -->{msgFailListMods}<!-- ENDIF failListMods -->
            <!-- IF failListPlugins -->{msgFailListPlugins}<!-- ENDIF failListPlugins -->
            <!-- IF hasInvalidHost -->{msgInvalidHost}<!-- ENDIF hasInvalidHost -->
            <!-- IF hasInvalidPort -->{msgInvalidPort}<!-- ENDIF hasInvalidPort -->
            <!-- IF hasInvalidQuery -->{msgInvalidQuery}<!-- ENDIF hasInvalidQuery -->
            </td>
        </tr>
        
        <!-- BEGIN customafterstatus -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>{customafterstatus.label}</strong>
                </span>
            </td>
            <td>
                {customafterstatus.text}
            </td>
        </tr>
        <!-- END customafterstatus -->
        
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>Address</strong>
                </span>
            </td>
            <td>
                {serverHost}<!-- IF showPortDomain -->:{serverPort}<!-- ENDIF showPortDomain -->
                <!-- IF showIP -->(&nbsp;{serverIP}<!-- IF showPortIP -->:{serverPort}<!-- ENDIF showPortIP --><!-- ENDIF showIP --><!-- IF showIP -->&nbsp;)<!-- ENDIF showIP -->
            </td>
        </tr>
        
        <!-- BEGIN customafteraddress -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>{customafteraddress.label}</strong>
                </span>
            </td>
            <td>
                {customafteraddress.text}
            </td>
        </tr>
        <!-- END customafteraddress -->
        
        <!-- IF showVersion -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>Version</strong>
                </span>
            </td>
            <td>{version}
                <!-- IF modInfo -->&nbsp;<a class="fa fa-cog text-info<!-- IF showModList --> has-popover<!-- ENDIF showModList -->" data-html="true" data-title="<h6><b>Mod List</b></h6>"    data-placement="bottom"<!-- ENDIF modInfo --><!-- BEGIN modList -->{modList.modid}<!-- IF @first -->   data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END modList --><!-- IF modInfo -->></a><!-- ENDIF modInfo -->
                <!-- IF pluginInfo -->&nbsp;<a class="fa fa-plug text-info<!-- ENDIF pluginInfo --><!-- IF showPluginList --> has-popover<!-- ENDIF showPluginList --><!-- IF pluginInfo -->" data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom"<!-- ENDIF pluginInfo --><!-- BEGIN pluginList -->{pluginList.name}<!-- IF @first --> data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END pluginList --><!-- IF pluginInfo -->></a><!-- ENDIF pluginInfo -->
            </td>
        </tr>
        <!-- ENDIF showVersion -->
        
        <!-- BEGIN customafterversion -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>{customafterversion.label}</strong>
                </span>
            </td>
            <td>
                {customafterversion.text}
            </td>
        </tr>
        <!-- END customafterversion -->
        
        <!-- IF hasPlayers -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>Players</strong>
                </span>
            </td>
            <td>
                <!-- BEGIN players --><!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile --><img src="https://cravatar.eu/helmavatar/{players.name}/40" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" size="40" width="40" height="40" style="width: 40px; height: 40px; margin-bottom: 5px; margin-right: 5px; border-radius: 3px;" /><!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile --><!-- END players -->
            </td>
        </tr>
        <!-- ENDIF hasPlayers -->
        
        <!-- BEGIN customafterplayers -->
        <tr>
            <td class="td-label">
                <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                    <strong>{customafterplayers.label}</strong>
                </span>
            </td>
            <td>
                {customafterplayers.text}
            </td>
        </tr>
        <!-- END customafterplayers -->
        
        </tbody>
        </table>
    </div>
</div>
</div>