var Joi = require('joi'),
    _ = require('lodash'),
    Boom = require('boom'),
    P = require('bluebird');

module.exports = function(server, config, log) {
    "use strict";

    var socketManager = server.plugins['covistra-socket'].socketManager;

    function service(msg) {
        var id = _.get(msg, "data.id") || _.get(msg, "socket$.context.client.id");
        log.debug("Assigning client %s to group(s)", id, msg.data.groups);
        var client = socketManager.getClientForId(id);
        if(client) {
            client.groups = client.groups.concat(msg.data.groups);
            return {
                success: true
            }
        }
        else {
            log.error("Client %s wasn't registered", id);
            throw Boom.notFound();
        }
    }

    return {
        pattern: { cmp: 'socket', tar: 'client', act: 'add-to-group'},
        event: 'add-client-to-group',
        callback: service
    }
};
