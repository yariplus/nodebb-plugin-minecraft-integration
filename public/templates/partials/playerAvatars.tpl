<!-- IF players.linkprofile --><a href="user/{players.name}"><!-- ENDIF players.linkprofile --><img src="<!-- IF avatarMojang --><!-- ENDIF avatarMojang --><!-- IF avatarCDNminotar -->http://minotar.net/avatar/{players.name}/{avatarSize}<!-- ENDIF avatarCDNminotar --><!-- IF avatarCDNsignaturecraft -->http://signaturecraft.us/avatars/{avatarSize}/face/{players.name}.png<!-- ENDIF avatarCDNsignaturecraft --><!-- IF avatarCDNcravatar -->http://cravatar.eu/avatar/{players.name}/{avatarSize}<!-- ENDIF avatarCDNcravatar -->" data-placement="top" data-toggle="tooltip" rel="tooltip" class="user-img" title="{players.name}" style="<!-- IF avatarMargin -->margin-right:{avatarMargin}px; margin-bottom:{avatarMargin}px; <!-- ENDIF avatarMargin -->border-style:{styleGlory}; border-width: 6px; border-radius: 4px; border-color:{players.glory};" /><!-- IF players.linkprofile --></a><!-- ENDIF players.linkprofile -->