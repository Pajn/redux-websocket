import {Server as HttpServer} from 'http';
import {server as WebSocket, connection} from 'websocket';
import {Protocol} from './common';
export {Protocol};

export class WebSocketServer {
  connections: Array<connection> = [];
  protocols = {};

  constructor(httpServer: HttpServer) {
    const server = new WebSocket();

    server.mount({httpServer});

    server.on('request', (request) => {
      const connection = request.accept('redux', request.origin);
      this.connections.push(connection);
      console.log('connection');

      connection.on('message', (message) => {
        console.log('message');
        try {
          if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data);
            console.log(data);

            const protocol = this.protocols[data.type];
            if (protocol) {
              protocol.onmessage(data.data);
            }
          }
        } catch (e) {
          console.log({error: e && e.message});
          connection.send(JSON.stringify({error: e && e.message}));
        }
      });

      connection.on('close', () => {
        this.connections.splice(this.connections.indexOf(connection));
      });
    });
  }

  registerProtocol(name: string, protocol: Protocol) {
    protocol.send = (message) => {
      this.connections.forEach(connection => {
        connection.send(JSON.stringify({type: name, data: message}));
      });
    };
    this.protocols[name] = protocol;
  }
}

type Settings = {
  server: WebSocketServer,
  actions: any,
};

export const websocketMiddleware = ({server, actions}: Settings) => store => next => {

  const protocol: Protocol = {
    onmessage({action}) {
      if (action.meta && action.meta.toServer) {
        next(action);
      }
    }
  };

  server.registerProtocol('action', protocol);

  return action => {
    console.log(action);
    const {meta} = actions[action.type];
    if (meta.toClient) {
      protocol.send({action});
      console.log('send');
    }
    return next(action);
  };
};
