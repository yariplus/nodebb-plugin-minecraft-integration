<div>
<!-- IF isSelf -->
	<label for="player-key">Player Key</label>
	<table class="table">
		<tbody>
			<tr>
				<td>
					<div name="player-key">key-{playerKey}</div>
				</td>

				<td class="compact" style="display:none;">
					<button type="button" class="btn btn-default form-control regen-key">[[mi:regenerate]]</button>
				</td>

			</tr>
		</tbody>
	</table>
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
