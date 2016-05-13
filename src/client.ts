import {Action, Actions, ClientProtocol, WebSocketConnection} from './common'

export class WebSocketClient implements WebSocketConnection {
  readonly isServer = false
  protocols = {}
  socket: WebSocket
  open = false
  private messagesToSend = []
  private timeoutId

  constructor({url, onOpen}: {url: string, onOpen: Function}) {
    this.connect(url, onOpen)
  }

  registerProtocol(name: string, protocol: ClientProtocol) {
    protocol.send = message => this.send(JSON.stringify({type: name, data: message}))

    this.protocols[name] = protocol

    if (this.open && protocol.onopen) {
      protocol.onopen()
    }
  }

  send(message: string) {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(message)
    } else {
      if (this.timeoutId) clearTimeout(this.timeoutId)

      this.timeoutId = setTimeout(() => this.sendBuffered(), 500)
      this.messagesToSend.push(message)
    }
  }

  sendBuffered() {
    if (this.socket.readyState === this.socket.OPEN) {
      this.messagesToSend.forEach(message => this.socket.send(message))
      this.messagesToSend = []
    } else {
      if (this.timeoutId) clearTimeout(this.timeoutId)

      this.timeoutId = setTimeout(() => this.sendBuffered(), 500)
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
  id?: string
}

export const websocketMiddleware = ({socket, actions, id}: Settings) => store => next => {
  if (!actions) {
    actions = {}
  }

  const protocol: ClientProtocol = {
    onmessage({action}) {
      next(action)
    },
  }

  socket.registerProtocol(`action-${id}`, protocol)

  return (action: Action) => {
    const meta = action.meta || (actions[action.type] && actions[action.type].meta)
    if (meta && meta.toServer) {
      protocol.send({action})
    }
    return next(action)
  }
}
