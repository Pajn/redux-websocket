export type RpcSettings = {
  name?: string;
  timeout?: number;
};

export function clientError(message: string) {
  return {clientError: message};
}
