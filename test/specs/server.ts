import {expect} from 'chai'
import {ClientMode} from 'redux-websocket/lib/common'
import {WebSocketServer, websocketMiddleware} from 'redux-websocket/lib/server'
import {createMockFunction} from 'mock-functions'
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
    new WebSocketServer(socketMock)

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
    expect(protocol.onmessage.calls[0].args.length).to.equal(3)
    expect(protocol.onmessage.calls[0].args[0]).to.equal('message')
    expect(protocol.onmessage.calls[0].args[1]).to.be.a('function')
    expect(protocol.onmessage.calls[0].args[2]).to.be.a('string')
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
      data: 'message2',
    })])
  })

  it('should only delete the connection that was closed', () => {
    const connection = {on} as any
    const connection2 = {on} as any
    const request = {accept: createMockFunction().returns(connection)}
    const request2 = {accept: createMockFunction().returns(connection2)}
    const socket = new WebSocketServer(socketMock) as any

    socketMock.onrequest(request)
    socketMock.onrequest(request2)

    connection.onclose()

    expect(Object.keys(socket.connections).length).to.equal(1)
    expect(socket.connections[Object.keys(socket.connections)[0]]).to.equal(connection2)
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

    dispatch({type: 'dispatched', meta: {toClient: true, toClientMode: ClientMode.sameStore}})

    expect(dispatchMock.calls.length).to.equal(1)
    const firstCall = dispatchMock.calls[0]
    expect(firstCall.args).to.deep.equal([
      {type: 'dispatched', meta: {toClient: true, toClientMode: ClientMode.sameStore}},
    ])
  })

  it('should send dispatched actions with meta.toClient to the socket', () => {
    const socket = createMockSocket()
    const dispatch = websocketMiddleware({socket, actions: {}})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched', meta: {toClient: true, toClientMode: ClientMode.broadcast}})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args[0]).to.deep.equal({action: {type: 'dispatched', meta: {
      toClient: true,
      toClientMode: ClientMode.broadcast,
      fromServer: true,
    }}})
    expect(firstCall.args[1]).not.to.be.a('function')
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
    const actions = {dispatched: {meta: {toClient: true, toClientMode: ClientMode.broadcast}}}
    const dispatch = websocketMiddleware({socket, actions})(null)(createMockFunction())
    const sendMock = socket.protocols['action'].send = createMockFunction()

    dispatch({type: 'dispatched'})

    expect(sendMock.calls.length).to.equal(1)
    const firstCall = sendMock.calls[0]
    expect(firstCall.args[0]).to.deep.equal({action: {type: 'dispatched', meta: {fromServer: true}}})
    expect(firstCall.args[1]).not.to.be.a('function')
  })
})
