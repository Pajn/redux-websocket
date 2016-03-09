import {ClientProtocol, ServerProtocol, WebSocketConnection} from '../common'

export const dispatchAction = 'dispatchAction'
export const checkVersion = 'checkVersion'

export type Settings = {
  socket: WebSocketConnection
  keys: string[]
  skipVersion?: string[]
  waitForAction?: string
}

export type InitialSyncPayload = {
  versions: {[key: string]: number}
  state: Object
}

export type SyncClientProtocol = ClientProtocol & {
  setRehydrationCompleted(): void
  maybeCheckVersion(): void
}

export type SyncServerProtocol = ServerProtocol & {
  sendToStoreClients(message): void
}

export const actions = {
  initialSyncedState: {
    type: 'initialSyncedState',
    meta: {
      toClient: true,
    },
  },
  updateSyncedState: {
    type: 'updateSyncedState',
    meta: {
      toClient: true,
    },
  },
}
