'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chai_1 = require('chai');
const client_1 = require('redux-websocket/lib/rpc/client');
const function_1 = require('../../mocks/function');
const socket_1 = require('../../mocks/socket');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
function respond(protocol, response) {
    return message => setTimeout(() => {
        protocol.onmessage(Object.assign({ id: message.id }, response || {}));
    });
}
describe('rpc', () => {
    describe('client', () => {
        it('should register a protocol id if passed', () => {
            const socket = socket_1.createMockSocket();
            client_1.createRpcClient({ socket: socket, id: 'test' });
            chai_1.expect(socket.protocols['rpc']).to.be.undefined;
            chai_1.expect(socket.protocols['rpctest']).to.exist;
        });
        it('should send the correct class name, method name and arguments', () => __awaiter(this, void 0, void 0, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = client_1.createRpcClient({ socket: socket }).remoteProcedures;
            const protocol = socket.protocols['rpc'];
            const sendMock = protocol.send = function_1.trackCalls(respond(protocol));
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method(...args) { }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            const object = new Class();
            yield object.method(1, 2, 3);
            chai_1.expect(sendMock.calls.length).to.equal(1);
            chai_1.expect(sendMock.calls[0].args).to.deep.equal([{
                    id: 0,
                    className: 'Class',
                    methodName: 'method',
                    args: [1, 2, 3],
                }]);
        }));
        it('should respond with the value of the RPC', () => __awaiter(this, void 0, void 0, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = client_1.createRpcClient({ socket: socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            const protocol = socket.protocols['rpc'];
            const sendMock = protocol.send = function_1.trackCalls(respond(protocol, { value: 'server' }));
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() { }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            const object = new Class();
            return chai_1.expect(object.method()).to.eventually.become('server');
        }));
        it('should reject with the error of the RPC', () => __awaiter(this, void 0, void 0, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = client_1.createRpcClient({ socket: socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            const protocol = socket.protocols['rpc'];
            const sendMock = protocol.send = function_1.trackCalls(respond(protocol, { error: 'server' }));
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() { }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            const object = new Class();
            return chai_1.expect(object.method()).to.eventually.be.rejectedWith('server');
        }));
        it('should timout if no response is given', () => __awaiter(this, void 0, void 0, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = client_1.createRpcClient({ socket: socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            const protocol = socket.protocols['rpc'];
            const sendMock = protocol.send = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() { }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class', timeout: 1 }), 
                __metadata('design:paramtypes', [])
            ], Class);
            const object = new Class();
            return chai_1.expect(object.method()).to.eventually.be.rejectedWith('timeout reached');
        }));
    });
});
