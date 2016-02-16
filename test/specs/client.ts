import {expect} from 'chai'
import {websocketMiddleware} from 'redux-websocket/lib/client'
import {createMockFunction} from '../mocks/function'
import {createMockSocket} from '../mocks/socket'

describe('clientMiddleware', () => {
  it('should dispatch actions received through the socket', () => {
    const socket = createMockSocket()
    const dispatchMock = createMockFunction()
    websocketMiddleware({socket})(null)(dispatchMock)

    socket.protocols['action'].onmessage({action: {type: 'socket'}})

    expect(dispatchMock.calls.length).to.equal(1)
    const firstCall = dispatchMock.calls[0]
    expect(firstCall.args).to.deep.equal([{type: 'socket'}])
  })

  it('should pass through dispatched actions', () => {
    const socket = createMockSocket()
    const dispatchMock = createMockFunction()
    const dispatch = websocketMiddleware({socket})(null)(dispatchMock)
    socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched', meta: {toServer: true}})

    expect(dispatchMock.calls.length).to.equal(1)
    const firstCall = dispatchMock.calls[0]
    expect(firstCall.args).to.deep.equal([{type: 'dispatched', meta: {toServer: true}}])
  })

  it('should send dispatched actions with meta.toServer to the socket', () => {
    const socket = createMockSocket()
    const dispatch = websocketMiddleware({socket})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched', meta: {toServer: true}})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args).to.deep.equal([{action: {type: 'dispatched', meta: {toServer: true}}}])
  })

  it('should not send dispatched actions without meta.toServer to the socket', () => {
    const socket = createMockSocket()
    const dispatch = websocketMiddleware({socket})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched'})

    expect(sendMock.calls.length).to.equal(0)
  })

  it('should send dispatched actions with meta.toServer in actions to the socket', () => {
    const socket = createMockSocket()
    const actions = {dispatched: {meta: {toServer: true}}}
    const dispatch = websocketMiddleware({socket, actions})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched'})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args).to.deep.equal([{action: {type: 'dispatched'}}])
  })
})
