export function getNewVersions(clientVersions, getState: () => any, skipVersion: string[]) {
  const state = getState()
  const stateVersions = state.versions || {}
  const newVersions = {versions: {}, state: {}}
  let updated = false

  Object.keys(stateVersions).forEach(key => {
    if (stateVersions[key] !== clientVersions[key] ||
        // If there exists no version we need to push out the initial state
        clientVersions[key] === 0) {
      newVersions.versions[key] = stateVersions[key]
      newVersions.state[key] = state[key]
      updated = true
    }
  })

  if (skipVersion) {
    skipVersion.forEach(key => {
      newVersions.state[key] = state[key]
      updated = true
    })
  }

  return updated && newVersions
}
