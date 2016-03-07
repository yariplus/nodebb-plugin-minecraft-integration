<div>
<!-- IF isSelf -->
	<label for="player-key">Player Key</label><br>
	<div name="player-key">key-{playerKey}</div>
	<div class="btn btn-primary copyPlayerKey" data-clipboard-action="copy">Copy</div>
	<div class="btn btn-danger resetPlayerKey">Reset</div><br><br>

	<label>Your linked players.</label><br>
	<!-- IF hasPlayers -->
	<!-- ELSE -->
	<div>You have no players linked.</div>
	<!-- ENDIF hasPlayers -->

	<!-- BEGIN players -->
	<p>{players.id}</p>
	<!-- END players -->
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
