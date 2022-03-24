import type { Vector2, Vector3 } from "three";
import type WorldChunk from "./WorldChunk";
import WorldEnvironment, { ChunkCoordinates, WorldOptions } from './WorldEnvironment';

type RandChunkWorldOptions = {
    seed: number
};;


export default class RandChunkWorld extends WorldEnvironment {

    // generatedChunks: Record<ChunkCoordinates, WorldChunk> = {};

    constructor (
        public readonly possibleChunks: WorldChunk[],
        public options: RandChunkWorldOptions & WorldOptions
    ) {
        super(options);
        if (possibleChunks.length === 0) {
            throw new Error("possibleChunks must not be empty");
        }
    }

    private getOrGenerateChunkBySeedAndPosition (position: Vector2): WorldChunk {
        const seed = this.options.seed;
        const x = position.x;
        const y = position.y;
        
        let positionKey = this.getChunkPositionKey(position);
        let chunk = this.chunks[positionKey];
        if (chunk) {
            return chunk;
        }
        

        const result = seed * (Math.abs(x)|| seed) * (Math.abs(y) || seed);

        const index = Math.floor(Math.abs(result % this.possibleChunks.length));
        
        const newChunk = this.possibleChunks[index].clone();

        // update mesh position
        const playerPosition = this.chunkPosToPlayerPos(position);
        newChunk.mesh.position.set(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        )
        
        /** 
         * dont need to update body position because when it gets added 
         * it uses the mesh poisition and this chunk is not added to the world yet
         */
        this.setChunk(position, newChunk);
        return newChunk;
    }

    getChunk(position: Vector2): WorldChunk {
        const chunk = this.getOrGenerateChunkBySeedAndPosition(position);
        return chunk;
    };
    
    reloadChunks (playerPosition: Vector3, chunkDistance?: number) {
        // TODO : only remove generatedChunks that are not going to be used anymore
        // for now clear generatedChunks
        // this.generatedChunks = {};

        super.reloadChunks(playerPosition, chunkDistance);
    };
    
}