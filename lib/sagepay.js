
const https = require('https')
const qs = require('querystring')
const fields = require('./fields')
const testCards = require('./test-cards')
const assert = require('assert')

const mandatoryForRegister = [
  'VPSProtocol', 'TxType', 'Vendor', 'VendorTxCode', 'Amount', 'VPSProtocol',
  'Currency', 'Description', 'NotificationURL', 'BillingSurname',
  'BillingFirstnames', 'BillingAddress1', 'BillingCity', 'BillingPostCode',
  'BillingCountry', 'DeliverySurname', 'DeliveryFirstnames', 'DeliveryAddress1',
  'DelieveryCity', 'DelieveryPostCode', 'DelieveryCountry'
]

const mandatoryForFinish = [
  'Status', 'RedirectURL'
]

function registerTransaction (options) {
  let testing = false

  // Copy options (excluding additionals) into a data object.
  let data = {}
  for (let name in options) {
    if (name === 'testing') testing = true
    else data[name] = options[name]
  }

  if (!data.VPSProtocol) {
    data.VPSProtocol = '3.00'
  } else if (data.VPSProtocol !== '3.00') {
    return Promise.reject(new Error('VPSProtocol must be 3.00'))
  }

  const request = https.request({
    hostname: testing ? 'test.sagepay.com' : 'live.sagepay.com',
    path: '/gateway/service/vspserver-register.vsp',
    method: 'POST'
  })

  return new Promise((resolve, reject) => {
    for (let name of mandatoryForRegister) {
      assert(data[name], name + ' options is mandatory')
    }

    request.write(qs.stringify(data, '\r\n'))

    let bufs = []
    request.on('data', x => bufs.push(x))
    request.on('end', () => {
      if (!bufs) return
      let res = qs.parse(Buffer.concat(bufs).toString())
      switch (res.status) {
        case 'OK':
        case 'OK REPEATED':
          resolve(res); break
        case 'MALFORMED':
        case 'INVALID':
        case 'ERROR':
          reject(new Error('Sage Pay returned status ' + res.status)); break
        default:
          reject(new Error('Invalid status ' + res.status + ' from Sage Pay'))
      }
    })
    request.on('error', err => {
      reject(err)
      bufs = null
    })
  })
}

function transactionResults (request) {
  return new Promise((resolve, reject) => {
    let bufs = []
    request.on('data', x => bufs.push(x))
    request.on('end', () => {
      if (!bufs) return
      let res = qs.parse(Buffer.concat(bufs).toString())

      if (res.vpsprotocol !== '3.00') {
        return reject(new Error('Sage Pay gave VPSProtocol other than 3.00'))
      }

      switch (res.status) {
        case 'OK':
        case 'PENDING':
          resolve(res); break
        case 'NOTAUTH':
        case 'ABORT':
        case 'REJECTED':
        case 'ERROR':
          reject(new Error('Sage Pay returned status ' + res.status)); break
        case 'AUTHENTICATED':
        case 'REGISTERED': {
          if (res.txtype !== 'AUTHENTICATE') {
            reject(new Error('Recieved ' + res.status + ' but TxType was ' + res.txtype))
          } else {
            if (res.status[0] === 'A') resolve(res)
            else reject(new Error('3D-Secure checks failed but card details secured.'))
          }
          break
        }
        default:
          reject(new Error('Invalid status ' + res.status + ' from Sage Pay'))
      }
    })
    request.on('error', err => {
      reject(err)
      bufs = null
    })
  })
}

function finishTransaction (response, options) {
  new Promise((resolve, reject) => {
    for (let name of mandatoryForFinish) {
      assert(options[name], name + ' options is mandatory')
    }

    response.end(qs.stringify(options, '\r\n'), err => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}

module.exports = {
  registerTransaction,
  transactionResults,
  finishTransaction,
  testCards,
  fields
}
