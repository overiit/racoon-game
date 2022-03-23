import { Body, Vec3 } from "cannon-es";
import { Mesh, MeshStandardMaterial, PlaneGeometry, Vector2, Vector3 } from "three";
import { gui, scene, world } from "../../engine/engine";
import EventEmitter from "../../utils/EventEmitter";
import type WorldChunk from "./WorldChunk";

export enum ChunkType {
    CITY,
    PARK,
    FOREST,
    MOUNTAIN,
    ROAD
}

export type WorldOptions = {
    chunkSize: number;
}

export type ChunkCoordinates = `${number},${number}`;

export default class WorldEnvironment extends EventEmitter {
    
    chunks: Record<ChunkCoordinates, WorldChunk> = {};
    worldMesh: Mesh = new Mesh();
    worldBody: Body = new Body({ mass: 0 });

    constructor (public options: WorldOptions) {
        super();
    }

    getChunkPositionKey (position: Vector2): ChunkCoordinates {
        return `${position.x},${position.y}`;
    }

    setChunk (position: Vector2, chunk: WorldChunk) {
        const key = this.getChunkPositionKey(position);
        chunk.mesh.name = `Chunk ${key}`;
        this.chunks[key] = chunk;
    }

    getChunk (position: Vector2): WorldChunk | undefined {
        const key = this.getChunkPositionKey(position);
        return this.chunks[key];
    }

    reloadChunks (playerPosition: Vector3, chunkDistance: number=1) {
        // TODO : only remove chunks and bodies that are not going to be used anymore
        // for now clear world
        // 
        this.worldMesh.clear();
        while (this.worldBody.shapes.length > 0) {
            this.worldBody.removeShape(this.worldBody.shapes[0]);
        }

        
        const playerChunkPosition = this.playerPosToChunkPos(playerPosition);

        // get all chunks around me (+ 1)
        // for now just loop through all chunks next to me
        for (let x = -chunkDistance; x<(1 + chunkDistance); x++) {
            for (let z = -chunkDistance; z<(1 + chunkDistance); z++) {
                const newChunkPos = new Vector2(playerChunkPosition.x + x, playerChunkPosition.y + z);

                const chunk = this.getChunk(newChunkPos);
                if (chunk) {
                    if (!scene.children.includes(chunk.mesh)) {
                        this.worldMesh.add(chunk.mesh);
                        if (chunk.body) {
                            chunk.body.position.set(...chunk.mesh.position.toArray())
                            // copy rotation, add 90 degrees to z                            
                            chunk.body.quaternion.set(chunk.mesh.quaternion.x, chunk.mesh.quaternion.y, chunk.mesh.quaternion.z, chunk.mesh.quaternion.w);

                            // rotate 90 degrees on z
                            chunk.body.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 2);

                            world.addBody(chunk.body);
                        }
                    }
                    // TODO : Do I have to reload the mesh or body to apply changes?
                }
            }
        }
    }

    chunkPosToPlayerPos (position: Vector2) {
        const chunkSize = this.options.chunkSize;
        return new Vector3(
            position.x * chunkSize,
            0,
            position.y * chunkSize
        );
    }

    playerPosToChunkPos (position: Vector3) {

        const chunkSize = this.options.chunkSize;
        const playerX = position.x;
        const playerZ = position.z;

        let worldX= Math.ceil(position.x / chunkSize);
        let worldY = Math.ceil(position.z / chunkSize);
        if (playerX < 0)  worldX = Math.floor(position.x / chunkSize);
        if (playerZ < 0) worldY = Math.floor(position.z / chunkSize);
        
        return new Vector2(worldX, worldY);
    }

    addToEngine () {
        scene.add(this.worldMesh);
        this.worldBody.position.set(0, 0, 0);
        world.addBody(this.worldBody);
    }

    removeFromEngine () {
        scene.remove(this.worldMesh);
        world.removeBody(this.worldBody);
    }
    
}