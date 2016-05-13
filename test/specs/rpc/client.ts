'use strict'

import {expect} from 'chai'
import {timeoutSymbol} from 'redux-websocket/lib/rpc'
import {createRpcClient} from 'redux-websocket/lib/rpc/client'
import {createMockFunction, trackCalls} from 'mock-functions'
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

      createRpcClient({socket, id: 'test', rpcObjects: []})

      expect(socket.protocols['rpc']).to.be.undefined
      expect(socket.protocols['rpctest']).to.exist
    })

    it('should send the correct class name, method name and arguments', async () => {
      const object = new class Class {
        method(...args) {}
      }

      const socket = createMockSocket()
      createRpcClient({socket, rpcObjects: [object]})
      const protocol = socket.protocols['rpc']
      const sendMock = protocol.send = trackCalls(respond(protocol))

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
      const object = new class Class {
        method() {}
      }

      const socket = createMockSocket()
      createRpcClient({socket, rpcObjects: [object]})
      const protocol = socket.protocols['rpc']
      protocol.send = trackCalls(respond(protocol, {value: 'server'}))

      return expect(object.method()).to.eventually.become('server')
    })

    it('should reject with the error of the RPC', async () => {
      const object = new class Class {
        method() {}
      }

      const socket = createMockSocket()
      createRpcClient({socket, rpcObjects: [object]})
      const protocol = socket.protocols['rpc']
      protocol.send = trackCalls(respond(protocol, {error: 'server'}))

      return expect(object.method()).to.eventually.be.rejectedWith('server')
    })

    it('should timeout if no response is given', async () => {
      class Class {
        method() {}
      }
      Class[timeoutSymbol] = 1

      const object = new Class()

      const socket = createMockSocket()
      createRpcClient({socket, rpcObjects: [object]})
      const protocol = socket.protocols['rpc']
      protocol.send = createMockFunction()

      // @remoteProcedures({name: 'Class', timeout: 1})

      return expect(object.method()).to.eventually.be.rejectedWith('timeout reached')
    })
  })
})
