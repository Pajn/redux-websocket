export interface Protocol {
  onopen?: () => void;
  onmessage: (message: any, respond: (message: Object) => void) => void;
  send?: (message: Object) => void;
}

export interface WebSocketConnection {
  registerProtocol(name: string, protocol: Protocol): void;
}

export interface Action<T> {
  type: string;
  payload: T;
  meta: {
    toServer: boolean;
    toClient: boolean;
  };
}
