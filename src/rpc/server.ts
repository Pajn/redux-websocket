import {clientError, nameSymbol, RpcContext} from './index'
import {ServerProtocol} from '../common'
import {WebSocketServer} from '../server'
export {clientError}

export type RpcServerSettings = {
  /**
   * Optional id to use when handling multiple RPC servers on a single WebSocketServer.
   * The same id must be specified on the client.
   */
  id?: string|number
  socket: WebSocketServer
  rpcObjects: Object[]
  logger?: {
    info(message?: any, ...optionalParams: any[]): void
    warn(message?: any, ...optionalParams: any[]): void
  }
}

export function createRpcServer({socket, id, rpcObjects, logger}: RpcServerSettings) {
  const procedures = {}
  const rpcId = `rpc${id || ''}`

  const webSocketProtocol: ServerProtocol = {
    async onmessage({id, className, methodName, args}, respond, connectionId): Promise<void> {
      const object = procedures[className]
      if (!object) return respond({id, error: 'no such class'})
      const procedure = object[methodName]
      if (!procedure) return respond({id, error: 'no such method'})

      try {
        const context: RpcContext = {connectionId}
        const value = await procedure.apply(context, args)
        respond({id, value})
      } catch (error) {
        if (logger) {
          logger.warn(`${rpcId}: ${className}.${methodName}:`, error, error && error.stack)
        }
        error = (error && error.clientError) || 'Unkown Error'
        respond({id, error})
      }
    },
  }

  socket.registerProtocol(rpcId, webSocketProtocol)

  rpcObjects.forEach(rpcObject => {
    const constructor = rpcObject.constructor
    const className = constructor[nameSymbol] || constructor.name

    if (logger) {
      logger.info(`${rpcId}: register [${className}]`)
    }

    procedures[className] = rpcObject
  })
}
