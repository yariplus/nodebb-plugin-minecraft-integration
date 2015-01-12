<div class="widget-server-status">
    <div class="well">
        <form class="form">
            <div class="row">
                <fieldset>
                    <h4 style="margin-top:0;">Server</h4>
                    <div class="col-sm-12 col-xs-12">
                        <div class="form-group">
                            <label>Server</label>
                            <select name="serverConfigName">
                                <option value="1">One</option>
                                <option value="2">Two</option>
                                <option value="3">Three</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="col-sm-12 col-md-12 col-xs-12">
                        <h4>Display Options</h4>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="showNameAlways"></input>
                                Always show server name?
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
                                <input type="checkbox" name="showDebugIcons"></input>
                                Show debug icons?
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="logDebug"></input>
                                Write everything to log?
                            </label>
                        </div>
                    </div>
                    
                    <div class="col-sm-12 col-xs-12">
                        <h4>Style Options</h4>
                    </div>
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
                    <div class="col-sm-12 col-xs-12">
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
                    </div>
                </fieldset>
            </div>
        </form>
    </div>
</div>