'use strict'

import {expect} from 'chai'
import {clientError, createRpcServer} from 'redux-websocket/lib/rpc/server'
import {createMockFunction} from '../../mocks/function'
import {createMockSocket} from '../../mocks/socket'

describe('rpc', () => {
  describe('server', () => {
    it('should register a protocol id if passed', () => {
      const socket = createMockSocket()

      createRpcServer({socket, id: 'test'})

      expect(socket.protocols['rpc']).to.be.undefined
      expect(socket.protocols['rpctest']).to.exist
    })

    it('should respond with an error if the class is missing', async () => {
      const socket = createMockSocket()
      createRpcServer({socket})
      const respondMock = createMockFunction();

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'missing',
        methodName: 'missing',
        args: [],
      }, respondMock)

      expect(respondMock.calls.length).to.equal(1)
      expect(respondMock.calls[0].args).to.deep.equal([{
        id: 1,
        error: 'no such class',
      }])
    })

    it('should respond with an error if the method is missing', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcServer({socket}).remoteProcedures
      const respondMock = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {}

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'Class',
        methodName: 'missing',
        args: [],
      }, respondMock)

      expect(respondMock.calls.length).to.equal(1)
      expect(respondMock.calls[0].args).to.deep.equal([{
        id: 1,
        error: 'no such method',
      }])
    })

    it('should respond with the value of the method', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcServer({socket}).remoteProcedures
      const respondMock = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method() {
          return 'returnValue';
        }
      }

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'Class',
        methodName: 'method',
        args: [],
      }, respondMock)

      expect(respondMock.calls.length).to.equal(1)
      expect(respondMock.calls[0].args).to.deep.equal([{
        id: 1,
        value: 'returnValue',
      }])
    })

    it('should respond with unkown error when the method thows', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcServer({socket}).remoteProcedures
      const respondMock = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method() {
          throw 'error';
        }
      }

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'Class',
        methodName: 'method',
        args: [],
      }, respondMock)

      expect(respondMock.calls.length).to.equal(1)
      expect(respondMock.calls[0].args).to.deep.equal([{
        id: 1,
        error: 'Unkown Error',
      }])
    })

    it('should respond with the client error thrown by the method', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcServer({socket}).remoteProcedures
      const respondMock = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method() {
          throw clientError('other error');
        }
      }

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'Class',
        methodName: 'method',
        args: [],
      }, respondMock)

      expect(respondMock.calls.length).to.equal(1)
      expect(respondMock.calls[0].args).to.deep.equal([{
        id: 1,
        error: 'other error',
      }])
    })

    it('should call the method with provided args', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcServer({socket}).remoteProcedures
      const respondMock = createMockFunction()
      const method = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method(...args) {
          method(args)
        }
      }

      await socket.protocols['rpc'].onmessage({
        id: 1,
        className: 'Class',
        methodName: 'method',
        args: [1, 2, 3],
      }, respondMock)

      expect(method.calls.length).to.equal(1)
      expect(method.calls[0].args).to.deep.equal([[1, 2, 3]])
    })
  })
})
