<div class="col-xs-6 col-sm-6 col-md-6 col-lg-12">
<div class="panel panel-default">
    <div class="panel-heading"><span style="<!-- IF colorTitle -->color:#{colorTitle}<!-- ENDIF colorTitle -->">{title}</span></div>
    <div class="status-widget">
        <table class="table table-striped">
            <tbody>
            <!-- BEGIN topPlayers -->
            <tr>
                <td width="20px">
                    <img src="https://cravatar.eu/helmavatar/{topPlayers.player}/40" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{topPlayers.player}" size="40" width="40" height="40" style="width: 40px; height: 40px; border-style:{styleGlory}; border-width: 6px; border-radius: 4px; border-color:{topPlayers.glory};" />
                </td>
                <td style="vertical-align:middle">
                    <span style="<!-- IF topPlayers.glory -->color:{topPlayers.glory}<!-- ENDIF topPlayers.glory -->"><strong>{topPlayers.player}</strong></span><span style="<!-- IF colorText -->color:#{colorText}<!-- ENDIF colorText -->"> ~ {topPlayers.minutes}</span>
                </td>
            </tr>
            <!-- END topPlayers -->
            </tbody>
        </table>
    </div>
</div>
</div>