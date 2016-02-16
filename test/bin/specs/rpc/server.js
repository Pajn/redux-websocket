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
var server_1 = require('redux-websocket/lib/rpc/server');
var function_1 = require('../../mocks/function');
var socket_1 = require('../../mocks/socket');
describe('rpc', () => {
    describe('server', () => {
        it('should register a protocol id if passed', () => {
            const socket = socket_1.createMockSocket();
            server_1.createRpcServer({ socket, id: 'test' });
            chai_1.expect(socket.protocols['rpc']).to.be.undefined;
            chai_1.expect(socket.protocols['rpctest']).to.exist;
        });
        it('should respond with an error if the class is missing', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            server_1.createRpcServer({ socket });
            const respondMock = function_1.createMockFunction();
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'missing',
                methodName: 'missing',
                args: [],
            }, respondMock);
            chai_1.expect(respondMock.calls.length).to.equal(1);
            chai_1.expect(respondMock.calls[0].args).to.deep.equal([{
                    id: 1,
                    error: 'no such class',
                }]);
        }));
        it('should respond with an error if the method is missing', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = server_1.createRpcServer({ socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'Class',
                methodName: 'missing',
                args: [],
            }, respondMock);
            chai_1.expect(respondMock.calls.length).to.equal(1);
            chai_1.expect(respondMock.calls[0].args).to.deep.equal([{
                    id: 1,
                    error: 'no such method',
                }]);
        }));
        it('should respond with the value of the method', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = server_1.createRpcServer({ socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() {
                    return 'returnValue';
                }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'Class',
                methodName: 'method',
                args: [],
            }, respondMock);
            chai_1.expect(respondMock.calls.length).to.equal(1);
            chai_1.expect(respondMock.calls[0].args).to.deep.equal([{
                    id: 1,
                    value: 'returnValue',
                }]);
        }));
        it('should respond with unkown error when the method thows', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = server_1.createRpcServer({ socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() {
                    throw 'error';
                }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'Class',
                methodName: 'method',
                args: [],
            }, respondMock);
            chai_1.expect(respondMock.calls.length).to.equal(1);
            chai_1.expect(respondMock.calls[0].args).to.deep.equal([{
                    id: 1,
                    error: 'Unkown Error',
                }]);
        }));
        it('should respond with the client error thrown by the method', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = server_1.createRpcServer({ socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method() {
                    throw server_1.clientError('other error');
                }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'Class',
                methodName: 'method',
                args: [],
            }, respondMock);
            chai_1.expect(respondMock.calls.length).to.equal(1);
            chai_1.expect(respondMock.calls[0].args).to.deep.equal([{
                    id: 1,
                    error: 'other error',
                }]);
        }));
        it('should call the method with provided args', () => __awaiter(this, void 0, Promise, function* () {
            const socket = socket_1.createMockSocket();
            const remoteProcedures = server_1.createRpcServer({ socket }).remoteProcedures;
            const respondMock = function_1.createMockFunction();
            const method = function_1.createMockFunction();
            // TODO: TS doesn't seem to compile to a class with name ??
            let Class = class {
                method(...args) {
                    method(args);
                }
            };
            Class = __decorate([
                remoteProcedures({ name: 'Class' }), 
                __metadata('design:paramtypes', [])
            ], Class);
            yield socket.protocols['rpc'].onmessage({
                id: 1,
                className: 'Class',
                methodName: 'method',
                args: [1, 2, 3],
            }, respondMock);
            chai_1.expect(method.calls.length).to.equal(1);
            chai_1.expect(method.calls[0].args).to.deep.equal([[1, 2, 3]]);
        }));
    });
});
