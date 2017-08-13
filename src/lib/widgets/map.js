export function render (data, callback) {
  let {
    sid,
    address,
    mapshowlarge,
    mapuri,
    mapplugin,
    mapx,
    mapz,
    mapzoom,
  } = data

  mapshowlarge = mapshowlarge == 'on' ? true : false

  mapuri = mapuri || `http://${address}:8123/`
  mapuri = mapuri.slice(-1) === '/' ? mapuri : `${mapuri}/`

  if (mapplugin === 'overviewer') {
    mapuri += `${mapx ? mapx : 0}/`
    mapuri += '64/'
    mapuri += `${mapz ? mapz : 0}/`
    mapuri += `${mapzoom ? mapzoom : -2}/`
    mapuri += '0/0/'
  } else {
    mapuri += '?nopanel=true&hidechat=true&nogui=true'
    mapuri += (mapx ? `&x=${mapx}` : '')
    mapuri += (mapz ? `&z=${mapz}` : '')
    mapuri += (mapzoom ? `&zoom=${mapzoom}` : '')
  }

  let modalID = `serverstatusmap${sid}`

  callback(null, {
    sid,
    address,
    mapshowlarge,
    mapuri,
    mapplugin,
    mapx,
    mapz,
    mapzoom,
    modalID,
  })
}
