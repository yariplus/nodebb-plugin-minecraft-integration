import Utils from '../utils'

export function render (data, callback) {
  data.services = []

  Utils.voteServices.forEach(serviceData => {
    if (data[`votelink-${serviceData.service}`]) {
      data.services.push({service: serviceData.service, name: serviceData.name, url: data[`votelink-${serviceData.service}`]})
    }
  })

  callback(null, data)
}
