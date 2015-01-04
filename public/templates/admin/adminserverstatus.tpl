<label>Server Display Name</label>
<input type="text" class="form-control" name="hostname" placeholder="Server Name" />
<div class="checkbox">
    <label>
        <input type="checkbox" name="showname" checked></input>
        Use queried name instead if available? ( Recommended )
    </label>
</div>
<div class="checkbox">
    <label>
        <input type="checkbox" name="parseformatcodes" checked></input>
        Parse format codes in name?
    </label>
</div>

<br />

<label>Server IP or domain name</label>
<input type="text" class="form-control" name="serverhost" placeholder="0.0.0.0" />
<div class="checkbox">
    <label>
        <input type="checkbox" name="showip"></input>
        Show IP and domain? ( e.g. "someserver.com (1.2.3.4)", leave unchecked if using an IP above. )
    </label>
</div>
<div class="checkbox">
    <label>
        <input type="checkbox" name="uselocalhost"></input>
        Use localhost for query? ( Will still ping domain for online status, but pulls query data locally. )
    </label>
</div>

<br />

<label>Query Port:</label>
<input type="text" class="form-control" name="queryport" placeholder="25565" />

<div class="checkbox">
    <label>
        <input type="checkbox" name="showportdomain"></input>
        Show port after domain? ( e.g. "someserver.com:25565" )
    </label>
</div>
<div class="checkbox">
    <label>
        <input type="checkbox" name="showportip" checked></input>
        Show port after IP? ( e.g. "( 1.2.3.4:25565 )" )
    </label>
</div>

<br />
