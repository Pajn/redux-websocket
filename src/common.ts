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
  type: string
  meta?: {
    toServer?: boolean|((action, connectionId: string) => boolean)
    toClient?: boolean|((action, connectionId: string) => boolean)
    toClientMode?: ClientMode
  }
}
