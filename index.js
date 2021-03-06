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
    redis = require('redis'),
    _ = require('lodash');

"use strict";

exports.deps = ['covistra-system'];

exports.register = function (server, options, next) {

    var log = server.plugins['covistra-system'].systemLog;
    var config = server.plugins['hapi-config'].CurrentConfiguration;
    var Services = server.plugins['covistra-system'].Services;

    log.info("Registering the socket plugin on API connection");

    // Check for new api + admin connections and fallback to server directly
    var conn = server.select('api') || server;
    var io = SocketIO(conn.listener);

    if(config.get("plugins:covistra-socket:redis_session")) {
        log.info("Using Redis Session store for shared cluster socket infos");

        // Setting up Redis session management using global redis server
        var socketIORedis = require('socket.io-redis');
        var redisHost = config.get("REDIS_URL");
        var redisPort = config.get("REDIS_PORT");
        var redisPassword = config.get("REDIS_PASSWORD");
        var pub = redis.createClient(redisPort, redisHost, {auth_pass: redisPassword});
        var sub = redis.createClient(redisPort, redisHost, {detect_buffers: true, auth_pass: redisPassword } );
        io.adapter(socketIORedis({pubClient: pub, subClient: sub}));
    }

    log.debug("Socket.IO instance has been successfully created");

    var socketManager = require('./lib/socket-manager')(server, io, log.child({service: 'socket-manager', level: config.get('plugins:socket:log_level')}), config);

    io.on('connection', function(socket) {
        log.debug("Client is connected on socket %s", socket.id);
        socketManager.clientConnected(socket);
    });

    server.expose('socketManager', socketManager);

    Services.discover(__dirname, 'services');

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
