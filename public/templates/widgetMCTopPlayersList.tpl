<div class="widgetFillContainer">
    <table class="table table-striped widgetTable">
        <tbody>
        <!-- BEGIN players -->
        <tr>
            <td width="20px">
                <!-- IMPORT partials/playerAvatars.tpl -->
            </td>
            <td style="vertical-align:middle">
                <span style="<!-- IF players.glory -->color:{players.glory}<!-- ENDIF players.glory -->"><strong>{players.name}</strong></span><span style="<!-- IF colorText -->color:#{colorText}<!-- ENDIF colorText -->"> ~ {players.minutes}</span>
            </td>
        </tr>
        <!-- END players -->
        </tbody>
    </table>
</div>