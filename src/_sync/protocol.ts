import {actions, checkVersion, dispatchAction, SyncProtocol} from './constants'
import {getNewVersions} from './get-new-versions'

type CheckVersionFunction = (
  getState: () => any,
  clientVersions,
  respond: (message) => void
) => void

export function checkVersionFunction(skipVersion: string[]): CheckVersionFunction {
  return (getState, clientVersions, respond) => {
    const newVersions = getNewVersions(clientVersions, getState, skipVersion);

    if (newVersions) {
      respond({
        type: dispatchAction,
        payload: Object.assign({payload: newVersions}, actions.initialSyncedState),
      })
    }
  }
}

export function createProtocol(
    checkVersionFunction: CheckVersionFunction,
    getState: () => any,
    dispatch: (action) => void
) {
  let rehydrationCompleted = false
  let webSocketOpened = false

  const protocol: SyncProtocol = {
    onopen() {
      webSocketOpened = true
      this.maybeCheckVersion()
    },

    onmessage({type, payload}, respond) {
      switch (type) {
        case checkVersion:
          checkVersionFunction(getState, payload.versions, respond)
          break

        case dispatchAction:
          if (actions[payload.type]) {
            dispatch(payload)
          }
          break
      }
    },

    setRehydrationCompleted() {
      rehydrationCompleted = true
    },

    maybeCheckVersion() {
      if (webSocketOpened && rehydrationCompleted) {
        this.send({type: checkVersion, payload: {versions: getState().versions}})
      }
    },
  }

  return protocol
}
