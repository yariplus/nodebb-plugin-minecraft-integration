<form id="minecraft-integration">
    <div class="row">
        <div class="col-lg-9">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <span class="panel-title">
                        Minecraft Integration — Server Configuration
                    </span>
                </div>
                <div class="panel-body">
                    <h3>General Settings</h3>
                    <div class="row input-row">
                        <div class="col-sm-7 col-xs-12 input-field">
                            <label for="Primary Avatar CDN">Primary Avatar CDN</label>
                            <select id="avatarCDN" class="form-control">
                                <!--<option value="mojang">Mojang</option>-->
                                <option value="cravatar" selected="selected">Cravatar.eu</option>
                                <option value="minotar">Minotar</option>
                                <option value="signaturecraft">Signaturecraft</option>
                            </select>
                        </div>
                        <div class="col-sm-5 help-text" data-help=""></div>
                    </div>
                    <div class="row input-row">
                        <div class="col-sm-7 col-xs-12 input-field">
                            <label for="admin:username">Avatar Size (Pixels)</label>
                            <input id="avatarSize" type="number" class="form-control" placeholder="40" />
                        </div>
                        <div class="col-sm-5 help-text" data-help=""></div>
                    </div>
                    <div class="row input-row">
                        <div class="col-sm-7 col-xs-12 input-field">
                            <label for="admin:username">Avatar Style</label>
                            <select id="avatarStyle" class="form-control">
                                <option value="flat" selected="selected">Flat</option>
                            </select>
                        </div>
                        <div class="col-sm-5 help-text" data-help=""></div>
                    </div>
                    <hr>
                    <h3>Servers</h3>
                    <div class="panel-group" id="serverList">
                    </div>
                    <button id="mia-add-server" type="button" class="btn btn-success">Add a Server</button>
                </div>
            </div>
        </div>
        <div class="col-lg-3">
            <div class="panel acp-panel-primary">
                <div class="panel-heading">
                    Action Panel
                </div>

                <div class="panel-body">
                    <div class="form-group">
                        <button type="button" class="btn btn-warning form-control" id="form-btn-reset-all">
                            <i class="fa fa-fw fa-history"></i> Reset All
                        </button>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-danger form-control" id="form-btn-delete-all">
                            <i class="fa fa-fw fa-times"></i> Delete All
                        </button>
                    </div>
                    <button type="button" class="btn btn-success form-control" id="save">
                        <i class="fa fa-fw fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
        </div>
    </div>
</form>
