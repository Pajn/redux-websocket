import {removeIn, updateIn} from 'redux-decorated';
import {Protocol, WebSocketConnection} from './common';

const dispatchAction = 'dispatchAction';
const checkVersion = 'checkVersion';

type Settings = {
  connection: WebSocketConnection,
  keys: string[],
  skipVersion?: string[],
};

type InitialSyncPayload = {
  versions: {[key: string]: number},
  state: Object,
};

type UpdatePayload = Array<{
  key: string,
  version: number,
  changes: Array<{
    path: string[],
    value?: any,
    removed?: boolean,
  }>
}>;

const actions = {
  initialSyncedState: {
    type: 'initialSyncedState',
    meta: {
      toClient: true,
    },
  },
  updateSyncedState: {
    type: 'updateSyncedState',
    meta: {
      toServer: true,
      toClient: true,
    },
  },
};

function findChanges(newState = {}, oldState = {}, path = []) {
  let newKeys = Object.keys(newState);

  let newChanges = [];

  for (const key of newKeys) {

    if (newChanges.length / newKeys.length > 0.4) {
      break;
    }

    if (newState[key] !== oldState[key]) {
      if (newState[key] === undefined) {
        newChanges.push({
          path: [...path, key],
          removed: true,
        });
      } else if (typeof newState[key] !== 'object' || newState[key] === null ||
                 typeof oldState[key] !== 'object' || oldState[key] === null ||
                 typeof oldState[key] === undefined) {
        newChanges.push({
          path: [...path, key],
          value: newState[key],
        });
      } else {
        newChanges = newChanges.concat(
          findChanges(newState[key], oldState[key], [...path, key])
        );
      }
    }
  }

  if (newChanges.length / newKeys.length > 0.4) {
    return [{path, value: newState}];
  }

  return newChanges;
}

let maybeCheckVersion;

const syncMiddleware = ({connection, keys, skipVersion}: Settings) => store =>
    next => {

  let webSocketOpened = false;
  let rehydrationCompleted = false;

  const protocol: Protocol = {
    onopen() {
      webSocketOpened = true;
      maybeCheckVersion();
    },

    onmessage({type, payload}, respond) {
      switch (type) {
        case checkVersion:
          const {versions} = payload;
          const state = store.getState();

          const ret = {versions: {}, state: {}};
          let updated = false;

          Object.keys(state.versions).forEach(key => {
            if (state.versions[key] !== versions[key]) {
              ret.versions[key] = state.versions[key];
              ret.state[key] = state[key];
              updated = true;
            }
          });

          if (skipVersion) {
            skipVersion.forEach(key => {
              ret.state[key] = state[key];
              updated = true;
            });
          }

          if (updated) {
            respond({
              type: dispatchAction,
              payload: Object.assign({payload: ret}, actions.initialSyncedState),
            });
          }
          return;

        case dispatchAction:
          const action = payload;
          if (actions[action.type]) {
            next(action);
          }
          return;
      }
    }
  };

  maybeCheckVersion = () => {
    if (webSocketOpened && rehydrationCompleted) {
      protocol.send({type: checkVersion, payload: {versions: store.getState().versions}});
    }
  };

  connection.registerProtocol('sync', protocol);

  return action => {
    const oldState = store.getState();
    next(action);
    const newState = store.getState();

    if (action.type === 'persist/COMPLETE') {
      rehydrationCompleted = true;
      maybeCheckVersion();
    }

    if (!newState || !oldState) return;

    const updates = [];

    for (const key of keys) {
      const changes = findChanges(newState[key], oldState[key]);
      if (changes.length > 0) {
        updates.push({key, changes, version: newState.versions[key]});
      }
    }

    if (updates.length) {
      next(Object.assign(
        {payload: updates},
        actions.updateSyncedState)
      );
    }
  };
};

const syncReducer = ({keys, skipVersion}: Settings) => reducer => {

  return (state, action) => {
    let newState;

    switch (action.type) {
      case actions.initialSyncedState.type:
        const {versions} = action.payload;
        const initialState = action.payload.state;

        state = Object.assign({}, state, initialState);
        Object.assign(state.versions, versions);

        return state;

      case actions.updateSyncedState.type:
        let shouldCheckVersions = false;
        newState = state;

        const payload = (action.payload as UpdatePayload)
            .filter(({key}) => keys.indexOf(key) !== -1);

        for (const {key, version, changes} of payload) {
          if (version > state.versions[key] + 1) {
            shouldCheckVersions = true;
          } else if (version !== undefined && version !== state.versions[key] + 1) continue;

          newState = updateIn(['versions', key], version, newState);

          for (const {path, value, removed} of changes) {
            newState = removed
              ? removeIn([key, ...path], newState)
              : updateIn([key, ...path], value, newState);
          }
        }

        if (shouldCheckVersions && maybeCheckVersion) {
          maybeCheckVersion();
        }

        return newState;

      default:
        newState = reducer(state, action);
        if (!state) {
          const versions = {};
          for (const key of keys) {
            if (skipVersion.indexOf(key) === -1) {
              versions[key] = 0;
            }
          }
          newState = Object.assign({}, newState, {versions});
        } else {
          for (const key of keys) {
            if (state[key] !== newState[key] && skipVersion.indexOf(key) === -1) {
              newState = updateIn(['versions', key], (state.versions[key] || 0) + 1, newState);
            }
          }
        }
        return newState;
    }
  };
};

export const syncStoreEnhancer = (settings: Settings) => next => (reducer, initialState) => {
  reducer = syncReducer(settings)(reducer);
  let store = next(reducer, initialState);
  const dispatch = syncMiddleware(settings)(store)(store.dispatch);
  store = Object.assign({}, store);
  store.dispatch = dispatch;

  return store;
};
