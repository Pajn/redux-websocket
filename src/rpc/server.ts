import {clientError, RpcSettings} from './common';
import {Protocol} from '../common';
import {WebSocketServer} from '../server';
export {clientError};

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

export function remoteProcedures({name}: RpcSettings): ClassDecorator {
  return target => {
    const className = name || target.name;
    console.log('register [' + className + ']');
    const object = new target();

    procedures[className] = object;
  };
}

export function useWebSocketServer(server: WebSocketServer) {
  server.registerProtocol('rpc', webSocketProtocol);
}
