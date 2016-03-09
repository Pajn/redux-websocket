import {actions, dispatchAction, Settings, SyncServerProtocol} from './constants'
import {findVersionedChanges} from './find-changes'

export const diffingMiddleware = ({keys, skipVersion}: Settings, protocol: SyncServerProtocol) =>
    store => next => action => {
  const oldState = store.getState()
  const returnValue = next(action)
  const newState = store.getState()

  const updates = findVersionedChanges(newState, oldState, keys)

  if (updates.length) {
    protocol.sendToStoreClients({
      type: dispatchAction,
      payload: Object.assign({payload: updates}, actions.updateSyncedState),
    })
  }

  return returnValue
}
