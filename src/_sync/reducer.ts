import {updateIn} from 'redux-decorated'
import {actions, InitialSyncPayload, Settings, SyncProtocol} from './constants'
import {applyChanges} from './find-changes'

export const syncReducer = ({keys, skipVersion}: Settings, protocol: SyncProtocol, reducer) => {
  function maintainVersion(key) {
    return !skipVersion || skipVersion.indexOf(key) === -1
  }

  return (oldState = {}, action) => {
    const stateVersions = oldState['versions'] || {}

    switch (action.type) {
      case actions.initialSyncedState.type:
        const {state: initialState, versions} = action.payload as InitialSyncPayload

        return Object.assign({}, oldState, initialState, {
          versions: Object.assign({}, oldState['versions'], versions),
        })

      case actions.updateSyncedState.type:
        const {shouldCheckVersions, state} = applyChanges(oldState, action.payload, keys)

        if (shouldCheckVersions) {
          protocol.maybeCheckVersion()
        }

        return state

      default:
        let newState = reducer(oldState, action)

        for (const key of keys) {
          if (oldState[key] !== newState[key] && maintainVersion(key)) {
            const nextVersion = (stateVersions[key] || 0) + 1
            newState = updateIn(['versions', key], nextVersion, newState)
          }
        }

        return newState
    }
  }
}
