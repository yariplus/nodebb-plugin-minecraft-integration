<div class="mi-container" data-widget="mi-top-list" data-sid="{sid}"
	<!-- IF show-colors -->data-show-colors="on"<!-- ENDIF show-colors -->
	data-color-start="<!-- IF color-start -->#{color-start}<!-- ENDIF color-start -->"
	data-color-end="<!-- IF color-end -->#{color-end}<!-- ENDIF color-end -->"
	data-border-style="{border-style}">
	<table class="table widget-table">
		<tbody>
		<!-- BEGIN players -->
		<tr>
			<td width="20px">
				<img class="mi-avatar user-img" src="data:image/png;base64,{players.avatar}" title="{players.name}" data-uuid="{players.id}" data-placement="top" data-toggle="tooltip" rel="tooltip">
			</td>
			<td style="vertical-align:middle">
				<span class="score" style="<!-- IF players.color -->color:{players.color}<!-- ENDIF players.color -->">
					<strong>
						{players.playername}
					</strong>
					~ <span class="mi-score">{players.score}</span> {statname}
				</span>
			</td>
		</tr>
		<!-- END players -->
		</tbody>
	</table>
</div>
