<div class="serverstatus">
    <div class="container">
        <div class="row">
            <div class="col-md-4">
                <h4>{hostname}</h4>
                <table class="table table-striped">
                <tbody>
                <tr>
                    <td class="td-label"><b>Status</b></td>
                    <td>
                    <!-- IF !serveronline -->
                        Offline
                    <!-- ELSE -->
                        Online
                    <!-- ENDIF !serveronline -->
                    <!-- IF showplayercount -->&nbsp;(0/0)<!-- ENDIF showplayercount -->
                    </td>
                </tr>
                <tr>
                    <td class="td-label"><b>Address</b></td>
                    <td>
                        {serverhost}<!-- IF showportdomain -->:{hostport}<!-- ENDIF showportdomain -->
                        <!-- IF showip -->(&nbsp;{hostip}<!-- IF showportip -->:{hostport}<!-- ENDIF showportip --><!-- ENDIF showip --><!-- IF showip -->&nbsp;)<!-- ENDIF showip -->
                    </td>
                </tr>
                <!-- IF !queryonline -->
                <tr>
                    <td class="td-label"><b>Query</b></td>
                    <td>Did not find query port {queryport}</td>
                </tr>
                <!-- ENDIF !queryonline -->
                <!-- IF serveronline -->
                <tr>
                    <td class="td-label"><b>Version</b></td>
                    <td>{version}</td>
                </tr>
                <tr>
                    <td class="td-label"><b>Players</b></td>
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