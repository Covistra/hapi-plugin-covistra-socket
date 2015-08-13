/**

 Copyright 2015 Covistra Technologies Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var SocketIO = require('socket.io'),
    _ = require('lodash');

"use strict";

exports.register = function (server, options, next) {

    var log = server.plugins['covistra-system'].systemLog;
    var config = server.plugins['hapi-config'].CurrentConfiguration;

    log.info("Registering the socket plugin", server.select('api').listener);

    var io = SocketIO(server.select('api').listener);

    log.debug("Socket.IO instance has been successfully created");

    var socketManager = require('./lib/socket-manager')(server, io, log.child({service: 'socket-manager'}), config);

    io.on('connection', function(socket) {
        server.log(['plugin', 'socket', 'debug'], "Client is connected on our socket");
        socketManager.clientConnected(socket);
    });

    server.expose('socketManager', socketManager);

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
