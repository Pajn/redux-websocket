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

export const nameSymbol = Symbol('name')
export const timeoutSymbol = Symbol('timeout')

export function clientError(message: string) {
  return {
    name: 'clientError',
    message: message,
    clientError: message,
  }
}

export function remoteProcedures({name, timeout = 10000}: RpcSettings = {}): ClassDecorator {
  return target => {
    target[nameSymbol] = name
    target[timeoutSymbol] = timeout
  }
}
