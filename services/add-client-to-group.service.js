var Joi = require('joi'),
    _ = require('lodash'),
    Boom = require('boom'),
    P = require('bluebird');

module.exports = function(server, config, log) {
    "use strict";

    var socketManager = server.plugins['covistra-socket'].socketManager;

    function service(msg) {
        msg.id = msg.id || _.get(msg, "socket$.id");

        log.debug("Assigning client %s to group(s)", msg.id, msg.groups);
        var client = socketManager.getClientForId(msg.id);
        if(client) {
            client.groups = client.groups.concat(msg.groups);
            return {
                success: true
            }
        }
        else {
            log.error("Client %s wasn't registered", msg.id);
            throw Boom.notFound();
        }
    }

    return {
        pattern: { cmp: 'socket', tar: 'client', act: 'add-to-group'},
        event: 'add-client-to-group',
        schema: Joi.object().keys({
            id: Joi.string(),
            groups: Joi.array()
        }),
        callback: service
    }
};
