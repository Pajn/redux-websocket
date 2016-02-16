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

export function clientError(message: string) {
  return {
    name: 'clientError',
    message: message,
    clientError: message,
  }
}

export interface RemoteProceduresDecorator {
  (settings: RpcSettings): ClassDecorator
}
