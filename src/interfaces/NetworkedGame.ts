import type { Vec3 } from "cannon-es";
import { SocketConnection } from "../network/SocketConnection";

type NetworkMessage = {
    type: string;
    data: any;
}

export class NetworkedGame extends SocketConnection {
    
    // entities: NetworkedEntity[]=[]
    constructor (public name: string) {
        super("ws://localhost:8080");
    }

    onConnected(): void {
        
    }

    onMessage(data: NetworkMessage): void {
        // if (data.type === "spawnEntity") {
        //     let eventData: NetworkEntitySpawnEvent = data.data;
        //      
        // }
    }

    // onEntitySpawn(entity: NetworkedEntity): void {}
    // etc...

}