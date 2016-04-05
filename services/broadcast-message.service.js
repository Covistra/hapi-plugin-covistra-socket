var Joi = require('joi'),
    _ = require('lodash'),
    P = require('bluebird');

module.exports = function(server, config, log) {
    "use strict";

    var socketManager = server.plugins['covistra-socket'].socketManager;

    function service(msg) {

        // Filter clients
        var clients = _.filter(_.values(socketManager.clients), function(client) {
            var include = true;

            if(msg.clientFilter.group) {
                include = _.contains(client.groups || [], msg.clientFilter.group);
            }

            if(msg.clientFilter.username) {
                include &= _.get(client, "credentials.username") === msg.clientFilter.username;
            }

            return include;
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

    return {
        pattern: { cmp: 'socket', tar: 'message', act: 'broadcast'},
        schema: Joi.object().keys({
            key: Joi.string(),
            payload: Joi.any(),
            clientFilter: Joi.object().keys({
                group: Joi.string(),
                username: Joi.string(),
                app: Joi.string(),
                deviceInfo: Joi.object().keys({
                    platform: Joi.string(),
                    version: Joi.string()
                }),
                geo: Joi.object().keys({
                    distance: Joi.number(),
                    latitude: Joi.number(),
                    longitude: Joi.number()
                })
            })
        }),
        callback: service
    }
};