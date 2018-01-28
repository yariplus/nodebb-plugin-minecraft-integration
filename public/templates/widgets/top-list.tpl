<div class="mi-container"
	data-sid="{sid}"
	data-widget="mi-top-list"
	data-colors="{useColors}"
	data-color-start="{colorStart}"
	data-color-end="{colorEnd}"
	data-border="{border}">

  <!-- BEGIN players -->
  <div class="mi-row">
    <img class="mi-avatar-left mi-avatar not-responsive"
      src="/api/minecraft-integration/avatar/{players.name}/64"
      title="{players.name}"
      data-uuid="{players.id}"
      data-toggle="tooltip"
      data-placement="top"
      rel="tooltip"
      style="width:32px;height:32px;">
    <div class="bar" style="<!-- IF useColors -->background-color:{colorBar};<!-- ENDIF useColors -->">
      <span class="score" style="<!-- IF useColors -->color:{colorText};<!-- ENDIF useColors -->">{players.scoreHuman}</span>
      <div class="tally" style="<!-- IF useColors -->background-color:{colorTally};<!-- ENDIF useColors -->" data-score="{players.score}"></div>
    </div>
  </div>
  <!-- END players -->

</div>
