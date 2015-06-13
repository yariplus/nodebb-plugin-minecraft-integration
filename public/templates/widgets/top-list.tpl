<div class="mi-container" data-widget="mi-top-list" data-sid="{sid}">
    <table class="table widget-table">
        <tbody>
        <!-- BEGIN players -->
        <tr>
            <td width="20px">
                <img src="data:image/png;base64,{players.avatar}" title="{players.playername}" data-uuid="{players.uuid}" style="border-style: double; border-width: 0px; border-radius: 4px; border-color: pink;" data-placement="top" data-toggle="tooltip" rel="tooltip" class="mi-avatar user-img">
            </td>
            <td style="vertical-align:middle">
                <span style="<!-- IF players.glory -->color:{players.glory}<!-- ENDIF players.glory -->"><strong>{players.playername}</strong></span><span style="<!-- IF colorText -->color:#{colorText}<!-- ENDIF colorText -->"> ~ <span class="mi-score">{players.score}</span> {statname}</span>
            </td>
        </tr>
        <!-- END players -->
        </tbody>
    </table>
</div>
