<div class="mi-container" data-widget="mi-chat" data-sid="{sid}">
  <div class="mi-chat-box">
    <!-- BEGIN chats -->
    <span>{chats.name}: {chats.message}</span><br>
    <!-- END chats -->
  </div>
  <!-- IF user.hasplayers -->
  <div class="input-group input-group-sm">
    <input type="text" class="form-control" placeholder="Server Chat">
    <span class="input-group-btn">
      <button class="btn btn-success" type="button">[[mi:send]]</button>
    </span>
  </div>
  <!-- ENDIF user.hasplayers -->
</div>
