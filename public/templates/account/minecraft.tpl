<div>
	<span class="h1">Linked Minecraft Accounts for {username}</span>
	<hr>

	<!-- IF hasPlayers -->
	<table class="table table-striped">
		<thead>
			<tr>
        <th class="mi-no-wrap"></th>
				<th class="mi-no-wrap">Player</th>
				<th class="mi-no-wrap">Prefix</th>
				<th class="mi-no-wrap">Play Time</th>
				<th class="mi-no-wrap">Last Online</th>
				<th class="mi-full-width">Actions</th>
			</tr>
		</thead>
		<tbody id="miTablePlayers">
		<!-- BEGIN players -->
			<tr data-uuid="{players.id}">
        <td class="mi-no-wrap"><!-- IF players.isPrimary --><i class="fa fa-star-o mi-text-primary" aria-hidden="true"></i><!-- ELSE --><i class="fa fa-circle-o mi-text-o" aria-hidden="true"></i><!-- ENDIF players.isPrimary --></td>
        <td class="mi-no-wrap"><img src="{config.relative_path}/api/minecraft-integration/avatar/{players.name}/64" title="{players.name}" data-placement="top" data-toggle="tooltip" rel="tooltip" class="mi-avatar" width="32" height="32" /></td>
				<td class="mi-no-wrap"><span class="prefix">{players.prefix}</span></td>
				<td class="mi-no-wrap">{players.playtime}</td>
        <td class="mi-no-wrap">{players.lastonline}</td>
				<td><button type="button" class="btn btn-danger mi-btn-delete-player" style="display:none;">Unlink</button></td>
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
		Use the player key below to link a minecraft account to your forum account by using the <b>/register</b> command when logged into the minecraft server.
	</div>
	<label for="player-key">Player Key</label><br>
	<div name="player-key">key-{playerKey}</div>
	<div class="btn btn-primary copyPlayerKey" data-clipboard-action="copy">Copy</div>
	<div class="btn btn-danger resetPlayerKey">Reset</div><br><br>
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
