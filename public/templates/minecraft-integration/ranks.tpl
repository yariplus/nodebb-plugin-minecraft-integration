<span class="h2">Server Groups</span>
<!-- BEGIN ranks -->
<div class="panel panel-primary">
  <div class="panel-heading">
    <span class="panel-title">{ranks.name}</span>
  </div>
  <div class="panel-body">
    <table class="table table-bordered">
      <tbody>
        <tr>
          <td>Name</td>
          <td>{ranks.name}</td>
        </tr>
        <!-- IF ranks.rank -->
        <tr>
          <td>Rank</td>
          <td>{ranks.rank}</td>
        </tr>
        <!-- ENDIF ranks.rank -->
        <!-- IF ranks.prefix -->
        <tr>
          <td>Prefix</td>
          <td>{ranks.prefix}</td>
        </tr>
        <!-- ENDIF ranks.prefix -->
        <!-- IF ranks.suffix -->
        <tr>
          <td>Suffix</td>
          <td>{ranks.suffix}</td>
        </tr>
        <!-- ENDIF ranks.suffix -->
      </tbody>
    </table>
  </div>
</div>
<!-- END ranks -->

<script>

</script>
