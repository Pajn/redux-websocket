import {RemoteProceduresDecorator, RpcSettings} from './index'
import {WebSocketClient} from '../client'
import {Protocol} from '../common'

type RpcClientSettings = {
  /**
   * Optional id to use for connecting to an RPC server with a non-empty id
   */
  id?: string|number
  socket: WebSocketClient
}

type RpcClient = {
  remoteProcedures: RemoteProceduresDecorator,
}

export function createRpcClient({socket, id}: RpcClientSettings): RpcClient {
  let nextCallId = 0

  const waitingCalls = {}
  const webSocketProtocol: Protocol = {
    onmessage({id, error, value}) {
      const call = waitingCalls[id]
      if (call) {
        call(error, value);
      }
    },
  }

  socket.registerProtocol(`rpc${id || ''}`, webSocketProtocol)

  function remoteProcedures({name, timeout}: RpcSettings = {}): ClassDecorator {
    timeout = timeout === undefined ? 10000 : timeout

    return target => {
      const className = name || target.name
      const methods = Object.getOwnPropertyNames(target.prototype)
        .filter(key => key !== 'constructor')
        .filter(key => typeof target.prototype[key] === 'function')

      function Class() {}

      methods.forEach(methodName => {
        Class.prototype[methodName] = (...args) => {
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

      return Class
    }
  }

  return {remoteProcedures}
}
