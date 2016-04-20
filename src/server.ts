import * as uuid from 'node-uuid'
import {updateIn} from 'redux-decorated'
import {server as WebSocket, connection} from 'websocket'
import {Action, Actions, ClientMode, ServerProtocol, WebSocketConnection} from './common'

export class WebSocketServer implements WebSocketConnection {
  readonly isServer = true
  readonly connections: {[connectionId: string]: connection} = {}
  protocols = {}

  constructor(server: WebSocket) {
    server.on('request', request => {
      const connection = request.accept('redux-websocket', request.origin)
      const connectionId = uuid.v1()
      this.connections[connectionId] = connection

      Object.keys(this.protocols).forEach(protocolName => {
        const protocol = this.protocols[protocolName]
        if (protocol.onconnection) {
          protocol.onconnection(connectionId)
        }
      })

      connection.on('message', message => {
        try {
          if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data)

            const protocol = this.protocols[data.type]
            if (protocol) {
              protocol.onmessage(
                data.data,
                message => connection.send(JSON.stringify({type: data.type, data: message})),
                connectionId
              )
            }
          }
        } catch (e) {
          connection.send(JSON.stringify({error: e && e.message}))
        }
      })

      connection.on('close', () => {
        delete this.connections[connectionId]

        Object.keys(this.protocols).forEach(protocolName => {
          const protocol = this.protocols[protocolName]
          if (protocol.onclose) {
            protocol.onclose(connectionId)
          }
        })
      })
    })
  }

  registerProtocol(name: string, protocol: ServerProtocol) {
    protocol.send = (message, predicate) => {
      Object.keys(this.connections).forEach(connectionId => {
        if (!predicate || predicate(connectionId)) {
          this.connections[connectionId].send(JSON.stringify({type: name, data: message}))
        }
      })
    }
    protocol.sendTo = (connectionId, message, predicate) => {
      if (!predicate || predicate(connectionId)) {
        this.connections[connectionId].send(JSON.stringify({type: name, data: message}))
      }
    }
    this.protocols[name] = protocol
  }
}

type Settings = {
  actions: Actions
  socket: WebSocketServer
  connections?: {[connectionId: string]: any}
  id?: string
}

export const websocketMiddleware = ({socket, actions, connections = {}, id}: Settings) =>
  store => next => {

  const protocol: ServerProtocol = {
    onconnection(connectionId) {
      connections[connectionId] = true
    },

    onclose(connectionId) {
      delete connections[connectionId]
    },

    onmessage({action}, _, connectionId) {
      if (actions[action.type]) {
        const {meta} = actions[action.type]
        if (meta && meta.toServer) {
          const {toServer} = meta
          if (typeof toServer !== 'function' || toServer(action, connectionId)) {
            next(action)
          }
        }
      }
    },
  }

  socket.registerProtocol(`action-${id}`, protocol)

  return (action: Action) => {
    const meta = action.meta || (actions[action.type] && actions[action.type].meta)
    if (meta && meta.toClient) {
      const {toClient, toClientMode} = meta
      if (toClientMode === ClientMode.sameStore) {
        Object.keys(connections).forEach(connectionId => {
          protocol.sendTo(
            connectionId,
            {action: updateIn(['meta', 'fromServer'], true, action)},
            typeof toClient === 'function' && toClient.bind(null, action)
          )
        })
      } else if (toClientMode === ClientMode.broadcast) {
        protocol.send(
          {action: updateIn(['meta', 'fromServer'], true, action)},
          typeof toClient === 'function' && toClient.bind(null, action)
        )
      } else {
        throw Error('toClientMode must be set when toClient is set')
      }
    }
    return next(action)
  }
}
