declare module 'redux-websocket/lib/_sync/constants' {
  import {createActions} from 'redux-decorated'
  import {Protocol, WebSocketConnection} from 'redux-websocket/lib/common'

  export const dispatchAction
  export const checkVersion

  export type Settings = {
    socket: WebSocketConnection,
    keys: string[],
    skipVersion?: string[],
    waitForAction?: string,
  }

  export type InitialSyncPayload = {
    versions: {[key: string]: number},
    state: Object,
  }

  export type SyncProtocol = Protocol & {
    setRehydrationCompleted(): void,
    maybeCheckVersion(): void,
  }

  export const actions: {
    initialSyncedState: {type: string},
    updateSyncedState: {type: string},
  }
}


declare module 'redux-websocket/lib/_sync/find-changes' {
  type Changes = Array<{
    path: string[],
    value?: any,
    removed?: boolean,
  }>

  type VersionedChanges = Array<{
    key: string,
    changes: Changes,
    version: number,
  }>

  export function findChanges(newState?, oldState?, path?): Object;
  export function findVersionedChanges(newState, oldState, keysToSync): VersionedChanges
  export function applyChanges(oldState, versionedChanges: VersionedChanges, keysToSync): {
    shouldCheckVersions: boolean,
    state: any,
  }
}

declare module 'redux-websocket/lib/_sync/get-new-versions' {
  export function getNewVersions(clientVersions, getState: () => any, skipVersion: string[]): Object
}

declare module 'redux-websocket/lib/_sync/middlewares' {
  import {Settings} from 'redux-websocket/lib/sync'
  type Middleware = (store) => (next) => (action) => void

  export function trackRehydrationMiddleware(s: {waitForAction?: string}, protocol: any): Middleware
  export function diffingMiddleware(s: {keys: string[], skipVersion?: string[]}, protocol: any): Middleware
}

declare module 'redux-websocket/lib/_sync/protocol' {
  type CheckVersionFunction = (
      getState: () => any,
      clientVersions,
      respond: (message) => void
  ) => void

  export function checkVersionFunction(skipVersion: string[]): CheckVersionFunction

  export function createClientProtocol(
      getState: () => any,
      dispatch: (action) => void
  )

  export function createServerProtocol(
      checkVersionFunction: CheckVersionFunction,
      getState: () => any
  )
}

declare module 'redux-websocket/lib/_sync/reducer' {
  export function syncReducer(s: {keys: string[], skipVersion?: string[]}, protocol: any, reducer):
      (state, action) => any
}
