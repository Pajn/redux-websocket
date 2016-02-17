import {compose} from 'redux'
import {Settings} from './_sync/constants'
import {diffingMiddleware, trackRehydrationMiddleware} from './_sync/middlewares'
import {checkVersionFunction, createProtocol} from './_sync/protocol'
import {syncReducer} from './_sync/reducer'
export {Settings}

export const syncStoreEnhancer = (settings: Settings) => next => (reducer, initialState) => {
  let store
  const protocol = createProtocol(
    checkVersionFunction(settings.skipVersion),
    () => store.getState(),
    action => store.dispatch(action)
  )

  reducer = syncReducer(settings, protocol, reducer)
  store = next(reducer, initialState)
  settings.socket.registerProtocol('sync', protocol)

  const dispatch = compose(
    diffingMiddleware(settings, protocol)(store),
    trackRehydrationMiddleware(settings, protocol)(store)
  )(store.dispatch)

  return Object.assign({}, store, {dispatch})
}

export function noopReducer(state) {
  return state || {}
}
