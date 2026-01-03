import express from 'express'
import { createServer } from 'http'
import { toBuffer } from 'qrcode'
import fetch from 'node-fetch'

// Función principal que inicia el servidor web
function connect(conn, PORT = process.env.PORT || 3000) {
  const app = global.app = express()
  const server = global.server = createServer(app)

  let _qr = 'invalid'

  // Escuchar QR de Baileys
  conn.ev.on('connection.update', ({ qr }) => {
    if (qr) _qr = qr
  })

  // Ruta principal: Render / UptimeRobot
  app.get('/', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'image/png')
      res.end(await toBuffer(_qr))
    } catch (e) {
      res.status(500).send('QR no disponible')
    }
  })

  // Escuchar puerto (OBLIGATORIO PARA RENDER)
  server.listen(PORT, () => {
    console.log('Servidor web activo en el puerto', PORT)
  })
}

// Función para redirigir eventos (NO TOCAR)
function pipeEmit(event, event2, prefix = '') {
  const old = event.emit
  event.emit = function (eventName, ...args) {
    old.call(this, eventName, ...args)
    event2.emit(prefix + eventName, ...args)
  }
  return {
    unpipeEmit() {
      event.emit = old
    }
  }
}

// KeepAlive opcional (NO necesario en Render, pero no estorba)
function keepAlive() {
  if (!process.env.RENDER_EXTERNAL_URL) return
  setInterval(() => {
    fetch(process.env.RENDER_EXTERNAL_URL).catch(() => {})
  }, 5 * 60 * 1000)
}

export default connect
