export type RpcSettings = {
  name?: string;
  timeout?: number;
};

export function clientError(message: string) {
  return {
    name: 'clientError',
    message: message,
    clientError: message,
  };
}
