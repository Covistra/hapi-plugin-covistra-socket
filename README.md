# Covistra Socket Plugin

The socket plugin exposes and manages the underlying Socket.IO instance to rest of the system.

# SocketManager

The SocketManager is a service used to manage socket client connections. Each time a new WebSocket is opened
to a client device, a new client entry will be added. This client entry encapsulate the socket, but also additional
information about the client (credentials, deviceInfo, etc). Any component of the system can send information to one or
more devices by using the provided client instances.


## Using the SocketManager

You access the socketManager instance from the plugin like this:

```
var socketManager = server.plugins['covistra-socket'].socketManager;
```

The socketManager expose a few useful methods, but as you build your system, you most likely want to extend the communication
protocol by registering globalHandlers. Each global handler is responsible for handling a specific message. Plugins register
all their handlers when they are initialized, the socketManager make sure that any existing or new client get connected to
the new handler automatically.

```
var socketManager = server.plugins['covistra-socket'].socketManager;

socketManager.registerGlobalHandler('my-specific-message', function(msg) {

    // msg.data : Contains the payload
    // msg.ack : callback to return the response (optional)
    // msg.context: general infos about the connection (like access to the client instance)

    return msg.ack({
        success: true
    });

}, { scope: myHandlerScope });
```

