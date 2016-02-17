'use strict'

interface TrackingFunction {
  (...args): any
  calls: Array<{context: any, args: any[]}>
}

interface MockFunction extends TrackingFunction {
  returns(returnValue): this
  returns(args: any[], returnValue): this
  returns(callTime: number, returnValue): this
}

/**
 * Wraps the passed function to track its calls.
 *
 * All calls are stored in an array on a calls property.
 * Every call is an object with a context and args property.
 */
export function trackCalls(fn) {
  const calls = []

  const wrap = function() {
    calls.push({
      args: Array.prototype.slice.call(arguments),
      context: this,
    })

    return fn.apply(this, arguments)
  } as TrackingFunction

  wrap.calls = calls

  return wrap
}

export function createMockFunction() {
  let defaultReturnValue
  let calls = 0
  const returnValues = []

  const mock = trackCalls(() => {
    const toReturn = returnValues.find(returnValue =>
      calls === returnValue.calls || (
        returnValue.args &&
        arguments.length === returnValue.args.length &&
        returnValue.args.every((arg, index) => arg === arguments[index])
      )
    ) || defaultReturnValue

    calls++

    return toReturn && toReturn.returnValue
  }) as MockFunction

  mock.returns = function (args, returnValue) {
    if (arguments.length === 1) {
      defaultReturnValue = {returnValue: args}
    } else if (Array.isArray(args)) {
      returnValues.push({
        args: args,
        returnValue: returnValue,
      })
    } else if (typeof args === 'number') {
      returnValues.push({
        calls: args,
        returnValue: returnValue,
      })
    }

    return mock
  } as any

  return mock
}
