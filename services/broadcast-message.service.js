var Joi = require('joi'),
    _ = require('lodash'),
    P = require('bluebird');

module.exports = function(server, config, log) {
    "use strict";

    var socketManager = server.plugins['covistra-socket'].socketManager;

    function service(msg) {

        if(msg.clientFilter.group) {
            // Groups uses the room concept in socket.io for better portability. They should be used as much as possible!
            var room = io.sockets.to(msg.clientFilter.group);
            var emit = P.promisify(room.emit, {context: room});
            return emit(msg.key, msg.payload);
        }
        else {
            // Filter clients
            var clients = _.filter(_.values(socketManager.clients), function(client) {

                if(msg.clientFilter.username) {
                    return _.get(client, "credentials.username") === msg.clientFilter.username;
                }

                return true;
            });

            return P.map(clients, function(client) {
                return client.emit(msg.key, msg.payload).then(function(result){
                    return {
                        clientId: client.id,
                        result:result
                    };
                });
            });
        }

    }

    return {
        pattern: { cmp: 'socket', tar: 'message', act: 'broadcast'},
        schema: Joi.object().keys({
            key: Joi.string(),
            payload: Joi.any(),
            clientFilter: Joi.object().keys({
                group: Joi.string(),
                username: Joi.string(),
                app: Joi.string().description('Not supported yet'),
                deviceInfo: Joi.object().keys({
                    platform: Joi.string(),
                    version: Joi.string()
                }).description('Not supported yet'),
                geo: Joi.object().keys({
                    distance: Joi.number(),
                    latitude: Joi.number(),
                    longitude: Joi.number()
                }).description('Not supported yet')
            })
        }),
        callback: service
    }
};