<div class="serverstatus">
    <div class="container">
        <div class="row">
            <div class="col-md-4">
                <h4>{servername}</h4>
                <table class="table table-striped">
                <tbody>
                <tr>
                    <td class="td-label"><strong>Status</strong></td>
                    <td>
                    <!-- IF !serveronline -->
                        <strong><span class="text-warning">Offline</span></strong>
                    <!-- ELSE -->
                        <strong><span class="text-success">Online</span></strong><!-- IF showplayercount -->&nbsp;({onlineplayers}/{maxplayers})<!-- ENDIF showplayercount -->
                    <!-- ENDIF !serveronline -->
                    </td>
                </tr>
                <tr>
                    <td class="td-label"><strong>Address</strong></td>
                    <td>
                        {serverhost}<!-- IF showportdomain -->:{serverport}<!-- ENDIF showportdomain -->
                        <!-- IF showip -->(&nbsp;{serverip}<!-- IF showportip -->:{serverport}<!-- ENDIF showportip --><!-- ENDIF showip --><!-- IF showip -->&nbsp;)<!-- ENDIF showip -->
                    </td>
                </tr>
                <!-- IF !queryonline -->
                <tr>
                    <td class="td-label"><strong>Query</strong></td>
                    <td>Did not find query port {queryport}</td>
                </tr>
                <!-- ENDIF !queryonline -->
                <!-- IF serveronline -->
                <tr>
                    <td class="td-label"><strong>Version</strong></td>
                    <td>{version}</td>
                </tr>
                <tr>
                    <td class="td-label"><strong>Players</strong></td>
                    <td>
                        <!-- BEGIN players -->
                        
                            <img src="https://cravatar.eu/helmavatar/{players.name}/40" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" size="40" width="40" height="40" style="width: 40px; height: 40px; margin-bottom: 5px; margin-right: 5px; border-radius: 3px;" />
                        
                        <!-- END players -->
                    </td>
                </tr>
                <!-- ENDIF serveronline -->
                </tbody>
                </table>
            </div>
        </div>
    </div>
</div>