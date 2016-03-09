import {nameSymbol, timeoutSymbol} from './index'
import {WebSocketClient} from '../client'
import {ClientProtocol} from '../common'

export type RpcClientSettings = {
  /**
   * Optional id to use for connecting to an RPC server with a non-empty id
   */
  id?: string|number
  socket: WebSocketClient
  rpcObjects: Object[]
}

export function createRpcClient({socket, id, rpcObjects}: RpcClientSettings) {
  let nextCallId = 0

  const waitingCalls = {}
  const webSocketProtocol: ClientProtocol = {
    onmessage({id, error, value}) {
      const call = waitingCalls[id]
      if (call) {
        call(error, value)
      }
    },
  }

  socket.registerProtocol(`rpc${id || ''}`, webSocketProtocol)

  rpcObjects.forEach(rpcObject => {
    const constructor = rpcObject.constructor
    const className = constructor[nameSymbol] || constructor.name
    const timeout = constructor[timeoutSymbol] === undefined ? 10000 : constructor[timeoutSymbol]
    const methods = Object.getOwnPropertyNames(constructor.prototype)
      .filter(key => key !== 'constructor')
      .filter(key => typeof constructor.prototype[key] === 'function')

    methods.forEach(methodName => {
      rpcObject[methodName] = (...args) => {
        const callId = nextCallId++

        webSocketProtocol.send({
          id: callId,
          className,
          methodName,
          args,
        })

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            delete waitingCalls[callId]
            reject('timeout reached')
          }, timeout)

          waitingCalls[callId] = (error, value) => {
            clearTimeout(timeoutId)
            delete waitingCalls[callId]
            if (error) {
              reject(error)
            } else {
              resolve(value)
            }
          }
        })
      }
    })
  })
}
