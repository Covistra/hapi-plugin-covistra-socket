var EE = require('eventemitter2').EventEmitter2;
var util = require('util');
var _ = require('lodash');


module.exports = function(server, io, log, cfg) {

    var clock = server.plugins['covistra-system'].clock;
    var Client = require('./client')(server, io, log, cfg);

    // Keep client 10 minutes in our list
    const CLIENT_LOST_THRESHOLD_MS = cfg.get('plugins:socket:client_lost_threshold_ms') || 600000;

    function SocketManager() {
        EE.call(this, { maxListeners: 500, wildcard: true });

        this.clients = {};
        this.globalHandlers = {};
    }

    util.inherits(SocketManager, EE);

    SocketManager.prototype.clientConnected = function(socket) {
        var _this = this;
        log.debug("SocketManager:clientConnected", socket.id);

        var client = this.clients[socket.id];
        if(!client) {
            log.debug("Allocating client instance for socket ", socket.id);
            client = new Client(socket, this);

            // Keep a reference to the
            this.clients[socket.id] = client;

            log.debug("Registering %d global handlers on client %s", _.keys(_this.globalHandlers).length, client.id);

            // Register all global handlers for this client
            _.forOwn(_this.globalHandlers, function(handler) {
                log.debug("Registering global handler %s to client %s", handler.key, client.id);
                client.addHandler(handler);
            });
        }
        else {
            if(client.active) {
                log.warn("Client %s was already marked as connected", client.id);
            }
            else {
                log.info("Reconnecting client %s",client.id);
                client.reconnected++;
            }
        }

        client.active = true;
        client.ts = clock.nowTs();
        this.emit(['client', client.id, 'connected'], client);

        socket.on('auth', function(auth) {
           var client = _this.clients[this.id];
            if(client) {
                client.setCredentials(auth);
                _this.emit(['client', client.id, 'authenticated'], client);
            }
            else {
                log.warn("Received authentication infos from an unknown client", this.id);
            }
        });

        socket.on('assign-device-info', function(deviceInfo){
            var client = _this.clients[this.id];
            if(client) {
                client.setDeviceInfo(deviceInfo);
            }
            else {
                log.warn("Trying to assign device infos to an unknown client %s", this.id);
            }
        });
    };

    SocketManager.prototype.clientDisconnected = function(socket) {
        log.debug("SocketManager:clientDisconnected", socket.id);
        var client = this.clients[socket.id];
        if(client) {
            client.active = false;
            client.reconnected = 0;
            client.disconnectedTs = clock.nowTs();

            // Install a timer to check in a few minutes if the client is still disconnected.
            setTimeout(function() {
                if(!client.status) {
                    delete this.clients[client.id];
                    log.warn("Client %s has been removed from the socket manager. Wasn't seen for the last 10 minutes", client.id);
                    this.emit(['client', client.id, 'removed'], client);
                }
            }.bind(this), CLIENT_LOST_THRESHOLD_MS);

            // Notify any interested components about this client disconnection
            this.emit(['client', client.id, 'disconnected'], client);
        }
        else {
            log.warn("Received a disconnected event for an unknown client %s", socket.id);
        }
    };

    SocketManager.prototype.getClientForToken = function(token) {
      return _.find(_.values(this.clients), function(c){
          return c.credentials && c.credentials.token === token;
      });
    };

    SocketManager.prototype.getClientForUsername = function(username) {
        return _.find(_.values(this.clients), function(c){
            return c.credentials && c.credentials.username === username;
        });
    };

    SocketManager.prototype.getClientForDeviceId = function(deviceId) {
        return _.find(_.values(this.clients), function(c){
            return c.deviceInfo && c.deviceInfo.uuid === deviceId;
        });
    };

    SocketManager.prototype.listClientsForUsername = function(username) {
        return _.filter(_.values(this.clients), function(c){
            return c.credentials && c.credentials.username === username;
        });
    };

    SocketManager.prototype.getClientForId = function(id) {
        return this.clients[id];
    };

    /**
     * Let any component register meaningful message key and handlers for all connected clients. This let plugins
     * define the communication protocol based on their needs.
     *
     * @param key
     * @param handler
     * @param options
     */
    SocketManager.prototype.registerGlobalHandler = function(key, handler, options) {
        log.debug("registerGlobalHandler %s", key);
        options = options || {};

        var newHandler = {
            key: key,
            handler: handler,
            scope: options.scope || this
        };

        // Keep a reference to this new global handler
        this.globalHandlers[key] = newHandler;

        // Add this handler to all connected clients
        log.debug("Auto-registering global handler on %d existing client(s)", _.keys(this.clients).length);
        _.forOwn(this.clients, function(client) {
            client.addHandler(newHandler);
        });

    };

    return new SocketManager();
};
