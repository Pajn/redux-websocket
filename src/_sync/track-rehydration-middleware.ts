import {Settings, SyncClientProtocol} from './constants'

export const trackRehydrationMiddleware = (
    {waitForAction}: Settings,
    protocol: SyncClientProtocol
) => store => next => {
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
