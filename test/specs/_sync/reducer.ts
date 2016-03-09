'use strict'

import {expect} from 'chai'
import {actions} from 'redux-websocket/lib/_sync/constants'
import {syncReducer} from 'redux-websocket/lib/_sync/reducer'
import {createMockFunction, trackCalls} from 'mock-functions'

describe('sync/syncReducer', () => {
  describe('action: initialSyncedState', () => {
    it('should apply state and versions from the server', () => {
      const reducer = syncReducer({
        keys: ['old', 'current', 'new', 'skip'],
        skipVersion: ['skip'],
      }, null, null)

      const result = reducer({
        old: 1,
        current: 1,
        versions: {old: 1, current: 2},
      }, {
        type: actions.initialSyncedState.type,
        payload: {
          state: {
            old: 2,
            new: 1,
            // TODO: Handle ignored
            // ignored: 1,
            // skip: 1,
          },
          versions: {
            old: 2,
            new: 1,
            // ignored: 1,
            // skip: 1,
          },
        },
      })

      expect(result).to.deep.equal({
        old: 2,
        current: 1,
        new: 1,
        versions: {old: 2, current: 2, new: 1},
      })
    })
  })

  describe('action: updateSyncedState', () => {
    it('should apply state and versions from the server', () => {
      const reducer = syncReducer({keys: ['old', 'current']}, null, null)

      const result = reducer({
        old: 1,
        current: 1,
        ignored: 1,
        versions: {old: 1, current: 2},
      }, {
        type: actions.updateSyncedState.type,
        payload: [
          {
            key: 'old',
            version: 2,
            changes: [{path: [], value: 2}],
          },
          {
            key: 'ignored',
            version: 1,
            changes: [{path: [], value: 2}],
          },
        ],
      })

      expect(result).to.deep.equal({
        old: 2,
        current: 1,
        ignored: 1,
        versions: {old: 2, current: 2},
      })
    })

    it('should call maybeCheckVersion if versions differ', () => {
      const protocol = {maybeCheckVersion: createMockFunction()}
      const reducer = syncReducer({keys: ['old']}, protocol, null)

      const result = reducer(
        {old: 1, versions: {old: 1}},
        {
          type: actions.updateSyncedState.type,
          payload: [{
            key: 'old',
            version: 3,
            changes: [{path: [], value: 2}],
          }],
        }
      )

      expect(protocol.maybeCheckVersion.calls.length).to.equal(1)
      expect(result).to.deep.equal({
        old: 1,
        versions: {old: 1},
      })
    })
  })

  describe('other actions', () => {
    it('should pass through an undefined state to the reducer', () => {
      const reducerMock = trackCalls(() => ({}))
      const reducer = syncReducer({keys: []}, null, reducerMock)

      const result = reducer(undefined, {})

      expect(reducerMock.calls.length).to.equal(1)
      expect(reducerMock.calls[0].args[0]).to.equal(undefined)
      expect(result).to.deep.equal({})
    })

    it('should pass through to the passed reducer', () => {
      const reducerMock = trackCalls(() => ({prop: 2}))
      const reducer = syncReducer({keys: []}, null, reducerMock)

      const result = reducer({prop: 1}, {type: 'other'})

      expect(reducerMock.calls.length).to.equal(1)
      expect(reducerMock.calls[0].args).to.deep.equal([{prop: 1}, {type: 'other'}])
      expect(result).to.deep.equal({prop: 2})
    })

    it('should bump the version of changed key', () => {
      const reducerMock = trackCalls(state => ({
        ignore: 2, skip: 2, bump: 2, new: 1, keep: state.keep,
      }))
      const reducer = syncReducer(
        {keys: ['skip', 'keep', 'bump', 'new'], skipVersion: ['skip']},
        null,
        reducerMock
      )

      const result = reducer(
        {ignore: 1, skip: 1, keep: 1, bump: 1, versions: {bump: 1}},
        {type: 'other'}
      )

      expect(result).to.deep.equal({
        ignore: 2, skip: 2, bump: 2, keep: 1, new: 1, versions: {bump: 2, new: 1},
      })
    })
  })
})
