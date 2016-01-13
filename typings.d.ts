declare module 'redux-websocket/lib/common' {
  export interface Protocol {
    onopen?: () => void;
    onmessage: (message: any, respond: (message: Object) => void) => void;
    send?: (message: Object) => void;
  }

  export interface WebSocketConnection {
    registerProtocol(name: string, protocol: Protocol): void;
  }
}

declare module 'redux-websocket/lib/client' {
  import {Protocol, WebSocketConnection} from 'redux-websocket/lib/common';

  export class WebSocketClient implements WebSocketConnection {
    protocols: {};
    socket: WebSocket;
    constructor(url: any);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware(client: WebSocketClient):
      (store: any) => (next: any) => (action: any) => any;
}

declare module 'redux-websocket/lib/server' {
  import {Protocol, WebSocketConnection} from 'redux-websocket/lib/common';

  export class WebSocketServer implements WebSocketConnection {
    constructor(httpServer);
    registerProtocol(name: string, protocol: Protocol): void;
  }
  export function websocketMiddleware({server, actions}: {
    server: WebSocketServer;
    actions: any;
  }): (store: any) => (next: any) => (action: any) => any;
}

declare module 'redux-websocket/lib/sync' {
  import {Protocol, WebSocketConnection} from 'redux-websocket/lib/common';

  type Settings = {
    connection: WebSocketConnection,
    whitelist: string[],
  };

  export function syncStoreEnhancer(settings: Settings): (next) => (reducer, initialState) => any;
}

declare module 'redux-websocket/lib/rpc/common' {
  export type RpcSettings = {
    name?: string;
    timeout?: number;
  };
  export function clientError(message: string);
}

declare module 'redux-websocket/lib/rpc/client' {
  import {WebSocketClient} from 'redux-websocket/lib/client';
  import {clientError, RpcSettings} from 'redux-websocket/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useWebSocketClient(client: WebSocketClient): void;
}

declare module 'redux-websocket/lib/rpc/server' {
  import {WebSocketServer} from 'redux-websocket/lib/server';
  import {clientError, RpcSettings} from 'redux-websocket/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useWebSocketServer(server: WebSocketServer): void;
}

declare module 'redux-websocket/lib/rpc' {
  import {clientError, RpcSettings} from 'redux-websocket/lib/rpc/common';
  export {clientError};

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator;
  export function useClient(): void;
  export function useServer(): void;
}
