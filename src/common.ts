export interface Protocol {
  onopen?: () => void
  onmessage: (message: any, respond: (message: Object) => void) => void
  send?: (message: Object) => void
}

export interface WebSocketConnection {
  isServer: boolean
  registerProtocol(name: string, protocol: Protocol): void
}

export interface Actions {
  [type: string]: Action
}

export interface Action {
  type: string
  meta?: {
    toServer?: boolean
    toClient?: boolean
  }
}
