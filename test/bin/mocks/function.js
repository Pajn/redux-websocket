'use strict';
/**
 * Wraps the passed function to track its calls.
 *
 * All calls are stored in an array on a calls property.
 * Every call is an object with a context and args property.
 */
function trackCalls(fn) {
    const calls = [];
    const wrap = function () {
        calls.push({
            args: Array.prototype.slice.call(arguments),
            context: this,
        });
        return fn.apply(this, arguments);
    };
    wrap.calls = calls;
    return wrap;
}
exports.trackCalls = trackCalls;
function createMockFunction() {
    let defaultReturnValue;
    const returnValues = [];
    const mock = trackCalls(() => {
        const toReturn = returnValues.find(returnValue => arguments.length === returnValue.args.length &&
            returnValue.args.every((arg, index) => arg === arguments[index])) || defaultReturnValue;
        return toReturn && toReturn.returnValue;
    });
    mock.returns = function (args, returnValue) {
        if (arguments.length === 1) {
            defaultReturnValue = { returnValue: args };
        }
        else {
            returnValues.push({
                args: args,
                returnValue: returnValue,
            });
        }
        return mock;
    };
    return mock;
}
exports.createMockFunction = createMockFunction;
