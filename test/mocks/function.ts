'use strict'

interface TrackingFunction {
  (...args): any
  calls: Array<{context: any, args: any[]}>
}

interface MockFunction extends TrackingFunction {
  returns(returnValue): this
  returns(args: any[], returnValue): this
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
  const returnValues = []

  const mock = trackCalls(() => {
    const toReturn = returnValues.find(returnValue =>
      arguments.length === returnValue.args.length &&
      returnValue.args.every((arg, index) => arg === arguments[index])
    ) || defaultReturnValue

    return toReturn && toReturn.returnValue
  }) as MockFunction

  mock.returns = function (args, returnValue) {
    if (arguments.length === 1) {
      defaultReturnValue = {returnValue: args}
    } else {
      returnValues.push({
        args: args,
        returnValue: returnValue,
      })
    }

    return mock
  } as any

  return mock
}
