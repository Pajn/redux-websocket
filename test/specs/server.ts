import {expect} from 'chai'
import {websocketMiddleware} from 'redux-websocket/lib/server'
import {createMockFunction} from '../mocks/function'
import {createMockSocket} from '../mocks/socket'

describe('serverMiddleware', () => {
  it('should dispatch actions received through the socket with meta.toServer', () => {
    const socket = createMockSocket()
    const actions = {socket: {meta: {toServer: true}}}
    const dispatchMock = createMockFunction()
    websocketMiddleware({socket, actions})(null)(dispatchMock)

    socket.protocols['action'].onmessage({action: {type: 'socket'}})

    expect(dispatchMock.calls.length).to.equal(1)
    const firstCall = dispatchMock.calls[0]
    expect(firstCall.args).to.deep.equal([{type: 'socket'}])
  })

  it('should not dispatch actions received through the socket without meta.toServer', () => {
    const socket = createMockSocket()
    const dispatchMock = createMockFunction()
    websocketMiddleware({socket, actions: {}})(null)(dispatchMock)

    socket.protocols['action'].onmessage({action: {type: 'socket'}})

    expect(dispatchMock.calls.length).to.equal(0)
  })

  it('should pass through dispatched actions', () => {
    const socket = createMockSocket()
    const dispatchMock = createMockFunction()
    const dispatch = websocketMiddleware({socket, actions: {}})(null)(dispatchMock)
    socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched', meta: {toClient: true}})

    expect(dispatchMock.calls.length).to.equal(1)
    const firstCall = dispatchMock.calls[0]
    expect(firstCall.args).to.deep.equal([{type: 'dispatched', meta: {toClient: true}}])
  })

  it('should send dispatched actions with meta.toClient to the socket', () => {
    const socket = createMockSocket()
    const dispatch = websocketMiddleware({socket, actions: {}})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched', meta: {toClient: true}})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args).to.deep.equal([{action: {type: 'dispatched', meta: {
      toClient: true,
      fromServer: true,
    }}}])
  })

  it('should not send dispatched actions without meta.toServer to the socket', () => {
    const socket = createMockSocket()
    const dispatch = websocketMiddleware({socket, actions: {}})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched'})

    expect(sendMock.calls.length).to.equal(0)
  })

  it('should send dispatched actions with meta.toClient in actions to the socket', () => {
    const socket = createMockSocket()
    const actions = {dispatched: {meta: {toClient: true}}}
    const dispatch = websocketMiddleware({socket, actions})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched'})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args).to.deep.equal([{action: {type: 'dispatched', meta: {fromServer: true}}}])
  })
})
