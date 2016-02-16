"use strict";
const chai_1 = require('chai');
const server_1 = require('redux-websocket/lib/server');
const function_1 = require('../mocks/function');
const socket_1 = require('../mocks/socket');
function on(event, fn) {
    this[`on${event}`] = fn;
}
describe('WebSocketServer', () => {
    let socketMock;
    beforeEach(() => {
        socketMock = { on: on };
    });
    it('should accept redux-websocket connections', () => {
        const connection = { on: on };
        const request = { accept: function_1.createMockFunction().returns(connection), origin: 'origin' };
        const socket = new server_1.WebSocketServer(socketMock);
        socketMock.onrequest(request);
        chai_1.expect(request.accept.calls.length).to.equal(1);
        chai_1.expect(request.accept.calls[0].args).to.deep.equal(['redux-websocket', 'origin']);
    });
    it('should send messages to all the sockets with the protocol specified', () => {
        const connection = { on: on, send: function_1.createMockFunction() };
        const connection2 = { on: on, send: function_1.createMockFunction() };
        const request = { accept: function_1.createMockFunction().returns(connection) };
        const request2 = { accept: function_1.createMockFunction().returns(connection2) };
        const protocol = {};
        const socket = new server_1.WebSocketServer(socketMock);
        socket.registerProtocol('test', protocol);
        socketMock.onrequest(request);
        socketMock.onrequest(request2);
        protocol.send('message');
        chai_1.expect(connection.send.calls.length).to.equal(1);
        chai_1.expect(connection2.send.calls.length).to.equal(1);
        chai_1.expect(connection.send.calls[0].args).to.deep.equal([
            JSON.stringify({ type: 'test', data: 'message' }),
        ]);
        chai_1.expect(connection2.send.calls[0].args).to.deep.equal([
            JSON.stringify({ type: 'test', data: 'message' }),
        ]);
    });
    it('should send messages from a connection to the correct protocol', () => {
        const connection = { on: on };
        const request = { accept: function_1.createMockFunction().returns(connection) };
        const protocol = { onmessage: function_1.createMockFunction() };
        const socket = new server_1.WebSocketServer(socketMock);
        socket.registerProtocol('test', protocol);
        socket.registerProtocol('test2', protocol);
        socketMock.onrequest(request);
        connection.onmessage({
            type: 'utf8',
            utf8Data: JSON.stringify({ type: 'test', data: 'message' }),
        });
        chai_1.expect(protocol.onmessage.calls.length).to.equal(1);
        chai_1.expect(protocol.onmessage.calls[0].args.length).to.equal(2);
        chai_1.expect(protocol.onmessage.calls[0].args[0]).to.equal('message');
        chai_1.expect(protocol.onmessage.calls[0].args[1]).to.be.a('function');
    });
    it('should provide a response function to the protocol', () => {
        const connection = { on: on, send: function_1.createMockFunction() };
        const request = { accept: function_1.createMockFunction().returns(connection) };
        const protocol = { onmessage: function_1.createMockFunction() };
        const socket = new server_1.WebSocketServer(socketMock);
        socket.registerProtocol('test', protocol);
        socketMock.onrequest(request);
        connection.onmessage({
            type: 'utf8',
            utf8Data: JSON.stringify({ type: 'test', data: 'message' }),
        });
        const response = protocol.onmessage.calls[0].args[1];
        response('message2');
        chai_1.expect(connection.send.calls.length).to.equal(1);
        chai_1.expect(connection.send.calls[0].args).to.deep.equal([JSON.stringify({
                type: 'test',
                data: 'message2'
            })]);
    });
});
describe('serverMiddleware', () => {
    it('should dispatch actions received through the socket with meta.toServer', () => {
        const socket = socket_1.createMockSocket();
        const actions = { socket: { meta: { toServer: true } } };
        const dispatchMock = function_1.createMockFunction();
        server_1.websocketMiddleware({ socket: socket, actions: actions })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'socket' }]);
    });
    it('should not dispatch actions received through the socket without meta.toServer', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        server_1.websocketMiddleware({ socket: socket, actions: {} })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(0);
    });
    it('should pass through dispatched actions', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        const dispatch = server_1.websocketMiddleware({ socket: socket, actions: {} })(null)(dispatchMock);
        socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toClient: true } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'dispatched', meta: { toClient: true } }]);
    });
    it('should send dispatched actions with meta.toClient to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = server_1.websocketMiddleware({ socket: socket, actions: {} })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toClient: true } });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched', meta: {
                        toClient: true,
                        fromServer: true,
                    } } }]);
    });
    it('should not send dispatched actions without meta.toServer to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = server_1.websocketMiddleware({ socket: socket, actions: {} })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(0);
    });
    it('should send dispatched actions with meta.toClient in actions to the socket', () => {
        const socket = socket_1.createMockSocket();
        const actions = { dispatched: { meta: { toClient: true } } };
        const dispatch = server_1.websocketMiddleware({ socket: socket, actions: actions })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched', meta: { fromServer: true } } }]);
    });
});
