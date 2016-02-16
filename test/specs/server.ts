import {expect} from 'chai'
import {WebSocketServer, websocketMiddleware} from 'redux-websocket/lib/server'
import {createMockFunction} from '../mocks/function'
import {createMockSocket} from '../mocks/socket'

function on(event, fn) {
  this[`on${event}`] = fn
}

describe('WebSocketServer', () => {
  let socketMock

  beforeEach(() => {
    socketMock = {on}
  })

  it('should accept redux-websocket connections', () => {
    const connection = {on} as any
    const request = {accept: createMockFunction().returns(connection), origin: 'origin'}
    const socket = new WebSocketServer(socketMock)

    socketMock.onrequest(request)

    expect(request.accept.calls.length).to.equal(1)
    expect(request.accept.calls[0].args).to.deep.equal(['redux-websocket', 'origin'])
  })

  it('should send messages to all the sockets with the protocol specified', () => {
    const connection = {on, send: createMockFunction()} as any
    const connection2 = {on, send: createMockFunction()} as any
    const request = {accept: createMockFunction().returns(connection)}
    const request2 = {accept: createMockFunction().returns(connection2)}
    const protocol = {} as any
    const socket = new WebSocketServer(socketMock)
    socket.registerProtocol('test', protocol)

    socketMock.onrequest(request)
    socketMock.onrequest(request2)

    protocol.send('message')

    expect(connection.send.calls.length).to.equal(1)
    expect(connection2.send.calls.length).to.equal(1)
    expect(connection.send.calls[0].args).to.deep.equal([
      JSON.stringify({type: 'test', data: 'message'}),
    ])
    expect(connection2.send.calls[0].args).to.deep.equal([
      JSON.stringify({type: 'test', data: 'message'}),
    ])
  })

  it('should send messages from a connection to the correct protocol', () => {
    const connection = {on} as any
    const request = {accept: createMockFunction().returns(connection)}
    const protocol = {onmessage: createMockFunction()}
    const socket = new WebSocketServer(socketMock)
    socket.registerProtocol('test', protocol)
    socket.registerProtocol('test2', protocol)

    socketMock.onrequest(request)
    connection.onmessage({
      type: 'utf8',
      utf8Data: JSON.stringify({type: 'test', data: 'message'}),
    })

    expect(protocol.onmessage.calls.length).to.equal(1)
    expect(protocol.onmessage.calls[0].args.length).to.equal(2)
    expect(protocol.onmessage.calls[0].args[0]).to.equal('message')
    expect(protocol.onmessage.calls[0].args[1]).to.be.a('function')
  })

  it('should provide a response function to the protocol', () => {
    const connection = {on, send: createMockFunction()} as any
    const request = {accept: createMockFunction().returns(connection)}
    const protocol = {onmessage: createMockFunction()}
    const socket = new WebSocketServer(socketMock)
    socket.registerProtocol('test', protocol)

    socketMock.onrequest(request)
    connection.onmessage({
      type: 'utf8',
      utf8Data: JSON.stringify({type: 'test', data: 'message'}),
    })

    const response = protocol.onmessage.calls[0].args[1]

    response('message2')

    expect(connection.send.calls.length).to.equal(1)
    expect(connection.send.calls[0].args).to.deep.equal([JSON.stringify({
      type: 'test',
      data: 'message2'
    })])
  })
})

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
