import {clientError, RpcSettings} from './common';
import {Protocol, WebSocketClient} from '../client';
export {clientError};

const getId = (() => {
  let id = 0;

  return () => id++;
})();

const waitingCalls = {};
const webSocketProtocol: Protocol = {
  onmessage({id, error, value}) {
    const call = waitingCalls[id];
    if (call) {
      call(error, value);
    }
  }
};

export function remoteProcedures({timeout}: RpcSettings = {timeout: 10000}): ClassDecorator {
  return target => {
    const className = target.name;
    const methods = Object.getOwnPropertyNames(target.prototype)
      .filter(key => key !== 'constructor')
      .filter(key => typeof target.prototype[key] === 'function');

    function Class() {
      // Empty
    }

    methods.forEach(methodName => {
      Class.prototype[methodName] = (...args) => {
        const id = getId();
        webSocketProtocol.send({
          id,
          className,
          methodName,
          args,
        });

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            delete waitingCalls[id];
            reject('timeout reached');
          }, timeout);

          waitingCalls[id] = (error, value) => {
            clearTimeout(timeoutId);
            if (error) {
              reject(error);
            } else {
              resolve(value);
            }
          };
        });
      };
    });

    return Class;
  };
}

export function useWebSocketClient(client: WebSocketClient) {
  client.registerProtocol('rpc', webSocketProtocol);
}
