import {clientError, RemoteProceduresDecorator, RpcSettings} from './index';
import {Protocol} from '../common';
import {WebSocketServer} from '../server';
export {clientError};

type RpcServerSettings = {
  /**
   * Optional id to use when handling multiple RPC servers on a single WebSocketServer.
   * The same id must be specified on the client.
   */
  id?: string|number,
  socket: WebSocketServer,
}

type RpcServer = {
  remoteProcedures: RemoteProceduresDecorator,
}

export function createRpcServer({socket, id}: RpcServerSettings): RpcServer {
  const procedures = {};

  const webSocketProtocol: Protocol = {
    async onmessage({id, className, methodName, args}, respond): Promise<void> {
      const object = procedures[className];
      if (!object) return console.log('no such class');
      const procedure = object[methodName];
      if (!procedure) return console.log('no such method');

      try {
        const value = await procedure.apply(null, args);
        this.send({id, value});
      } catch (error) {
        console.warn(error);
        if (error && error.stack) {
          console.warn(error.stack);
        }
        error = (error && error.clientError) || 'Unkown Error';
        respond({id, error});
      }
    }
  };

  socket.registerProtocol(`rpc${id || ''}`, webSocketProtocol);

  function remoteProcedures({name}: RpcSettings): ClassDecorator {
    return target => {
      const className = name || target.name;
      console.log('register [' + className + ']');
      const object = new target();

      procedures[className] = object;
    };
  }

  return {remoteProcedures};
}
