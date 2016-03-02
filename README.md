#redux-websocket
[![Build Status](https://travis-ci.org/Pajn/redux-websocket.svg?branch=master)](https://travis-ci.org/Pajn/redux-websocket)

This module provides communication over a WebSocket between the server and clients in a
fullstack Redux application.

It consists of three different concepts. While they are intended to be used together they
are all self standing and can be used in any combination you like and you can even plugin
in your own or replace the bundled ones.

### Action delivery
Actions can be declared to be sent over the WebSocket using meta information.
This makes it possible to communicate using normal Redux actions and as the information
as stored in a separate object an application can even be retrofitted to dispatch actions
over the network.

### Remote Procedure Calls
Function calls from the client to the server is used as action creators in cases where the
server need to do validations or similar things that the client can not be trusted with.
These are configured using decorators which makes them as easy to both write and call as
any other function.

### State synchronization
If you simply want same of the state exactly the same on the server and the client a store
enhancer can be configured to automatically dispatch diffs to the client when the server state
changes. It also keeps track of versions so that a client get the newest state when it connects.

## Usage
Set up a server by instantiating `WebSocketServer` from `redux-websocket/lib/server`.
Set up a client by instantiating `WebSocketClient` from `redux-websocket/lib/client`.

### Action delivery
Apply `websocketMiddleware` from both `redux-websocket/lib/server` and
`redux-websocket/lib/client` on the corresponding side.

TODO: More description and detail pages

## Authorization
Currently not implemented
