import * as Keen from 'keen-js'
const nconf = require.main.require('nconf')

;((Analytics => {
  const client = new Keen({
    projectId: '56c8ffa746f9a70da319e295',
    writeKey: '154c11d28bd60fc9f92b93c5188251bc6da74de119faa1d6c17c54e9c4639d7ea05691b08365b7cf3649eb2ba30cf2202a284734d6a35fe9d10553fcb85931140e1bcfbdc657e2fb9ad89adec8176c2354cc23c40dba881a9c18dfc85f42a3b1'
  })

  Keen.ready(() => {
    const startupEvent = {
      url: nconf.get('url'),
      keen: {
        timestamp: new Date().toISOString()
      }
    }

    client.addEvent('startupsi', startupEvent, (err, res) => {
      if (err) {
      } else {
      }
    })
  })
})(exports))
