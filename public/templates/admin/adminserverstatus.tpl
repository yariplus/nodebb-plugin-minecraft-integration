<label>Server Name</label>
<input type="text" class="form-control" name="hostname" placeholder="Unknown Server" />
<br />

<label>Server Host</label> &nbsp; (&nbsp;IP, DNS, or SRV record.&nbsp;)
<input type="text" class="form-control" name="serverhost" placeholder="0.0.0.0" />
<br />

<label>Server Port</label> &nbsp; (&nbsp;Not required if entered above or using an SRV record above.&nbsp;)
<input type="text" class="form-control" name="serverport" placeholder="25565" />
<br />

<label>Query Port</label>
<input type="text" class="form-control" name="queryport" placeholder="25565" />
<br />

<h3>Display Options</h3>

<div class="checkbox">
    <label>
        <input type="checkbox" name="shownamemotd"></input>
        Show name and MOTD? &nbsp; (&nbsp;e.g.&nbsp;"&nbsp;Server Name ~MOTD~&nbsp;"&nbsp;)
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showname" checked></input>
        Use MOTD instead of Server Name when available?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="parseformatcodes" checked></input>
        Parse format codes in Server Name and MOTD?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showplayercount" checked></input>
        Show (online/max) players?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showportdomain"></input>
        Show port after DNS address? &nbsp; (&nbsp;e.g. "someserver.com:25565"&nbsp;)
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showip"></input>
        Show IP after DNS address or SRV record? &nbsp; (&nbsp;e.g. "someserver.com (1.2.3.4)"&nbsp;)
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showportip" checked></input>
        Show port after IP address? &nbsp; (&nbsp;e.g. "(&nbsp;1.2.3.4:25565&nbsp;)"&nbsp;)
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="uselocalhost"></input>
        Use localhost for query? &nbsp; (&nbsp;Will still ping host address for online status, but pulls query data locally.&nbsp;)
    </label>
</div>
