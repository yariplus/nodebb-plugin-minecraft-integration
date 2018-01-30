export function render (data, next) {
  data.showPlayerCount = data.showPlayerCount == 'on' ? true : false
  data.showAvatars = data.showAvatars == 'on' ? true : false
  data.showMOTD = data.showMOTD == 'on' ? true : false
  data.hidePluginList = data.hidePluginList == 'on' ? true : false
  data.showIP = data.showIP == 'on' ? true : false
  data.showModalMap = data.showModalMap == 'on' ? true : false
  data.pocket = data.pocket ? 'pocket' : ''

  data.showVersion = data.version ? true : false

  if (data.hidePluginList) data.pluginList = []

  data.mapshow = data.mapshow == 'on' ? true : false
  data.mapshowlarge = data.mapshowlarge == 'on' ? true : false

  data.uri = data.mapuri || `http://${data.address}:8123/`

  if (data.mapplugin === 'overviewer') {
    data.uri += `${data.mapx ? data.mapx : 0}/`
    data.uri += '64/'
    data.uri += `${data.mapz ? data.mapz : 0}/`
    data.uri += `${data.mapzoom ? data.mapzoom : -2}/`
    data.uri += '0/0/'
  } else {
    data.uri += '?nopanel=true&hidechat=true&nogui=true'
    data.uri += (data.mapx ? `&x=${data.mapx}` : '')
    data.uri += (data.mapz ? `&z=${data.mapz}` : '')
    data.uri += (data.mapzoom ? `&zoom=${data.mapzoom}` : '')
  }

  data.modalID = `serverstatusmap${data.sid}`

  next(null, data)
}
