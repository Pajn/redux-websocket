import {actions, dispatchAction, Settings, SyncProtocol} from './constants'
import {findVersionedChanges} from './find-changes'

export const diffingMiddleware = ({keys, skipVersion}: Settings, protocol: SyncProtocol) =>
    store => next => action => {
  const oldState = store.getState()
  const returnValue = next(action)
  const newState = store.getState()

  const updates = findVersionedChanges(newState, oldState, keys)

  if (updates.length) {
    protocol.send({
      type: dispatchAction,
      payload: Object.assign({payload: updates}, actions.updateSyncedState),
    })
  }

  return returnValue
}

export const trackRehydrationMiddleware = ({waitForAction}: Settings, protocol: SyncProtocol) =>
    store => next => {
  if (!waitForAction) {
    protocol.setRehydrationCompleted()
    protocol.maybeCheckVersion()
  }

  return action => {
    if (waitForAction && action.type === waitForAction) {
      protocol.setRehydrationCompleted()
      protocol.maybeCheckVersion()
    }

    return next(action)
  }
}
