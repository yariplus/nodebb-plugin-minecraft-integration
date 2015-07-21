<div class="mi-container" data-widget="mi-top-list" data-sid="{sid}"
	<!-- IF !show-avatar-borders -->data-show-avatar-borders="off"<!-- ENDIF !show-avatar-borders -->
	data-avatar-border-start="#{avatar-border-start}"
	data-avatar-border-end="#{avatar-border-end}"
	data-avatar-border-style="{avatar-border-style}">
	<table class="table widget-table">
		<tbody>
		<!-- BEGIN players -->
		<tr>
			<td width="20px">
				<img src="data:image/png;base64,{players.avatar}" title="{players.playername}" data-uuid="{players.uuid}" data-placement="top" data-toggle="tooltip" rel="tooltip" class="mi-avatar user-img">
			</td>
			<td style="vertical-align:middle">
				<span style="<!-- IF players.glory -->color:{players.glory}<!-- ENDIF players.glory -->"><strong>{players.playername}</strong></span><span style="<!-- IF colorText -->color:#{colorText}<!-- ENDIF colorText -->"> ~ <span class="mi-score">{players.score}</span> {statname}</span>
			</td>
		</tr>
		<!-- END players -->
		</tbody>
	</table>
</div>
