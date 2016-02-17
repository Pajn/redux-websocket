'use strict'

import {expect} from 'chai'
import {actions, checkVersion, dispatchAction} from 'redux-websocket/lib/_sync/constants'
import {checkVersionFunction, createProtocol} from 'redux-websocket/lib/_sync/protocol'
import {createMockFunction} from '../../mocks/function'

describe('sync/protocol', () => {
  describe('checkVersionFunction', () => {
  })

  describe('createProtocol', () => {
    describe('onmessage', () => {
      it('should call the checkVersionFunction when checkVersion are received', () => {
        const checkVersionMock = createMockFunction()
        const getStateMock = createMockFunction()
        const protocol = createProtocol(
          checkVersionMock,
          getStateMock,
          createMockFunction()
        )
        const versions = {}
        const respondMock = createMockFunction()

        protocol.onmessage({type: checkVersion, payload: {versions}}, respondMock)

        expect(checkVersionMock.calls.length).to.equal(1)
        expect(checkVersionMock.calls[0].args.length).to.equal(3)
        expect(checkVersionMock.calls[0].args[0]).to.equal(getStateMock)
        expect(checkVersionMock.calls[0].args[1]).to.equal(versions)
        expect(checkVersionMock.calls[0].args[2]).to.equal(respondMock)
      })

      it('should dispatch actions defined by this module', () => {
        const dispatchMock = createMockFunction()
        const protocol = createProtocol(
          createMockFunction(),
          createMockFunction(),
          dispatchMock
        )

        for (const type of Object.keys(actions)) {
          protocol.onmessage({type: dispatchAction, payload: {type}})
        }

        expect(dispatchMock.calls.length).to.equal(Object.keys(actions).length)
      })

      it('should not dispatch actions not defined by this module', () => {
        const dispatchMock = createMockFunction()
        const protocol = createProtocol(
          createMockFunction(),
          createMockFunction(),
          dispatchMock
        )

        protocol.onmessage({type: dispatchAction, payload: {type: 'action'}})

        expect(dispatchMock.calls.length).to.equal(0)
      })
    })

    describe('maybeCheckVersion', () => {
      it('should call send only after both onopen and setRehydrationCompleted have been called', () => {
        const protocol1 = createProtocol(null, createMockFunction().returns({}), null)
        const protocol2 = createProtocol(null, createMockFunction().returns({}), null)
        protocol1.send = createMockFunction()
        protocol2.send = createMockFunction()

        protocol1.maybeCheckVersion()
        protocol2.maybeCheckVersion()

        expect(protocol1.send.calls.length).to.equal(0)
        expect(protocol2.send.calls.length).to.equal(0)

        protocol1.onopen()
        protocol2.setRehydrationCompleted()
        protocol1.maybeCheckVersion()
        protocol2.maybeCheckVersion()

        expect(protocol1.send.calls.length).to.equal(0)
        expect(protocol2.send.calls.length).to.equal(0)

        protocol1.setRehydrationCompleted()
        protocol2.onopen()
        protocol1.maybeCheckVersion()

        expect(protocol1.send.calls.length).to.equal(1)
        expect(protocol2.send.calls.length).to.equal(1)
      })

      it('should send the current versions', () => {
        const protocol = createProtocol(
          null,
          createMockFunction().returns({key: {prop: 1}, versions: {key: 1}}),
          null
        )
        protocol.send = createMockFunction()
        protocol.setRehydrationCompleted()
        protocol.onopen()

        expect(protocol.send.calls.length).to.equal(1)
        expect(protocol.send.calls[0].args).to.deep.equal([{
          type: checkVersion,
          payload: {versions: {key: 1}}
        }])
      })
    })
  })
})
