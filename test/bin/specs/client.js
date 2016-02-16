var chai_1 = require('chai');
var client_1 = require('redux-websocket/lib/client');
var function_1 = require('../mocks/function');
var socket_1 = require('../mocks/socket');
describe('clientMiddleware', () => {
    it('should dispatch actions received through the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        client_1.websocketMiddleware({ socket })(null)(dispatchMock);
        socket.protocols['action'].onmessage({ action: { type: 'socket' } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'socket' }]);
    });
    it('should pass through dispatched actions', () => {
        const socket = socket_1.createMockSocket();
        const dispatchMock = function_1.createMockFunction();
        const dispatch = client_1.websocketMiddleware({ socket })(null)(dispatchMock);
        socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toServer: true } });
        chai_1.expect(dispatchMock.calls.length).to.equal(1);
        const firstCall = dispatchMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ type: 'dispatched', meta: { toServer: true } }]);
    });
    it('should send dispatched actions with meta.toServer to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = client_1.websocketMiddleware({ socket })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched', meta: { toServer: true } });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched', meta: { toServer: true } } }]);
    });
    it('should not send dispatched actions without meta.toServer to the socket', () => {
        const socket = socket_1.createMockSocket();
        const dispatch = client_1.websocketMiddleware({ socket })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(0);
    });
    it('should send dispatched actions with meta.toServer in actions to the socket', () => {
        const socket = socket_1.createMockSocket();
        const actions = { dispatched: { meta: { toServer: true } } };
        const dispatch = client_1.websocketMiddleware({ socket, actions })(null)(function_1.createMockFunction());
        const sendMock = socket.protocols['action'].send = function_1.createMockFunction();
        dispatch({ type: 'dispatched' });
        chai_1.expect(sendMock.calls.length).to.equal(1);
        const firstCall = sendMock.calls[0];
        chai_1.expect(firstCall.args).to.deep.equal([{ action: { type: 'dispatched' } }]);
    });
});
