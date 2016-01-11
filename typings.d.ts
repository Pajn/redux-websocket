declare module 'websocket-redux/lib/common' {
  export interface Protocol {
    onopen?: () => void;
    onmessage: (message: any, respond: (message: Object) => void) => void;
    send?: (message: Object) => void;
  }

  export interface WebSocketConnection {
    registerProtocol(name: string, protocol: Protocol): void;
  }
}

declare module 'websocket-redux/lib/client' {
  import {Protocol, WebSocketConnection} from 'websocket-redux/lib/common';

  export class WebSocketClient implements WebSocketConnection {
    protocols: {};
    socket: WebSocket;
    constructor(url: any);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware(client: WebSocketClient):
      (store: any) => (next: any) => (action: any) => any;
}

declare module 'websocket-redux/lib/server' {
  import {Protocol, WebSocketConnection} from 'websocket-redux/lib/common';

  export class WebSocketServer implements WebSocketConnection {
    constructor(httpServer);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware({server, actions}: {
    server: WebSocketServer;
    actions: any;
  }): (store: any) => (next: any) => (action: any) => any;
}

declare module 'websocket-redux/lib/sync' {
  import {Protocol, WebSocketConnection} from 'websocket-redux/lib/common';

  type Settings = {
    connection: WebSocketConnection,
    whitelist: string[],
  };

  export function syncStoreEnhancer(settings: Settings): (next) => (reducer, initialState) => any;
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
