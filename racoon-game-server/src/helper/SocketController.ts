import WebSocket from "ws";

type SocketMessage = {
  event: string;
  data: any;
};

type CallbackFunction = (data: any, socket: WebSocket) => any;

type EventHandlers = {
  [key: string]: CallbackFunction[];
};

export class SocketController {
  websocketServer: WebSocket.Server;
  previousSocketId: number = 0;

  clients: { [key: number]: WebSocket } = {};

  eventHandlers: EventHandlers = {};

  constructor() {
    this.websocketServer = new WebSocket.Server({
      // noServer: true,
      path: "/",
      port: 3001,
    });
    this.init();
  }

  init() {
    this.websocketServer.on("upgrade", (parent: any) => {
      console.log("upgrade");
      // websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      //   websocketServer.emit("connection", websocket, request);
      // });
    });

    this.websocketServer.on("close", (...args) => {
      console.log("close");
    });

    this.websocketServer.on("connection", (socket) => {
      // todo: make socket id authentication
      const socketId = this.previousSocketId++;
      this.clients[socketId] = socket;

      socket.on("message", (message: WebSocket.RawData) => {
        let data: any = null;
        try {
          data = JSON.parse(message.toString());
        } catch (err) {}
        if (data && data.event) {
          this.handleEvent(socket, data.event, data.data);
        } else {
          socket.send(JSON.stringify({ err: "invalid message structure", input: data}));
        }
      });
    });
  }

  handleEvent(socket: WebSocket, event: string, data: any) {
    const callbacks = this.eventHandlers[event];
    if (callbacks && callbacks.length) {
      callbacks.forEach(callback => {
        callback(data, socket);
      });
    } else {
      console.log("no handler for event", event);
    }
  }

  on = (event: string, callback: CallbackFunction) => {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  };

  broadcast = (event: string, data: any) => {
    const message: SocketMessage = {
      event,
      data,
    };
    this.websocketServer.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  };

  emit = (socket: WebSocket, event: string, data: any) => {
    const message: SocketMessage = {
      event,
      data,
    };
    socket.send(JSON.stringify(message));
  };
}
