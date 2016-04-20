declare module 'redux-websocket/lib/common' {
  export interface Protocol {
    onopen?: () => void
    send?: (message: Object) => void
  }

  export interface ClientProtocol extends Protocol {
    onopen?: () => void
    onmessage: (
      message: any,
      respond: (message: Object) => void
    ) => void
  }

  export interface ServerProtocol extends Protocol {
    onconnection?: (connectionId: string) => void
    onclose?: (connectionId: string) => void
    onmessage: (
      message: any,
      respond: (message: Object) => void,
      connectionId: string
    ) => void

    send?: (message: Object, predicate?: (connectionId: string) => boolean) => void
    sendTo?: (
      connectionId: string,
      message: Object,
      predicate?: (connectionId: string) => boolean
    ) => void
  }

  export interface WebSocketConnection {
    isServer: boolean
    registerProtocol(name: string, protocol: Protocol): void
  }

  export interface Actions {
    [type: string]: Action
  }

  export enum ClientMode {
    broadcast,
    sameStore,
  }

  export interface Action {
    type?: string
    meta?: {
      toServer?: boolean|((action, connectionId: string) => boolean)
      toClient?: boolean|((action, connectionId: string) => boolean)
      toClientMode?: ClientMode
    }
  }
}

declare module 'redux-websocket/lib/client' {
  import {Actions, ClientProtocol, WebSocketConnection} from 'redux-websocket/lib/common'

  export class WebSocketClient implements WebSocketConnection {
    isServer: boolean
    protocols: {}
    private socket: WebSocket
    constructor(url: any)
    registerProtocol(name: string, protocol: ClientProtocol): void
  }

  export function websocketMiddleware(settings: {
    actions?: Actions
    socket: WebSocketClient
    /**
     * Optional id to use for connecting to an redux websocket server with a non-empty id
     */
    id?: string,
  }): (store: any) => (next: any) => (action: any) => any
}

declare module 'redux-websocket/lib/server' {
  import {Actions, ServerProtocol, WebSocketConnection} from 'redux-websocket/lib/common'
  import {server as WebSocket} from 'websocket'

  export class WebSocketServer implements WebSocketConnection {
    isServer: boolean
    constructor(webSocket: WebSocket)
    registerProtocol(name: string, protocol: ServerProtocol): void
  }

  export function websocketMiddleware(settings: {
    actions: Actions
    socket: WebSocketServer
    /**
     * Optional id to use when handling multiple redux websocket servers on a single
     * WebSocketServer.
     * The same id must be specified on the client.
     */
    id?: string
    /**
     * Optinally pass in existing connections when created
     */
    connections?: {[connectionId: string]: any}
  }): (store: any) => (next: any) => (action: any) => any
}

declare module 'redux-websocket/lib/sync' {
  import {WebSocketConnection} from 'redux-websocket/lib/common'

  type Settings = {
    socket: WebSocketConnection
    keys: string[]
    skipVersion?: string[]
    waitForAction?: string
  }

  export function syncStoreEnhancer(settings: Settings): (next) => (reducer, initialState) => any

  export function noopReducer(state)

  export function createSyncServer(settings: Settings): {
    createSyncMiddleware(): {
      addConnection(connectionId: string)
      syncMiddleware(store): (next) => (action) => void
    }
  }
}

declare module 'redux-websocket/lib/rpc' {
  export type RpcSettings = {
    /**
     * Name for the RPC namespace, if not specified the classname will be used.
     */
    name?: string
    /**
     * Timeout in ms for how long the client will wait for a response before rejecting.
     * Defaults to 10000.
     */
    timeout?: number
  }

  export type RpcContext = {
    connectionId: string
  }

  export const nameSymbol: symbol
  export const timeoutSymbol: symbol

  export function clientError(message: string)

  export function remoteProcedures(settings?: RpcSettings): ClassDecorator
}

declare module 'redux-websocket/lib/rpc/client' {
  import {WebSocketClient} from 'redux-websocket/lib/client'
  import {clientError, RpcSettings} from 'redux-websocket/lib/rpc'
  export {clientError}

  type RpcClientSettings = {
    /**
     * Optional id to use for connecting to an RPC server with a non-empty id
     */
    id?: string|number
    socket: WebSocketClient
    rpcObjects: Object[]
  }

  export function createRpcClient(setting: RpcClientSettings): void
}

declare module 'redux-websocket/lib/rpc/server' {
  import {WebSocketServer} from 'redux-websocket/lib/server'
  import {clientError, RpcSettings} from 'redux-websocket/lib/rpc'
  export {clientError}

  type RpcServerSettings = {
    /**
     * Optional id to use when handling multiple RPC servers on a single WebSocketServer.
     * The same id must be specified on the client.
     */
    id?: string|number
    socket: WebSocketServer
    rpcObjects: Object[]
    logger?: {
      info(message?: any, ...optionalParams: any[]): void
      warn(message?: any, ...optionalParams: any[]): void
    }
  }

  export function createRpcServer(setting: RpcServerSettings): void
}
