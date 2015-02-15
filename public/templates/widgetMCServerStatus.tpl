<div class="widgetFillContainer">
    <table class="table table-striped widgetTable">
    <tbody>
    
    <!-- IF showRowMOTD -->
    <tr>
        <td class="td-label" colspan="2">
            <span<!-- IF colorMOTD --> style="color:#{colorMOTD}"<!-- ENDIF colorMOTD -->>
                {serverMOTD}
            </span>
        </td>
    </tr>
    <!-- ENDIF showRowMOTD -->
    
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
                <!-- IF msgFailQuery -->{msgFailQuery}<!-- ENDIF msgFailQuery -->
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
                <!-- IF hasMods -->&nbsp;<a class="fa fa-cog text-info has-popover" data-html="true" data-title="<h6><b>Mod List</b></h6>" data-placement="bottom"<!-- ENDIF hasMods --><!-- BEGIN modList -->{modList.modid}<!-- IF @first -->   data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END modList --><!-- IF hasMods -->></a><!-- ENDIF hasMods -->
                <!-- IF hasPlugins -->&nbsp;<a class="fa fa-plug text-info has-popover"<!-- ENDIF hasPlugins --><!-- IF !hidePluginList --> data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom"<!-- ENDIF !hidePluginList --><!-- BEGIN pluginList -->{pluginList.name}<!-- IF @first --> data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END pluginList --><!-- IF hasPlugins -->></a><!-- ENDIF hasPlugins -->
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
    
    <!-- IF showPlayers -->
    <tr>
        <td class="td-label">
            <span<!-- IF colorLabels --> style="color:#{colorLabels}"<!-- ENDIF colorLabels -->>
                <strong>Players</strong>
            </span>
        </td>
        <td>
            <span<!-- IF colorText --> style="color:#{colorText}"<!-- ENDIF colorText -->>
                <!-- BEGIN players -->
                <!-- IMPORT partials/playerAvatars.tpl -->
                <!-- END players -->
            </span>
        </td>
    </tr>
    <!-- ENDIF showPlayers -->
    
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
    <!-- IF showMiniMap -->
    <iframe class="mcweIFrame" src="{minimapURI}" height-ratio="2">Your browser does not support the iframe tag.</iframe>
    <!-- ENDIF showMiniMap -->
    <!-- IF mapURI -->
    <!-- IMPORT partials/modalMap.tpl -->
    <!-- ENDIF mapURI -->
</div>