<div class="mi-container"
	data-sid="{sid}"
	data-widget="mi-top-list"
	data-colors="{useColors}"
	data-color-start="{colorStart}"
	data-color-end="{colorEnd}"
	data-border="{border}">

	<table class="table widget-table">
		<tbody>
			<!-- BEGIN players -->
			<tr>
				<td>

					<img class="mi-avatar not-responsive"
						src="data:image/png;base64,{players.avatar}"
						title="{players.name}"
						data-uuid="{players.id}"
						data-toggle="tooltip"
						data-placement="top"
						rel="tooltip">

				</td>
				<td style="vertical-align:middle">

					<span class="score">
						<strong>{players.playername}</strong> ~ <span class="mi-score">{players.score}</span> {statname}
					</span>

				</td>
			</tr>
			<!-- END players -->
		</tbody>
	</table>

</div>
