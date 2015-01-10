<div class="console">
    <div class="well">
        <form class="form">
            <div class="row">
                <fieldset>
                    <h4 style="margin-top:0;">Server Information</h4>
                    <div class="col-sm-12 col-xs-12">
                        <div class="form-group">
                            <label>Server Name</label>
                            <input type="text" class="form-control" name="serverName" placeholder="Minecraft Server" />
                        </div>
                    </div>
                    <div class="col-sm-6 col-xs-12">
                        <div class="form-group">
                            <label>Server Host</label> &nbsp; (&nbsp;IP, DNS, or SRV record.&nbsp;)
                            <input type="text" class="form-control" name="serverHost" placeholder="0.0.0.0" />
                        </div>
                    </div>
                    <div class="col-sm-6 col-xs-12">
                        <div class="form-group">
                            <label>Server Port</label> &nbsp; (&nbsp;Not required if entered above or using an SRV record above.&nbsp;)
                            <input type="text" class="form-control" name="serverPort" placeholder="25565" />
                        </div>
                    </div>

<label>Query Port</label>
<input type="text" class="form-control" name="queryPort" placeholder="25565" />
<br />

<h4>Display Options</h4>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showNameAlways"></input>
        Always show server name?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showName" checked></input>
        Use MOTD instead of Server Name when available?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="parseFormatCodes" checked></input>
        Parse format codes in Server Name and MOTD?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showPlayerCount" checked></input>
        Show (online/max) players?
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="showIP"></input>
        Show IP after Host? &nbsp; (&nbsp;e.g. "someserver.com (1.2.3.4)"&nbsp;)
    </label>
</div>

<div class="checkbox">
    <label>
        <input type="checkbox" name="uselocalhost"></input>
        Use localhost for query? &nbsp; (&nbsp;Will still ping host address for online status, but pulls query data locally.&nbsp;)
    </label>
</div>

<br />

<h4>Style Options</h4>

                    <div class="col-sm-4 col-xs-12">
                        <div class="form-group">
                            <label>Color Server Name</label>
                            <input id="colorSelector" class="form-control category_color" name="colorServerName" data-name="color" />
                        </div>
                    </div>
                    <div class="col-sm-4 col-xs-12">
                        <div class="form-group">
                            <label>Color Labels</label>
                            <input id="colorLabels" class="form-control category_color" name="colorLabels" data-name="color" />
                        </div>
                    </div>
                    <div class="col-sm-4 col-xs-12">
                        <div class="form-group">
                            <label>Color Text</label>
                            <input type="colorText" class="form-control category_color" name="colorText" data-name="color" />
                        </div>
                    </div>

<h4>Custom Rows</h4>

<div class="form-inline">
    <div class="checkbox">
    <label>
        Enable
        <input type="checkbox" name="usecustom1"></input>
    </label>
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom1orderafter">Order after</label>
        <input type="text" class="col-lg-1 form-control" id="custom1orderafter" name="custom1orderafter" placeholder="Order After" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom1label">Label</label>
        <input type="text" class="col-lg-3 form-control" id="custom1label" name="custom1label" placeholder="Label" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom1text">Text</label>
        <input type="text" class="col-lg-3 form-control" id="custom1text" name="custom1text" placeholder="Text" />
    </div>
</div>

<div class="form-inline">
    <div class="checkbox">
    <label>
        Enable
        <input type="checkbox" name="usecustom2"></input>
    </label>
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom2orderafter">Order after</label>
        <input type="text" class="col-lg-1 form-control" id="custom2orderafter" name="custom2orderafter" placeholder="Order After" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom2label">Label</label>
        <input type="text" class="col-lg-3 form-control" id="custom2label" name="custom2label" placeholder="Label" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom2text">Text</label>
        <input type="text" class="col-lg-3 form-control" id="custom2text" name="custom2text" placeholder="Text" />
    </div>
</div>

<div class="form-inline">
    <div class="checkbox">
    <label>
        Enable
        <input type="checkbox" name="usecustom3"></input>
    </label>
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom3orderafter">Order after</label>
        <input type="text" class="col-lg-1 form-control" id="custom3orderafter" name="custom3orderafter" placeholder="Order After" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom3label">Label</label>
        <input type="text" class="col-lg-3 form-control" id="custom3label" name="custom3label" placeholder="Label" />
    </div>
    <div class="form-group">
        <label class="sr-only" for="custom3text">Text</label>
        <input type="text" class="col-lg-3 form-control" id="custom3text" name="custom3text" placeholder="Text" />
    </div>
</div>
                </fieldset>
            </div>
        </form>
    </div>
</div>