"use strict";
const chai_1 = require('chai');
const client_1 = require('redux-websocket/lib/client');
const function_1 = require('../mocks/function');
const socket_1 = require('../mocks/socket');
describe('WebSocketClient', () => {
    let socketMock;
    beforeEach(() => {
        global['WebSocket'] = function WebSocket(url, protocol) {
            this.url = url;
            this.protocol = protocol;
            this.send = function_1.createMockFunction();
            socketMock = this;
        };
    });
    afterEach(() => {
        delete global['WebSocket'];
    });
    it('should connect to the passed url', () => {
        const socket = new client_1.WebSocketClient({ url: 'ws://test' });
        chai_1.expect(socketMock.url).to.equal('ws://test');
        chai_1.expect(socketMock.protocol).to.equal('redux-websocket');
    });
    it('should call onOpen if provided', () => {
        const onOpen = function_1.createMockFunction();
        const socket = new client_1.WebSocketClient({ url: 'ws://test', onOpen: onOpen });
        socketMock.onopen();
        chai_1.expect(onOpen.calls.length).to.equal(1);
    });
    it('should call onopen on protocols', () => {
        const onopen = function_1.createMockFunction();
        const socket = new client_1.WebSocketClient({ url: 'ws://test' });
        socket.registerProtocol('test', { onopen: onopen, onmessage: function_1.createMockFunction() });
        socketMock.onopen();
        chai_1.expect(onopen.calls.length).to.equal(1);
    });
    it('should send messages to the socket with the protocol specified', () => {
        const protocol = {};
        const socket = new client_1.WebSocketClient({ url: 'ws://test' });
        socket.registerProtocol('test', protocol);
        protocol.send('message');
        chai_1.expect(socketMock.send.calls.length).to.equal(1);
        chai_1.expect(socketMock.send.calls[0].args).to.deep.equal([
            JSON.stringify({ type: 'test', data: 'message' }),
        ]);
    });
    it('should send messages from the socket to the correct protocol', () => {
        const protocol = { onmessage: function_1.createMockFunction() };
        const socket = new client_1.WebSocketClient({ url: 'ws://test' });
        socket.registerProtocol('test', protocol);
        socket.registerProtocol('test2', protocol);
        socketMock.onmessage({ data: JSON.stringify({ type: 'test', data: 'message' }) });
        chai_1.expect(protocol.onmessage.calls.length).to.equal(1);
        chai_1.expect(protocol.onmessage.calls[0].args).to.deep.equal(['message']);
    });
    describe('', () => {
        let realSetTimeout;
        beforeEach(() => {
            realSetTimeout = setTimeout;
            global.setTimeout = (fn, time) => realSetTimeout(fn, time / 1000);
        });
        afterEach(() => {
            global.setTimeout = realSetTimeout;
        });
        it('should reconnect when the connection is lost', done => {
            const socket = new client_1.WebSocketClient({ url: 'ws://test' });
            const oldSocketMock = socketMock;
            socketMock.onclose();
            setTimeout(() => {
                chai_1.expect(socketMock).not.to.equal(oldSocketMock);
                done();
            }, 2000);
        });
    });
});
describe('clientMiddleware', () => {
    it('should dispatch actions received through the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        client_1.websocketMiddleware({ socket: socket })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'socket' }]);
    });
    it('should pass through dispatched actions', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        const dispatch = client_1.websocketMiddleware({ socket: socket })(null)(dispatchMock);
        socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toServer: true } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'dispatched', meta: { toServer: true } }]);
    });
    it('should send dispatched actions with meta.toServer to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = client_1.websocketMiddleware({ socket: socket })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toServer: true } });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched', meta: { toServer: true } } }]);
    });
    it('should not send dispatched actions without meta.toServer to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = client_1.websocketMiddleware({ socket: socket })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(0);
    });
    it('should send dispatched actions with meta.toServer in actions to the socket', () => {
        const socket = socket_1.createMockSocket();
        const actions = { dispatched: { meta: { toServer: true } } };
        const dispatch = client_1.websocketMiddleware({ socket: socket, actions: actions })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched' } }]);
    });
});
