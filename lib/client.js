var P = require('bluebird');

module.exports = function(server, io, log, config) {
    'use strict';

    function _noop() {}

    function Client(socket, socketManager) {
        this.id = socket.id;
        this.socket = socket;
        this.reconnected = 0;

        socketManager.on(['client', this.id, 'connected'], () => {
            this.socket.emit('client-connected', {
                id: this.id,
                ts: Date.now()
            });
        });

        socketManager.on(['client', this.id, 'disconnected'], () => {
            this.socket.emit('client-disconnected', {
                id: this.id,
                ts: Date.now()
            });
        });

    }

    Client.prototype.join = function(groups) {
        var _this = this;
        var join = P.promisify(this.socket.join, {context: this});
        return P.map(groups, function(group) {
            log.debug("Client %s is joining group %s", _this.id, group);
            return join(group);
        });
    };

    Client.prototype.leave = function(groups) {
        var _this = this;
        var leave = P.promisify(this.socket.leave, {context: this});
        return P.map(groups, function(group) {
            log.debug("Client %s is leaving group %s", _this.id, group);
            return leaving(group);
        });
    };


    Client.prototype.setCredentials = function(creds) {
        this.credentials = creds;
    };

    Client.prototype.setDeviceInfo = function(deviceInfo) {
        this.deviceInfo = deviceInfo;
    };

    Client.prototype.emit = function(event, payload) {
        return new P((resolve, reject) => {
            this.socket.emit(event, payload, function(err,data) {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    };

    Client.prototype.on = function(event, handler) {
        this.socket.on(event, handler);
    };

    Client.prototype.addHandler = function(handlerSpec) {
        var _this = this;
        this.socket.on(handlerSpec.key, function(event, ack) {
            log.debug("Received event. Executing handler...", event);

            // We wrap the received event to share our client context with handlers
            handlerSpec.handler.bind(handlerSpec.scope || _this)({
                data:event,
                ack:ack || _noop,
                context: {
                    client: _this
                }
            });

        });
    };

    return Client;
};
