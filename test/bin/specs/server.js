var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var chai_1 = require('chai');
var server_1 = require('redux-websocket/lib/server');
var function_1 = require('../mocks/function');
var socket_1 = require('../mocks/socket');
describe('serverMiddleware', () => {
    it('should dispatch actions received through the socket with meta.toServer', () => {
        const socket = socket_1.createMockSocket();
        const actions = { socket: { meta: { toServer: true } } };
        const dispatchMock = function_1.createMockFunction();
        server_1.websocketMiddleware({ socket, actions })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'socket' }]);
    });
    it('should not dispatch actions received through the socket without meta.toServer', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        server_1.websocketMiddleware({ socket, actions: {} })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(0);
    });
    it('should pass through dispatched actions', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        const dispatch = server_1.websocketMiddleware({ socket, actions: {} })(null)(dispatchMock);
        socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toClient: true } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'dispatched', meta: { toClient: true } }]);
    });
    it('should send dispatched actions with meta.toClient to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = server_1.websocketMiddleware({ socket, actions: {} })(null)(function_1.createMockFunction());
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
        const dispatch = server_1.websocketMiddleware({ socket, actions: {} })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(0);
    });
    it('should send dispatched actions with meta.toClient in actions to the socket', () => {
        const socket = socket_1.createMockSocket();
        const actions = { dispatched: { meta: { toClient: true } } };
        const dispatch = server_1.websocketMiddleware({ socket, actions })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched', meta: { fromServer: true } } }]);
    });
});
