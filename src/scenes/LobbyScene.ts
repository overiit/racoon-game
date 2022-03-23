import { Body, Box, Vec3 } from "cannon-es";
import { loadGLTF } from "../helper/ModelLoader";
import { addTestLight } from "../helper/Testing";
import GameScene from "../interfaces/GameScene";
import CannonUtils from "../utils/CannonUtils";
import { ModelSources } from "../utils/sources";
import { GameWorld } from "../world/GameWorld";

export class LobbyScene extends GameScene {

    constructor() {
        super("LobbyScene", {
            autoCamera: true
        });
    }

    async init() {
        await super.init()
        // Testing for now
        addTestLight();

        // initialize world
        const worldMesh = await loadGLTF(ModelSources.test_world.modelPath, { castShadow: true });
        // const worldPhysicsMesh = await loadGLTF(ModelSources.test_world.physicsMeshPath, { castShadow: false });
        this.gameWorld = new GameWorld("Lobby", worldMesh.scene, );
        this.gameWorld.loadWorld();
    }
    
    tick(elapsedTime: number, delta: number): void {
        super.tick(elapsedTime, delta);
        // console.log("LobbyScene tick");
    }

}