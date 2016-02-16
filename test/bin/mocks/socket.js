"use strict";
function createMockSocket() {
    return {
        protocols: {},
        registerProtocol(name, protocol) {
            this.protocols[name] = protocol;
        },
    };
}
exports.createMockSocket = createMockSocket;
