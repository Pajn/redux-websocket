import {Store} from 'redux'
import {Settings} from './_sync/constants'
import {diffingMiddleware} from './_sync/diffing-middleware'
import {checkVersionFunction, createClientProtocol, createServerProtocol} from './_sync/protocol'
import {syncReducer} from './_sync/reducer'
import {trackRehydrationMiddleware} from './_sync/track-rehydration-middleware'
import {ServerProtocol} from './common'
export {Settings}

export const syncStoreEnhancer = (settings: Settings) => next => (reducer, initialState) => {
  let store: Store
  const protocol = createClientProtocol(
    () => store.getState(),
    action => store.dispatch(action)
  )

  reducer = syncReducer(settings, protocol, reducer)
  store = next(reducer, initialState)

  const dispatch = trackRehydrationMiddleware(settings, protocol)(store)(store.dispatch)

  settings.socket.registerProtocol('sync', protocol)

  return Object.assign({}, store, {dispatch})
}

export function noopReducer(state) {
  return state || {}
}

export function createSyncServer(settings: Settings) {
  const connectionToProtocol: {[connectionId: string]: ServerProtocol} = {}
  const globalProtocol: ServerProtocol = {
    onclose(connectionId: string) {
      const protocol = connectionToProtocol[connectionId]
      if (protocol) {
        connectionToProtocol[connectionId].onclose(connectionId)
        delete connectionToProtocol[connectionId]
      }
    },

    onmessage(message, respond, connectionId: string) {
      const protocol = connectionToProtocol[connectionId]
      if (protocol) {
        connectionToProtocol[connectionId].onmessage(message, respond, connectionId)
      }
    },
  }

  settings.socket.registerProtocol('sync', globalProtocol)

  return {
    createSyncMiddleware() {
      let protocol

      function addConnection(connectionId) {
        connectionToProtocol[connectionId] = protocol
      }

      const syncMiddleware = store => next => {
        protocol = createServerProtocol(
          checkVersionFunction(settings.skipVersion),
          () => store.getState()
        )

        return diffingMiddleware(settings, protocol)(store)(next)
      }

      return {addConnection, syncMiddleware}
    },
  }
}
