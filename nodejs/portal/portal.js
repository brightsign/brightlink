const version = '1.0.7'
var dns = require('dns')
const httpProxy = require('http-proxy')
const proxy = httpProxy.createProxyServer({})
const dnsd = require('dnsd')
const os = require('os')
const fs = require('fs')
const selectedProtocol = PROTOCOL //webpack variable
const rDNS = RDNS //webpack variable

var bsSocketMessage = new BSDatagramSocket()
bsSocketMessage.BindLocalPort(5900)

var redirectHostname = 'brightsign.biz'
var redirectUrl = `${selectedProtocol}://` + redirectHostname.toLowerCase()

var serverStarted = false

console.log(`index.js version: ${version}`)

bsSocketMessage.ondatagram = function (e) {
  var bytes = e.getBytes()
  var byteArray = new Int8Array(bytes)
  var udpMessage = String.fromCharCode.apply(null, byteArray)
  console.log(`udpMessage: ${udpMessage}`)

  var msg = udpMessage.split('!!')
  if (msg[0] === 'hostname') {
    redirectHostname = msg[1].toLowerCase()
    redirectUrl = `${selectedProtocol}://` + redirectHostname.toLowerCase()
    serverStarted = true
    console.log(`redirectUrl: ${redirectUrl}`)
    startServer()
  }
}

setTimeout(function () {
  if (!serverStarted) {
    startServer()
    serverStarted = true
    console.log(
      `Failed to receive udp with custom hostname. Starting http server with hostname ${redirectUrl}`
    )
  }
}, 20000)

function startServer () {
  if (selectedProtocol === 'https') {
    const https = require('https')
    let options = {
      key: fs.readFileSync('/storage/sd/node/private.key'),
      cert: fs.readFileSync('/storage/sd/node/certificate.crt')
    }
    https.createServer(options, serverHandler).listen(443, () => {
      console.log('Waiting for requests...')
    })
  } else {
    const http = require('http')
    http.createServer(serverHandler).listen(88, () => {
      console.log('Waiting for requests...')
    })
  }
}

function serverHandler (req, res) {
  console.log('requested: ' + req.headers.host + req.url)
  var routes = req.url.split('/')
  console.log(routes[1])
  if (
    routes[1] === 'admin' || // secure
    routes[1] === 'submit' || // secure
    routes[1] === 'update' || // secure
    routes[1] === 'updatepassword' || // secure
    routes[1].includes('deletefile') || // secure
    routes[1] === 'allUploads' ||
    routes[1] === 'resetdwspassword' ||
    routes[1] === 'forgotpassword' ||
    routes[1] === 'ispasswordreset' ||
    routes[1] === 'static' ||
    routes[1] === 'uploads'
  ) {
    // proxy to, /upload
    console.log(req.url)
    proxy.web(req, res, { target: 'http://localhost:3200' })
  } else {
    // jan changed 8080 to 8008
    proxy.web(req, res, { target: 'http://localhost:8008' })

    if (routes[1] === 'SetValues') {
      setTimeout(function () {
        console.log('Sending UDP for reboot')
        bsSocketMessage.SendTo('127.0.0.1', 5901, 'httpserver!!reboot')
      }, 2000)
    }
  }
}

var dnsServer
if (rDNS === 'false' || rDNS === false) {
  console.log('not rec DNS')
  dnsServer = dnsd.createServer(dnshandler)
} else {
  console.log('rec DNS')
  dnsServer = dnsd.createServer(recursivednshandler)
}
dnsServer
  .zone(
    'example.com',
    'ns1.example.com',
    'us@example.com',
    'now',
    '2h',
    '30m',
    '2w',
    '10m'
  )
  .listen(53, '0.0.0.0')
console.log('DNS Server running at 0.0.0.0:53')

//recursive DNS handler
function recursivednshandler (req, res) {
  var question = res.question[0],
    hostname = question.name,
    ttl = Math.floor(Math.random() * 3600),
    type = question.type
  if (question.type === 'A') {
    if (
      hostname === redirectHostname ||
      hostname.indexOf(redirectHostname) !== -1
    ) {
      res.answer.push({
        name: hostname,
        type: question.type,
        data: os.networkInterfaces().wlan0[0].address,
        ttl: ttl
      })
      res.end()
    } else {
      dns.lookup(hostname, function (e, a) {
        if (e) {
          res.end()
        } else if (a) {
          res.answer.push({
            name: hostname,
            type: question.type,
            data: a,
            ttl: ttl
          })
          res.end()
        }
      })
    }
  }else{
    res.end();
  }
}

//DNS handler
function dnshandler (req, res) {
  var question = res.question[0],
    hostname = question.name,
    ttl = Math.floor(Math.random() * 3600),
    type = question.type
  console.log('handle dns----', hostname)
  if (question.type === 'A') {
    res.answer.push({
      name: hostname,
      type: 'A',
      data: os.networkInterfaces().wlan0[0].address,
      ttl: ttl
    })
    res.end()
  } else {
    res.end()
  }
}
