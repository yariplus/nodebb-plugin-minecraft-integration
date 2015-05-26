<div class="form-group">
    <label>Server</label>
    <select class="form-control">
        <!-- BEGIN servers -->
        <option value="{servers.sid}">{servers.name}</option>
        <!-- END servers -->
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="sid">
</div>

<div class="form-group">
    <label>Statistic</label>
    <select class="form-control">
        <option value="online">Online Time</option>
        <option value="mcmmo">McMMO Stat</option>
        <option value="money">Vault Money</option>
        <option value="score">Score</option>
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="statistic">
</div>

<div class="form-group">
    <label>Max&nbsp;Players</label>
    <select class="form-control">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5" selected="selected">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
        <option value="11">11</option>
        <option value="12">12</option>
        <option value="13">13</option>
        <option value="14">14</option>
        <option value="15">15</option>
        <option value="16">16</option>
        <option value="17">17</option>
        <option value="18">18</option>
        <option value="19">19</option>
        <option value="20">20</option>
        <option value="21">21</option>
        <option value="22">22</option>
        <option value="23">23</option>
        <option value="24">24</option>
        <option value="25">25</option>
        <option value="26">26</option>
        <option value="27">27</option>
        <option value="28">28</option>
        <option value="29">29</option>
        <option value="30">30</option>
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="showTopPlayers">
</div>

<div class="form-group">
    <div class="checkbox">
        <label>
            <input type="checkbox" name="showGlory">Show Avatar Border?
        </label>
    </div>
</div>

<div class="form-group">
    <label>Avatar&nbsp;Border&nbsp;Style</label>
    <select class="form-control">
        <option value="double" selected="selected">Double</option>
        <option value="ridge">Ridge</option>
        <option value="groove">Groove</option>
        <option value="inset">Inset</option>
        <option value="outset">Outset</option>
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
    </select>
    <input type="hidden" class="ajaxSelectSibling" name="styleGlory">
</div>

<div class="form-group">
    <label class="control-label">Avatar Border gradient start</label>
    <div>
        <input type="text" class="form-control ajaxInputColorPicker" name="gloryStart">
    </div>
</div>

<div class="form-group">
    <label class="control-label">Avatar Border gradient end</label>
    <div>
        <input type="text" class="form-control ajaxInputColorPicker" name="gloryEnd">
    </div>
</div>

<div class="form-group">
    <label class="control-label">Title&nbsp;Color</label>
    <div>
        <input type="text" class="form-control ajaxInputColorPicker" name="colorTitle">
    </div>
</div>

<div class="form-group">
    <label class="control-label">Text&nbsp;Color</label>
    <div>
        <input type="text" class="form-control ajaxInputColorPicker" name="colorText">
    </div>
</div>
