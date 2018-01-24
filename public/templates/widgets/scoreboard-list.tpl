<div class="mi-container"
	data-sid="{sid}"
	data-widget="mi-scoreboard-list"
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
    <div class="bar" style="background-color:{colorBar};">
      <span class="score" style="color:{colorText};">{players.score}</span>
      <div class="tally" style="background-color:{colorTally};" data-score="{players.score}"></div>
    </div>
  </div>
  <!-- END players -->

</div>
