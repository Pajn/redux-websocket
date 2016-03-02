import {expect} from 'chai'
import {WebSocketClient, websocketMiddleware} from 'redux-websocket/lib/client'
import {createMockFunction} from 'mock-functions'
import {createMockSocket} from '../mocks/socket'

describe('WebSocketClient', () => {
  let socketMock

  beforeEach(() => {
    global['WebSocket'] = function WebSocket(url, protocol) {
      this.url = url
      this.protocol = protocol
      this.send = createMockFunction()

      socketMock = this
    }
  })

  afterEach(() => {
    delete global['WebSocket']
  })

  it('should connect to the passed url', () => {
  new WebSocketClient({url: 'ws://test'})

    expect(socketMock.url).to.equal('ws://test')
    expect(socketMock.protocol).to.equal('redux-websocket')
  })

  it('should call onOpen if provided', () => {
    const onOpen = createMockFunction()
    new WebSocketClient({url: 'ws://test', onOpen})

    socketMock.onopen()

    expect(onOpen.calls.length).to.equal(1)
  })

  it('should call onopen on protocols', () => {
    const onopen = createMockFunction()
    const socket = new WebSocketClient({url: 'ws://test'})
    socket.registerProtocol('test', {onopen, onmessage: createMockFunction()})

    socketMock.onopen()

    expect(onopen.calls.length).to.equal(1)
  })

  it('should send messages to the socket with the protocol specified', () => {
    const protocol = {} as any
    const socket = new WebSocketClient({url: 'ws://test'})
    socket.registerProtocol('test', protocol)

    protocol.send('message')

    expect(socketMock.send.calls.length).to.equal(1)
    expect(socketMock.send.calls[0].args).to.deep.equal([
      JSON.stringify({type: 'test', data: 'message'}),
    ])
  })

  it('should send messages from the socket to the correct protocol', () => {
    const protocol = {onmessage: createMockFunction()}
    const socket = new WebSocketClient({url: 'ws://test'})
    socket.registerProtocol('test', protocol)
    socket.registerProtocol('test2', protocol)

    socketMock.onmessage({data: JSON.stringify({type: 'test', data: 'message'})})

    expect(protocol.onmessage.calls.length).to.equal(1)
    expect(protocol.onmessage.calls[0].args).to.deep.equal(['message'])
  })

  describe('', () => {
    let realSetTimeout

    beforeEach(() => {
      realSetTimeout = setTimeout
      global.setTimeout = (fn, time) => realSetTimeout(fn, time / 1000)
    })

    afterEach(() => {
      global.setTimeout = realSetTimeout
    })

    it('should reconnect when the connection is lost', done => {
      new WebSocketClient({url: 'ws://test'})
      const oldSocketMock = socketMock;

      socketMock.onclose()

      setTimeout(() => {
        expect(socketMock).not.to.equal(oldSocketMock)

        done()
      }, 2000)
    })
  })
})

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
