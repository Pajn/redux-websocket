import {removeIn, updateIn} from 'redux-decorated'

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

export function findChanges(newState = {}, oldState = {}, path = []): Changes {
  const newKeys = Object.keys(newState)
  const oldKeys = Object.keys(oldState)

  let newChanges = []

  for (const key of newKeys) {

    if (newChanges.length > 2 && newChanges.length / newKeys.length > 0.4) {
      break
    }

    if (newState[key] !== oldState[key]) {
      if (typeof newState[key] !== 'object' || newState[key] === null ||
          typeof oldState[key] !== 'object' || oldState[key] === null ||
          typeof oldState[key] === undefined) {
        newChanges.push({
          path: [...path, key],
          value: newState[key],
        })
      } else {
        newChanges = newChanges.concat(
          findChanges(newState[key], oldState[key], [...path, key])
        )
      }
    }
  }

  for (const key of oldKeys) {

    if (newChanges.length > 2 && newChanges.length / newKeys.length > 0.4) {
      break
    }

    if (newState[key] === undefined) {
      newChanges.push({
        path: [...path, key],
        removed: true,
      })
    }
  }

  if (newChanges.length > 2 && newChanges.length / newKeys.length > 0.4) {
    return [{path, value: newState}]
  }

  return newChanges
}

export function findVersionedChanges(newState, oldState, keysToSync): VersionedChanges {
  if (!newState || !oldState) return []

  const newVersions = newState.versions || {}
  const updates = []

  for (const key of keysToSync) {
    const changes = findChanges(newState[key], oldState[key])
    if (changes.length > 0) {
      updates.push({key, changes, version: newVersions[key]})
    }
  }

  return updates;
}

export function applyChanges(oldState, versionedChanges: VersionedChanges, keysToSync) {
  const stateVersions = oldState['versions'] || {}
  let shouldCheckVersions = false
  let state = oldState

  versionedChanges = versionedChanges.filter(({key}) => keysToSync.indexOf(key) !== -1)

  for (const {key, version, changes} of versionedChanges) {
    if (version !== stateVersions[key] + 1) {
      shouldCheckVersions = true
      continue
    }

    state = updateIn(['versions', key], version, state)

    for (const {path, value, removed} of changes) {
      state = removed
        ? removeIn([key, ...path], state)
        : updateIn([key, ...path], value, state)
    }
  }

  return {shouldCheckVersions, state}
}
