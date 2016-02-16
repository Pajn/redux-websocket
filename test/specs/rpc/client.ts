'use strict'
import {expect} from 'chai'
import {createRpcClient} from 'redux-websocket/lib/rpc/client'
import {createMockFunction, trackCalls} from '../../mocks/function'
import {createMockSocket} from '../../mocks/socket'


import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

function respond(protocol, response?) {
  return message => setTimeout(() => {
    protocol.onmessage(Object.assign({id: message.id}, response || {}))
  })
}


describe('rpc', () => {
  describe('client', () => {
    it('should register a protocol id if passed', () => {
      const socket = createMockSocket()

      createRpcClient({socket, id: 'test'})

      expect(socket.protocols['rpc']).to.be.undefined
      expect(socket.protocols['rpctest']).to.exist
    })

    it('should send the correct class name, method name and arguments', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcClient({socket}).remoteProcedures
      const protocol = socket.protocols['rpc']
      const sendMock = protocol.send = trackCalls(respond(protocol))

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method(...args) {}
      }

      const object = new Class()

      await object.method(1, 2, 3)

      expect(sendMock.calls.length).to.equal(1)
      expect(sendMock.calls[0].args).to.deep.equal([{
        id: 0,
        className: 'Class',
        methodName: 'method',
        args: [1, 2, 3],
      }])
    })

    it('should respond with the value of the RPC', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcClient({socket}).remoteProcedures
      const respondMock = createMockFunction()
      const protocol = socket.protocols['rpc']
      const sendMock = protocol.send = trackCalls(respond(protocol, {value: 'server'}))

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method() {}
      }

      const object = new Class()

      return expect(object.method()).to.eventually.become('server')
    })

    it('should reject with the error of the RPC', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcClient({socket}).remoteProcedures
      const respondMock = createMockFunction()
      const protocol = socket.protocols['rpc']
      const sendMock = protocol.send = trackCalls(respond(protocol, {error: 'server'}))

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class'})
      class Class {
        method() {}
      }

      const object = new Class()

      return expect(object.method()).to.eventually.be.rejectedWith('server')
    })

    it('should timout if no response is given', async () => {
      const socket = createMockSocket()
      const remoteProcedures = createRpcClient({socket}).remoteProcedures
      const respondMock = createMockFunction()
      const protocol = socket.protocols['rpc']
      const sendMock = protocol.send = createMockFunction()

      // TODO: TS doesn't seem to compile to a class with name ??
      @remoteProcedures({name: 'Class', timeout: 1})
      class Class {
        method() {}
      }

      const object = new Class()

      return expect(object.method()).to.eventually.be.rejectedWith('timeout reached')
    })
  })
})
