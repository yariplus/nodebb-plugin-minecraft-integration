<form id="minecraft-integration" autocomplete="off">
    <div class="row">
        <div class="col-lg-9">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <span class="panel-title">
                        Minecraft Integration
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
                    <h3>Active Servers</h3>
                    <div class="panel-group" id="serverList">
                    </div>
                    <button id="mia-add-server" type="button" class="btn btn-success"><i class="fa fa-plus fa-fw"></i> Add a New Server</button>
                    <button id="mia-view-servers" type="button" class="btn btn-warning"><i class="fa fa-cog fa-fw"></i> View All Servers</button>
                </div>
            </div>
        </div>
        <div class="col-lg-3">
            <div class="panel acp-panel-primary">
                <div class="panel-heading">
                    Actions
                </div>
                <div class="panel-body">
                    <div class="form-group">
                        <button type="button" class="btn btn-warning form-control" id="mia-reset">
                            <i class="fa fa-fw fa-history"></i> Reset All Fields
                        </button>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-danger form-control" id="mia-delete">
                            <i class="fa fa-fw fa-times"></i> Delete All Fields
                        </button>
                    </div>
                    <button type="button" class="btn btn-success form-control" id="mia-save">
                        <i class="fa fa-fw fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="mia-modal-servers">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Minecraft Servers</h4>
                </div>
                <div class="modal-body form-group form-horizontal">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
</form>
