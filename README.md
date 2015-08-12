# Covistra Socket Plugin

The socket plugin exposes and manages the underlying Socket.IO instance to rest of the system.

# SocketManager

The SocketManager is a service used to manage socket client connections. Each time a new WebSocket is opened
to a client device, a new client entry will be added. This client entry encapsulate the socket, but also additional
information about the client (credentials, deviceInfo, etc). Any component of the system can send information to one or
more devices by using the provided client instances.
