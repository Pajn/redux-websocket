declare module 'websocket-redux/lib/common' {
  export interface Protocol {
    onmessage: (message: any) => void;
    send?: (message: Object) => void;
  }
}

declare module 'websocket-redux/lib/client' {
  export interface Protocol {
    onmessage: (message: any) => void;
    send?: (message: Object) => void;
  }

  export class WebSocketClient {
    protocols: {};
    socket: WebSocket;
    constructor(url: any);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware(client: WebSocketClient):
      (store: any) => (next: any) => (action: any) => any;
}

declare module 'websocket-redux/lib/server' {
  // import {Server as HttpServer} from 'http';

  export interface Protocol {
    onmessage: (message: any) => void;
    send?: (message: Object) => void;
  }
  export class WebSocketServer {
    constructor(httpServer);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware({server, actions}: {
    server: WebSocketServer;
    actions: any;
  }): (store: any) => (next: any) => (action: any) => any;
}

declare module 'websocket-redux/lib/rpc/common' {
  export type RpcSettings = {
    name?: string;
    timeout?: number;
  };
  export function clientError(message: string);
}

declare module 'websocket-redux/lib/rpc/client' {
  import {WebSocketClient} from 'websocket-redux/lib/client';
  import {clientError, RpcSettings} from 'websocket-redux/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useWebSocketClient(client: WebSocketClient): void;
}

declare module 'websocket-redux/lib/rpc/server' {
  import {WebSocketServer} from 'websocket-redux/lib/server';
  import {clientError, RpcSettings} from 'websocket-redux/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useWebSocketServer(server: WebSocketServer): void;
}

declare module 'websocket-redux/lib/rpc' {
  import {clientError, RpcSettings} from 'websocket-redux/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useClient(): void;
  export function useServer(): void;
}
