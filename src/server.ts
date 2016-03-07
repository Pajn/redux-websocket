import {updateIn} from 'redux-decorated'
import {server as WebSocket, connection} from 'websocket'
import {Action, Actions, Protocol, WebSocketConnection} from './common'

export class WebSocketServer implements WebSocketConnection {
  readonly isServer = true
  readonly connections: Array<connection> = []
  protocols = {}

  constructor(server: WebSocket) {
    server.on('request', request => {
      const connection = request.accept('redux-websocket', request.origin)
      this.connections.push(connection)

      connection.on('message', message => {
        try {
          if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data)

            const protocol = this.protocols[data.type]
            if (protocol) {
              protocol.onmessage(
                data.data,
                message => connection.send(JSON.stringify({type: data.type, data: message}))
              )
            }
          }
        } catch (e) {
          connection.send(JSON.stringify({error: e && e.message}))
        }
      })

      connection.on('close', () => {
        this.connections.splice(this.connections.indexOf(connection), 1)
      })
    })
  }

  registerProtocol(name: string, protocol: Protocol) {
    protocol.send = (message) => {
      this.connections.forEach(connection => {
        connection.send(JSON.stringify({type: name, data: message}))
      })
    }
    this.protocols[name] = protocol
  }
}

type Settings = {
  actions: Actions,
  socket: WebSocketServer,
}

export const websocketMiddleware = ({socket, actions}: Settings) => store => next => {

  const protocol: Protocol = {
    onmessage({action}) {
      if (actions[action.type]) {
        const {meta} = actions[action.type]
        if (meta && meta.toServer) {
          next(action)
        }
      }
    },
  }

  socket.registerProtocol('action', protocol)

  return (action: Action) => {
    const meta = action.meta || (actions[action.type] && actions[action.type].meta)
    if (meta && meta.toClient) {
      protocol.send({action: updateIn(['meta', 'fromServer'], true, action)})
    }
    return next(action)
  }
}
