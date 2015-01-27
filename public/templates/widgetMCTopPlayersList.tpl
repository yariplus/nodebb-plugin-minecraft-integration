<div class="widgetFillContainer">
    <table class="table table-striped widgetTable">
        <tbody>
        <!-- BEGIN players -->
        <tr>
            <td width="20px">
                <!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile --><img src="
                <!-- IF avatarCDNminotar -->
                https://minotar.net/avatar/{players.name}/{avatarSize}
                <!-- ENDIF avatarCDNminotar -->
                <!-- IF avatarCDNsignaturecraft -->
                http://signaturecraft.us/avatars/{avatarSize}/face/{players.name}.png
                <!-- ENDIF avatarCDNsignaturecraft -->
                <!-- IF avatarCDNcravatar -->
                http://cravatar.eu/avatar/{players.name}/{avatarSize}"
                <!-- ENDIF avatarCDNcravatar -->
                " data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" style="border-style:{styleGlory}; border-width: 6px; border-radius: 4px; border-color:{players.glory};" /><!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile -->
            </td>
            <td style="vertical-align:middle">
                <span style="<!-- IF players.glory -->color:{players.glory}<!-- ENDIF players.glory -->"><strong>{players.player}</strong></span><span style="<!-- IF colorText -->color:#{colorText}<!-- ENDIF colorText -->"> ~ {players.minutes}</span>
            </td>
        </tr>
        <!-- END players -->
        </tbody>
    </table>
</div>