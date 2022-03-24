export class SocketConnection {

    socket: WebSocket;

    constructor(public endpoint: string) {
        this.socket = new WebSocket(endpoint);

        // onConnected Handler
        this.socket.onopen = () => {
            this.onConnected();
        };
        // onMessage Handler
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onMessage(data);
        }
        // onClose Handler
        this.socket.onclose = (event) => {
            this.onClose();
        };

        // onError Handler
        this.socket.onerror = (error) => {
            console.error("Socket Error: ", error);
        };


        // keepalive
        setInterval(() => {
            this.socket.send("ping");
        }, 5000);
    }
    
    onConnected () {}
    onMessage (data: any) {}
    onClose () {}
    
    sendMessage (data: { [key: string]: any }) {
        this.socket.send(JSON.stringify(data));
    }
}