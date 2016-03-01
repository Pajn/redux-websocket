import {clientError, RemoteProceduresDecorator, RpcSettings} from './index'
import {Protocol} from '../common'
import {WebSocketServer} from '../server'
export {clientError}

type RpcServerSettings = {
  /**
   * Optional id to use when handling multiple RPC servers on a single WebSocketServer.
   * The same id must be specified on the client.
   */
  id?: string|number
  socket: WebSocketServer
  logger?: {
    info(message?: any, ...optionalParams: any[]): void
    warn(message?: any, ...optionalParams: any[]): void
  }
}

type RpcServer = {
  remoteProcedures: RemoteProceduresDecorator,
}

export function createRpcServer({socket, id, logger}: RpcServerSettings): RpcServer {
  const procedures = {}

  const webSocketProtocol: Protocol = {
    async onmessage({id, className, methodName, args}, respond): Promise<void> {
      const object = procedures[className]
      if (!object) return respond({id, error: 'no such class'})
      const procedure = object[methodName]
      if (!procedure) return respond({id, error: 'no such method'})

      try {
        const value = await procedure.apply(null, args)
        respond({id, value})
      } catch (error) {
        if (logger) {
          logger.warn(`rpc${id || ''}: ${className}.${methodName}:`, error, error && error.stack)
        }
        error = (error && error.clientError) || 'Unkown Error'
        respond({id, error})
      }
    },
  }

  socket.registerProtocol(`rpc${id || ''}`, webSocketProtocol)

  function remoteProcedures({name}: RpcSettings = {}): ClassDecorator {
    return target => {
      const className = name || target.name
      if (logger) {
        logger.info(`rpc${id || ''}: register [${className}]`)
      }
      const object = new target()

      procedures[className] = object
    }
  }

  return {remoteProcedures}
}
