<div class="mi-container"
	data-widget="mi-status"
	data-sid="{sid}"
	data-colors="{useColors}"
	data-color-start="{colorStart}"
	data-color-end="{colorEnd}"
	data-border="{border}">

	<table class="table widget-table">

		<tbody>
			<!-- IF showMOTD -->
			<tr>
				<td class="td-label" colspan="2">
					<span style="color:{colorMOTD}">{motd}</span>
				</td>
			</tr>
			<!-- ENDIF showMOTD -->

			<tr>
				<td class="td-label">
					<span style="color:{colorLabels}">
						<strong>[[mi:status]]</strong>
					</span>
				</td>
				<td>
					<span style="color:{colorText}">

						<a class="mc-statusicon fa has-tooltip

							<!-- IF isServerOnline -->
								fa-check-circle text-success
							<!-- ENDIF isServerOnline -->
							<!-- IF !isServerOnline -->
								fa-exclamation-circle text-danger
							<!-- ENDIF !isServerOnline -->

						" data-placement="top" data-title="Last ping received {humanPing}"></a>

						<strong>
							<span class="mc-statustext

								<!-- IF isServerOnline -->
									text-success
								<!-- ENDIF isServerOnline -->
								<!-- IF !isServerOnline -->
									text-danger
								<!-- ENDIF !isServerOnline -->

							"><!-- IF isServerOnline -->Online<!-- ENDIF isServerOnline --><!-- IF !isServerOnline -->Offline<!-- ENDIF !isServerOnline --></span>
						</strong>

						<!-- IF showPlayerCount -->
						<span class="mc-playercount">
							(<span class="online-players">{onlinePlayers}</span>/<span class="max-players">{maxPlayers}</span>)
						</span>
						<!-- ENDIF showPlayerCount -->

						<!-- IF isServerRestarting -->
							<a class="fa fa-question-circle text-info has-tooltip" data-placement="top" data-title="Pinged server at {serverIP}:{serverPort}"></a>&nbsp;<strong><span class="text-info">Restarting</span></strong>
						<!-- ENDIF isServerRestarting -->
					</span>
				</td>
			</tr>

			<!-- BEGIN customafterstatus -->
			<tr>
				<td class="td-label">
					<span style="color:{colorLabels}">
						<strong>{customafterstatus.label}</strong>
					</span>
				</td>
				<td>
					<span style="color:{colorText}">
						{customafterstatus.text}
					</span>
				</td>
			</tr>
			<!-- END customafterstatus -->

			<tr>
				<td class="td-label">
					<span style="color:{colorLabels}">
						<strong>Address</strong>
					</span>
				</td>
				<td>
					<span class="mi-serveraddress" style="color:{colorText}">{address}</span>
					<i class="fa fa-copy mi-serveraddresscopy" data-clipboard-action="copy" data-clipboard-text="{address}"></i>
				</td>
			</tr>

			<!-- IF showVersion -->
			<tr>
				<td class="td-label">
					<span style="color:{colorLabels}">
						<strong>Version</strong>
					</span>
				</td>
				<td>
					<span style="color:{colorText}">
						{version}
						<!-- IF hasPlugins -->&nbsp;<a class="fa fa-plug text-info" data-popover="plugin-list" data-html="true" data-title="[[mi:plugin_list]]" data-placement="bottom"></a><!-- ENDIF hasPlugins -->
						<!-- IF hasMods -->&nbsp;<a class="fa fa-gavel text-danger" data-popover="mod-list" data-html="true" data-title="[[mi:mod_list]]" data-placement="bottom"></a><!-- ENDIF hasMods -->
						<!-- IF hasModPack -->&nbsp;<a class="fa fa-gift" data-popover="mod-list" data-html="true" data-title="[[mi:mod_pack_info]]" data-placement="bottom"></a><!-- ENDIF hasModPack -->
						<!-- IF hasSponge -->&nbsp;<a class="fa fa-life-ring" data-popover="mod-list" data-html="true" data-title="[[mi:sponge_mods]]" data-placement="bottom"></a><!-- ENDIF hasSponge -->
						<!-- IF hasBungeecord -->&nbsp;<a class="fa fa-arrows-alt" data-popover="mod-list" data-html="true" data-title="[[mi:hub_list]]" data-placement="bottom"></a><!-- ENDIF hasBungeecord -->
					</span>
				</td>
			</tr>
			<!-- ENDIF showVersion -->

			<!-- IF showAvatars -->
			<tr>
				<td class="mi-avatars" colspan="2"><!-- IMPORT partials/playerAvatars.tpl --></td>
			</tr>
			<!-- ENDIF showAvatars -->

		</tbody>
	</table>
	<!-- IF mapshow -->
	<iframe class="mi-iframe" src="{uri}" data-height-ratio="2"></iframe>
	<!-- ENDIF mapshow -->
	<!-- IF mapURI -->
	<!-- IMPORT partials/modalMap.tpl -->
	<!-- ENDIF mapURI -->
</div>
