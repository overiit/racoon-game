import { setDefaults } from "../utils/Utils";
import type { GameWorld } from "../world/GameWorld";
import type { Entity } from "./Entity";
import type { Tickable } from "./Updatable";

type GameSceneSettings = {
    autoCamera?: boolean;
}
export default class GameScene implements Tickable {
    
    gameWorld: GameWorld;
    
    entities: Entity[]=[]

    constructor (public readonly name: string, public settings?: GameSceneSettings) {
        this.settings = setDefaults<GameSceneSettings>(settings, {
            autoCamera: true,
        });
    }
    async init () {}
    
    tick (elapsedTime: number, delta: number) {
        if (this.gameWorld) {
            this.gameWorld.tick(elapsedTime, delta);
        } 
        for (const entity of this.entities) {
            entity.tick(elapsedTime, delta);
        }
    }

    async dispose () {}
}
