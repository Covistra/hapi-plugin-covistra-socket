var Boom = require('boom');

module.exports = function(server, config, log) {
    "use strict";

    var socketManager = server.plugins['covistra-socket'].socketManager;

    function service(msg) {
        var id = _.get(msg, "data.id") || _.get(msg, "socket$.context.client.id");
        log.debug("Removing client %s from group(s)", id, msg.data.groups);
        var client = socketManager.getClientForId(id);
        if(client) {
            return client.leave(msg.data.groups);
        }
        else {
            log.error("Client %s wasn't registered", id);
            throw Boom.notFound();
        }
    }

    return {
        pattern: { cmp: 'socket', tar: 'client', act: 'remove-from-group'},
        event: 'remove-from-group',
        callback: service
    }
};
