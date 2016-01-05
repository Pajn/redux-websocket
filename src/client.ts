import {Protocol} from './common';
export {Protocol};

export class WebSocketClient {
  protocols = {};
  socket: WebSocket;

  constructor({url, onOpen}: {url: string, onOpen: Function}) {
    this.connect(url, onOpen);
  }

  registerProtocol(name: string, protocol: Protocol) {
    protocol.send = (message) => this.socket.send(JSON.stringify({type: name, data: message}));
    this.protocols[name] = protocol;
  }

  private connect(url, onOpen) {
    this.socket = new WebSocket(url, 'redux');

    this.socket.onopen = () => {
      if (onOpen) {
        onOpen();
      }
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(url, onOpen), 1000);
    };

    this.socket.onmessage = event => {
      const message = JSON.parse(event.data);
      const protocol = this.protocols[message.type];
      if (protocol) {
        protocol.onmessage(message.data);
      }
    };
  }
}

export const websocketMiddleware = (client: WebSocketClient) => store => next => {

  const protocol: Protocol = {
    onmessage({action}) {
      next(action);
    }
  };

  client.registerProtocol('action', protocol);

  return action => {
    if (action.meta && action.meta.toServer) {
      protocol.send({action});
    }
    return next(action);
  };
};
