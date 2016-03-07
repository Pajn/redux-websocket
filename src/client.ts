import {Action, Actions, Protocol, WebSocketConnection} from './common'

export class WebSocketClient implements WebSocketConnection {
  readonly isServer = false
  protocols = {}
  socket: WebSocket
  open = false

  constructor({url, onOpen}: {url: string, onOpen: Function}) {
    this.connect(url, onOpen)
  }

  registerProtocol(name: string, protocol: Protocol) {
    protocol.send = message => this.socket.send(JSON.stringify({type: name, data: message}))

    this.protocols[name] = protocol

    if (this.open && protocol.onopen) {
      protocol.onopen()
    }
  }

  private connect(url, onOpen) {
    this.socket = new WebSocket(url, 'redux-websocket')

    this.socket.onopen = () => {
      this.open = true
      if (onOpen) {
        onOpen()
      }
      Object.keys(this.protocols).forEach(protocolName => {
        const protocol = this.protocols[protocolName]

        if (protocol.onopen) {
          protocol.onopen()
        }
      })
    }

    this.socket.onclose = () => {
      setTimeout(() => this.connect(url, onOpen), 1000)
    }

    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      const protocol = this.protocols[message.type]
      if (protocol) {
        protocol.onmessage(message.data)
      }
    }
  }
}

type Settings = {
  actions?: Actions
  socket: WebSocketClient
}

export const websocketMiddleware = ({socket, actions}: Settings) => store => next => {
  if (!actions) {
    actions = {}
  }

  const protocol: Protocol = {
    onmessage({action}) {
      next(action)
    },
  }

  socket.registerProtocol('action', protocol)

  return (action: Action) => {
    const meta = action.meta || (actions[action.type] && actions[action.type].meta)
    if (meta && meta.toServer) {
      protocol.send({action})
    }
    return next(action)
  }
}
