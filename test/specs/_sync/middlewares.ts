'use strict'

import {expect} from 'chai'
import {actions, dispatchAction} from 'redux-websocket/lib/_sync/constants'
import {diffingMiddleware, trackRehydrationMiddleware} from 'redux-websocket/lib/_sync/middlewares'
import {createMockFunction} from 'mock-functions'

describe('sync/middlewares', () => {
  describe('diffingMiddleware', () => {
    it('should pass through dispatched actions', () => {
      const dispatchMock = createMockFunction()
      const store = {getState: createMockFunction()}
      const dispatch = diffingMiddleware({keys: []}, null)(store)(dispatchMock)

      dispatch({type: 'dispatched'})

      expect(dispatchMock.calls.length).to.equal(1)
      expect(dispatchMock.calls[0].args).to.deep.equal([{type: 'dispatched'}])
    })

    it('should not send when there are no changes', () => {
      const dispatchMock = createMockFunction()
      const store = {getState: createMockFunction().returns({})}
      const protocol = {send: createMockFunction()}
      const dispatch = diffingMiddleware({keys: []}, protocol)(store)(dispatchMock)

      dispatch({type: 'dispatched'})

      expect(protocol.send.calls.length).to.equal(0)
    })

    it('should send changes in keys to check', () => {
      const dispatchMock = createMockFunction()
      const store = {
        getState: createMockFunction()
          .returns(0, {})
          .returns(1, {prop: 'new', versions: {prop: 2}}),
      }
      const protocol = {sendToStoreClients: createMockFunction()}
      const dispatch = diffingMiddleware({keys: ['prop']}, protocol)(store)(dispatchMock)

      dispatch({type: 'dispatched'})

      expect(protocol.sendToStoreClients.calls.length).to.equal(1)
      expect(protocol.sendToStoreClients.calls[0].args).to.deep.equal([{
        type: dispatchAction,
        payload: {
          type: actions.updateSyncedState.type,
          meta: {
            toClient: true,
          },
          payload: [{
            changes: [{
              path: [],
              value: 'new',
            }],
            key: 'prop',
            version: 2,
          }],
        },
      }])
    })

    it('should not send changes in keys to ignore', () => {
      const dispatchMock = createMockFunction()
      const store = {getState: createMockFunction().returns(0, {}).returns(1, {prop: 'new'})}
      const protocol = {send: createMockFunction()}
      const dispatch = diffingMiddleware({keys: []}, protocol)(store)(dispatchMock)

      dispatch({type: 'dispatched'})

      expect(protocol.send.calls.length).to.equal(0)
    })
  })

  describe('trackRehydrationMiddleware', () => {
    it('should pass through dispatched actions', () => {
      const dispatchMock = createMockFunction()
      const protocol = {
        setRehydrationCompleted: createMockFunction(),
        maybeCheckVersion: createMockFunction(),
      }
      const store = {getState: createMockFunction()}
      const dispatch = trackRehydrationMiddleware({}, protocol)(store)(dispatchMock)

      dispatch({type: 'dispatched'})

      expect(dispatchMock.calls.length).to.equal(1)
      expect(dispatchMock.calls[0].args).to.deep.equal([{type: 'dispatched'}])
    })

    it('should directly call maybeCheckVersion if waitForAction is null', () => {
      const protocol = {
        setRehydrationCompleted: createMockFunction(),
        maybeCheckVersion: createMockFunction(),
      }
      trackRehydrationMiddleware({waitForAction: null}, protocol)(null)(null)

      expect(protocol.setRehydrationCompleted.calls.length).to.equal(1)
      expect(protocol.maybeCheckVersion.calls.length).to.equal(1)
    })

    it('should not call maybeCheckVersion for other actions than waitForAction', () => {
      const dispatchMock = createMockFunction()
      const protocol = {
        setRehydrationCompleted: createMockFunction(),
        maybeCheckVersion: createMockFunction(),
      }
      const dispatch = trackRehydrationMiddleware({waitForAction: 'action'}, protocol)(null)(dispatchMock)

      dispatch({type: 'other'})

      expect(protocol.setRehydrationCompleted.calls.length).to.equal(0)
      expect(protocol.maybeCheckVersion.calls.length).to.equal(0)
    })

    it('should call maybeCheckVersion for waitForAction', () => {
      const dispatchMock = createMockFunction()
      const protocol = {
        setRehydrationCompleted: createMockFunction(),
        maybeCheckVersion: createMockFunction(),
      }
      const dispatch = trackRehydrationMiddleware({waitForAction: 'action'}, protocol)(null)(dispatchMock)

      dispatch({type: 'action'})

      expect(protocol.setRehydrationCompleted.calls.length).to.equal(1)
      expect(protocol.maybeCheckVersion.calls.length).to.equal(1)
    })
  })
})
