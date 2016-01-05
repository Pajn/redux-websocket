import {RpcSettings} from './common';

export let remoteProcedures: (settings: RpcSettings) => ClassDecorator = () => null;

export function useClient() {
  remoteProcedures = require('./client').remoteProcedures;
}

export function useServer() {
  remoteProcedures = require('./server').remoteProcedures;
}
