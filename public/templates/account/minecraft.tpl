<div>
	<span class="h1">Linked Minecraft Accounts for {username}</span>
	<hr>

	<!-- IF hasPlayers -->
	<table class="table table-striped">
		<thead>
			<tr>
				<th>UUID</th>
				<th>Player Name</th>
				<th>Prefix</th>
				<th>Play Time</th>
				<th>Last Online</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody id="miTablePlayers">
		<!-- BEGIN players -->
			<tr data-uuid="{players.id}">
				<td class="compact no-break">{players.id}</td>
				<td><span class="name">{players.name}</span></td>
				<td><span class="prefix">{players.prefix}</span></td>
				<td>{players.playtime}</td><td>{players.lastonline}</td>
				<td class="compact squish"><button type="button" class="btn btn-danger mi-btn-delete-player" style="display:none;">Unlink</button></td>
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
