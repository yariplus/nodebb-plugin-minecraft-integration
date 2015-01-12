<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading">{serverName}</div>
    <div class="status-widget">
        <table class="table table-striped">
        <tbody>
        
        <!-- BEGIN customaftername -->
        <tr>
            <td class="td-label"><strong>{customaftername.label}</strong></td>
            <td>
                {customaftername.text}
            </td>
        </tr>
        <!-- END customaftername -->
        
        <tr>
            <td class="td-label"><strong>Status</strong></td>
            <td>
            <!-- IF !isServerOnline -->
                <a class="fa fa-exclamation-circle text-danger has-tooltip" data-placement="top" data-title="Offline" />&nbsp;<strong><span class="text-danger">Offline</span></strong>
            <!-- ELSE -->
                <a class="fa fa-check-circle text-success has-tooltip" data-placement="top" data-title="Online" />&nbsp;<strong><span class="text-success">Online</span></strong><!-- IF showPlayerCount -->&nbsp;({onlinePlayers}/{maxPlayers})<!-- ENDIF showPlayerCount -->
            <!-- ENDIF !isServerOnline -->
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
            <td class="td-label"><strong>{customafterstatus.label}</strong></td>
            <td>
                {customafterstatus.text}
            </td>
        </tr>
        <!-- END customafterstatus -->
        
        <tr>
            <td class="td-label"><strong>Address</strong></td>
            <td>
                {serverHost}<!-- IF showPortDomain -->:{serverPort}<!-- ENDIF showPortDomain -->
                <!-- IF showIP -->(&nbsp;{serverIP}<!-- IF showPortIP -->:{serverPort}<!-- ENDIF showPortIP --><!-- ENDIF showIP --><!-- IF showIP -->&nbsp;)<!-- ENDIF showIP -->
            </td>
        </tr>
        
        <!-- BEGIN customafteraddress -->
        <tr>
            <td class="td-label"><strong>{customafteraddress.label}</strong></td>
            <td>
                {customafteraddress.text}
            </td>
        </tr>
        <!-- END customafteraddress -->
        
        <!-- IF isServerOnline -->
        <tr>
            <td class="td-label"><strong>Version</strong></td>
            <td>{version}
                <!-- IF modInfo -->&nbsp;<div class="fa fa-cog text-info<!-- IF showModList --> has-popover<!-- ENDIF showModList -->" data-html="true" data-title="<h6><b>Mod List</b></h6>"    data-placement="bottom"<!-- ENDIF modInfo --><!-- BEGIN modList -->{modList.modid}<!-- IF @first -->   data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END modList --><!-- IF modInfo -->></div><!-- ENDIF modInfo -->
                <!-- IF pluginInfo -->&nbsp;<div class="fa fa-plug text-info<!-- IF showPluginList --> has-popover<!-- ENDIF showPluginList -->" data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom"<!-- ENDIF pluginInfo --><!-- BEGIN pluginList -->{pluginList.name}<!-- IF @first --> data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END pluginList --><!-- IF pluginInfo -->></div><!-- ENDIF pluginInfo -->
            </td>
        </tr>
        <!-- ENDIF isServerOnline -->
        
        <!-- BEGIN customafterversion -->
        <tr>
            <td class="td-label"><strong>{customafterversion.label}</strong></td>
            <td>
                {customafterversion.text}
            </td>
        </tr>
        <!-- END customafterversion -->
        
        <!-- IF hasPlayers -->
        <tr>
            <td class="td-label"><strong>Players</strong></td>
            <td>
                <!-- BEGIN players --><!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile --><img src="https://cravatar.eu/helmavatar/{players.name}/40" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" size="40" width="40" height="40" style="width: 40px; height: 40px; margin-bottom: 5px; margin-right: 5px; border-radius: 3px;" /><!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile --><!-- END players -->
            </td>
        </tr>
        <!-- ENDIF hasPlayers -->
        
        <!-- BEGIN customafterplayers -->
        <tr>
            <td class="td-label"><strong>{customafterplayers.label}</strong></td>
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