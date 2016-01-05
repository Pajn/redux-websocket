import {clientError, RpcSettings} from './common';
import {Protocol, WebSocketServer} from '../server';
export {clientError};

const procedures = {};
const webSocketProtocol: Protocol = {
  async onmessage({id, className, methodName, args}): Promise<void> {
    const object = procedures[className];
    if (!object) return console.log('no such class');
    const procedure = object[methodName];
    if (!procedure) return console.log('no such method');
    try {
      const value = await procedure.apply(null, args);
      console.log({id, value});
      this.send({id, value});
    } catch (error) {
      console.warn(error);
      if (error && error.stack) {
        console.warn(error.stack);
      }
      error = (error && error.clientError) || 'Unkown Error';
      console.log({id, error});
      this.send({id, error});
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
