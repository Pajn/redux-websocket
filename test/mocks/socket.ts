import {WebSocketClient} from 'redux-websocket/lib/client'
import {Protocol} from 'redux-websocket/lib/common'
import {WebSocketServer} from 'redux-websocket/lib/server'

export function createMockSocket(): any {
  return {
    protocols: {},

    registerProtocol(name: string, protocol: Protocol) {
      this.protocols[name] = protocol
    },
  }
}
