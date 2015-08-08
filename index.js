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
    server.log(['plugin', 'info'], "Registering the Socket plugin");

    var io = SocketIO.listen(server.listener);

    io.sockets.on('connection', function(socket) {
        server.log(['plugin', 'socket', 'debug'], "Client is connected on our socket");

        socket.on('open-channels', function(channels) {
            _.each(channels, function(channel) {
                server.log(['plugin', 'socket', 'trace'], "Joining channel:"+channel);
                socket.join(channel);
            });
        });
    });

    server.expose('sendTo', function(username, key, payload) {
        server.log(['plugin', 'socket', 'debug'], "Send message to all open devices for user "+username);
        io.sockets.to(username).emit(key, payload);
    });

    server.expose('broadcast', function(channel, key, payload) {
        if(arguments.length == 2) {
            payload = key;
            key = channel;
            channel = undefined;
        }

        server.log(['plugin', 'socket', 'trace'], "Broadcasting message "+key);

        if(channel) {
            server.log(['plugin', 'socket', 'debug'], "Broadcasting to channel:"+channel);
            io.sockets.to(channel).emit(key, payload);
        }
        else {
            server.log(['plugin', 'socket', 'debug'], "Broadcasting to all connected devices");
            io.sockets.emit(key, payload);
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
