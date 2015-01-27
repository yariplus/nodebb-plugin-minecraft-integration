<div class="widgetFillContainer">
    <table class="table table-striped widgetTable">
    <tbody>
    
    <!-- IF serverName -->
    <tr>
        <td class="td-padded" colspan="2">
            <span style="color:#{colorName}">
                <strong>{serverName}</strong>
            </span>
        </td>
    </tr>
    <!-- ENDIF serverName -->
    
    <!-- BEGIN customaftername -->
    <tr>
        <td class="td-label">
            <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                <strong>{customaftername.label}</strong>
            </span>
        </td>
        <td>
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {customaftername.text}
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
            <!-- IF isServerOnline -->
                <a class="fa fa-check-circle text-success has-tooltip" data-placement="top" data-title="Pinged server at {serverIP}:{serverPort}"></a>&nbsp;<strong><span class="text-success">Online</span></strong><!-- IF showPlayerCount -->&nbsp;({onlinePlayers}/{maxPlayers})<!-- ENDIF showPlayerCount -->
            <!-- ENDIF isServerOnline -->
            <!-- IF isServerOffline -->
                <a class="fa fa-exclamation-circle text-danger has-tooltip" data-placement="top" data-title="Pinged server at {serverIP}:{serverPort}"></a>&nbsp;<strong><span class="text-danger">Offline</span></strong>
            <!-- ENDIF isServerOffline -->
            <!-- IF isServerRestarting -->
                <a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Pinged server at {serverIP}:{serverPort}"></a>&nbsp;<strong><span class="text-info">Restarting</span></strong>
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
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {customafterstatus.text}
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {serverHost}<!-- IF showPortDomain -->:{serverPort}<!-- ENDIF showPortDomain -->
                <!-- IF showIP -->(&nbsp;{serverIP}<!-- IF showPortIP -->:{serverPort}<!-- ENDIF showPortIP --><!-- ENDIF showIP --><!-- IF showIP -->&nbsp;)<!-- ENDIF showIP -->
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {customafteraddress.text}
            </span>
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
        <td>
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {version}
                <!-- IF modInfo -->&nbsp;<a class="fa fa-cog text-info<!-- IF showModList --> has-popover<!-- ENDIF showModList -->" data-html="true" data-title="<h6><b>Mod List</b></h6>"    data-placement="bottom"<!-- ENDIF modInfo --><!-- BEGIN modList -->{modList.modid}<!-- IF @first -->   data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END modList --><!-- IF modInfo -->></a><!-- ENDIF modInfo -->
                <!-- IF pluginInfo -->&nbsp;<a class="fa fa-plug text-info<!-- ENDIF pluginInfo --><!-- IF showPluginList --> has-popover<!-- ENDIF showPluginList --><!-- IF pluginInfo -->" data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom"<!-- ENDIF pluginInfo --><!-- BEGIN pluginList -->{pluginList.name}<!-- IF @first --> data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END pluginList --><!-- IF pluginInfo -->></a><!-- ENDIF pluginInfo -->
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {customafterversion.text}
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                <!-- BEGIN players --><!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile --><img src="
                <!-- IF avatarCDNminotar -->
                https://minotar.net/avatar/{players.name}/{avatarSize}
                <!-- ENDIF avatarCDNminotar -->
                <!-- IF avatarCDNsignaturecraft -->
                http://signaturecraft.us/avatars/{avatarSize}/face/{players.name}.png
                <!-- ENDIF avatarCDNsignaturecraft -->
                <!-- IF avatarCDNcravatar -->
                http://cravatar.eu/avatar/{players.name}/{avatarSize}"
                <!-- ENDIF avatarCDNcravatar -->
                " data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" style="margin-bottom: 5px; margin-right: 5px; border-style:{styleGlory}; border-width: 6px; border-radius: 4px; border-color:{players.glory};" /><!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile --><!-- END players -->
            </span>
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
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                {customafterplayers.text}
            </span>
        </td>
    </tr>
    <!-- END customafterplayers -->
    
    </tbody>
    </table>
</div>