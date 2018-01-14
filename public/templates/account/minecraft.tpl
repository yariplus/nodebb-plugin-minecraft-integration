<div>
	<span class="h1">Linked Minecraft Accounts for {username}</span>
	<hr>

	<!-- IF hasPlayers -->
	<table class="table table-striped">
		<thead>
			<tr>
        <th class="mi-no-wrap"></th>
				<th class="mi-no-wrap">Player</th>
        <th class="mi-no-wrap">UUID</th>
				<th class="mi-no-wrap">Prefix</th>
				<th class="mi-no-wrap">Play Time</th>
				<th class="mi-no-wrap">Last Online</th>
        <!-- IF isSelf -->
				<th class="mi-full-width">Actions</th>
        <!-- ENDIF isSelf -->
			</tr>
		</thead>
		<tbody id="miTablePlayers">
		<!-- BEGIN players -->
			<tr data-uuid="{players.id}">
        <td class="mi-no-wrap"><!-- IF players.isPrimary --><i class="fa fa-star-o mi-text-primary" aria-hidden="true"></i><!-- ENDIF players.isPrimary --></td>
        <td class="mi-no-wrap"><img src="{config.relative_path}/api/minecraft-integration/avatar/{players.name}/64" title="{players.name}" data-placement="top" data-toggle="tooltip" rel="tooltip" class="mi-avatar" width="32" height="32" /></td>
				<td class="mi-no-wrap"><span class="mi-player-id" data-clipboard-action="copy" data-clipboard-text="{players.id}">{players.id}</span></td>
        <td class="mi-no-wrap"><span class="prefix">{players.prefix}</span></td>
				<td class="mi-no-wrap">{players.playtime}</td>
        <td class="mi-no-wrap">{players.lastonline}</td>
        <!-- IF isSelf -->
				<td>
          <a class="mi-btn-unlink-player">Unlink</a>
          <!-- IF !players.isPrimary --> | <a class="btn-sm mi-btn-make-player-primary">Make Primary</a><!-- ENDIF !players.isPrimary --></td>
        <!-- ENDIF isSelf -->
			</tr>
			<!-- END players -->
		</tbody>
	</table>
	<!-- ELSE -->
	<div class="alert alert-warning">
		No players are linked.
	</div>
	<!-- ENDIF hasPlayers -->

	<!-- IF isSelf -->
	<div class="alert alert-info">
		To link players, use the command <b>/link</b> on the Minecraft server.
	</div>
	<!-- ENDIF isSelf -->

<!-- IF hide -->
<!-- IF minecraftProfile.lastonline -->
Last Online: {minecraftProfile.lastonline}<br />
<!-- ENDIF minecraftProfile.lastonline -->

<!-- IF minecraftProfile.playtime -->
Total Playtime: {minecraftProfile.playtime}<br />
<!-- ENDIF minecraftProfile.playtime -->
<!-- ENDIF hide -->

</div>
