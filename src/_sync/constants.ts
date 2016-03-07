import {Protocol, WebSocketConnection} from '../common'

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

export type SyncProtocol = Protocol & {
  setRehydrationCompleted(): void
  maybeCheckVersion(): void
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
