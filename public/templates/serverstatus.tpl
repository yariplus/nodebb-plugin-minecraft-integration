<div class="serverstatus">
    <div class="container">
        <div class="row">
            <div class="col-md-4">
                <strong><h4>{servername}</h4></strong>
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
                    <!-- IF !serveronline -->
                        <span class="fa fa-exclamation-circle text-danger" />&nbsp;<strong><span class="text-warning">Offline</span></strong>
                    <!-- ELSE -->
                        <span data-placement="top" data-title="Status" data-title="Online" class="fa fa-check-circle text-success has-tooltip" />&nbsp;<strong><span class="text-success">Online</span></strong><!-- IF showplayercount -->&nbsp;({onlineplayers}/{maxplayers})<!-- ENDIF showplayercount -->
                    <!-- ENDIF !serveronline -->
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
                        {serverhost}<!-- IF showportdomain -->:{serverport}<!-- ENDIF showportdomain -->
                        <!-- IF showip -->(&nbsp;{serverip}<!-- IF showportip -->:{serverport}<!-- ENDIF showportip --><!-- ENDIF showip --><!-- IF showip -->&nbsp;)<!-- ENDIF showip -->
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
                
                <!-- IF !queryonline -->
                <tr>
                    <td class="td-label"><strong>Query</strong></td>
                    <td>Did not find query port {queryport}</td>
                </tr>
                <!-- ENDIF !queryonline -->
                
                <!-- IF serveronline -->
                <tr>
                    <td class="td-label"><strong>Version</strong></td>
                    <td>{version}
                        <!-- IF modinfo -->&nbsp;<div class="fa fa-cog text-info  has-popover" data-html="true" data-title="<h6><b>Mod List</b></h6>"    data-placement="bottom"<!-- ENDIF modinfo --><!-- BEGIN modList -->{modList.modid}<!-- IF @first -->   data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END modList --><!-- IF modinfo -->></div><!-- ENDIF modinfo -->
                        <!-- IF pluginInfo -->&nbsp;<div class="fa fa-plug text-info has-popover" data-html="true" data-title="<h6><b>Plugin List</b></h6>" data-placement="bottom"<!-- ENDIF pluginInfo --><!-- BEGIN pluginList -->{pluginList.name}<!-- IF @first --> data-content="&lt;h6&gt;<!-- ENDIF @first --><!-- IF @last -->&lt;/h6&gt;"<!-- ELSE --><!-- IF !@first -->, <!-- ENDIF !@first --><!-- ENDIF @last --><!-- END pluginList --><!-- IF pluginInfo -->></div><!-- ENDIF pluginInfo -->
                    </td>
                </tr>
                <!-- ENDIF serveronline -->
                
                <!-- BEGIN customafterversion -->
                <tr>
                    <td class="td-label"><strong>{customafterversion.label}</strong></td>
                    <td>
                        {customafterversion.text}
                    </td>
                </tr>
                <!-- END customafterversion -->
                
                <!-- IF serveronline -->
                <tr>
                    <td class="td-label"><strong>Players</strong></td>
                    <td>
                        <!-- BEGIN players -->
                            <!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile -->
                            <img src="https://cravatar.eu/helmavatar/{players.name}/40" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" size="40" width="40" height="40" style="width: 40px; height: 40px; margin-bottom: 5px; margin-right: 5px; border-radius: 3px;" />
                            <!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile -->
                        <!-- END players -->
                    </td>
                </tr>
                <!-- ENDIF serveronline -->
                
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
</div>