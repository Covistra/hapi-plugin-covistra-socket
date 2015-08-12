

module.exports = function(server, io, log, config) {

    function Client(socket, socketManager) {
        this.id = socket.id;
        this.socket = socket;
        this.reconnected = 0;
    }

    Client.prototype.setCredentials = function(creds) {
        this.credentials = creds;
    };

    Client.prototype.setDeviceInfo = function(deviceInfo) {
        this.deviceInfo = deviceInfo;
    };

    Client.prototype.emit = function(event, payload) {
        this.socket.emit(event, payload);
        //TODO: Handle completion through promise
    };

    Client.prototype.on = function(event, handler) {
        this.socket.on(event, handler);
    };

    Client.prototype.addHandler = function(handlerSpec) {
        this.socket.on(handlerSpec.key, handlerSpec.handler.bind(handlerSpec.scope));
    };

    return Client;
};
