import { Body, Vec3 } from "cannon-es";
import { Group, Object3D } from "three";
import { CharacterSpawnPoint } from "../character/SpawnPoint";
import { CameraController } from "../controller/CameraController";
import { InputController } from "../controller/InputController";
import { canvasElement, scene, world } from "../engine/engine";
import type { Entity } from "../interfaces/Entity";
import type { Tickable } from "../interfaces/Updatable";
import CannonUtils from "../utils/CannonUtils";
import { GroupToMeshes, Vector3ToVec3 } from "../utils/Convert";
import { setDefaults } from "../utils/Utils";

export type GameWorldOptions = {}

export class GameWorld {

    inputController: InputController = new InputController(this, canvasElement);
    cameraController: CameraController = new CameraController(this);
    mainSpawnPoint: CharacterSpawnPoint;
    
    physicsFrameRate: number = 60;

    tickables: Tickable[]=[];

    constructor (
        public name: string,
        public world: Group,
        public worldBody?: Body,
        public options?: GameWorldOptions
    ) {
        setDefaults<GameWorldOptions>(options, {});
        
        if (!worldBody) {
            this.makeWorldBody();
        }
        this.fixBodyToWorld();
        this.inputController.setInputReceiver(this.cameraController);
        this.inputController.setPointerLock(true);
        this.tickables.push(this.inputController);
        this.tickables.push(this.cameraController);
    }

    makeWorldBody () {
        this.worldBody = new Body({ mass: 0 });
        const meshes = GroupToMeshes(this.world.clone());
        for (const mesh of meshes) {
            const shape = CannonUtils.CreateTrimesh(mesh.geometry, Vector3ToVec3(mesh.position));
            this.worldBody.addShape(shape);
        }
    }

    fixBodyToWorld () {
        this.worldBody.position.set(...this.world.position.toArray());
        this.worldBody.quaternion.set(this.world.quaternion.x, this.world.quaternion.y, this.world.quaternion.z, this.world.quaternion.w);
        this.worldBody.updateMassProperties();
        this.worldBody.updateBoundingRadius();
        this.worldBody.updateAABB();

        // rotate 90 degrees on x
        // this.worldBody.quaternion.setFromAxisAngle(new Vec3(4, 0, 0), Math.PI / 2);
    }

    loadWorld () {
        console.log(`GameWorld: Loaded ${this.name}`);
        scene.add(this.world);
        this.worldBody.position.set(0, 0, 0);
        world.addBody(this.worldBody);

        // load character spawnPoint
        const spawnPoint = new Object3D();
        spawnPoint.position.set(0, 10, 0)
        this.mainSpawnPoint = new CharacterSpawnPoint(spawnPoint);
        this.mainSpawnPoint.spawn();
    }

    addEntity (entity: Entity) {
        this.tickables.push(entity);
    }
    removeEntity (entity: Entity) {
        entity.destroy();
        this.tickables.splice(this.tickables.indexOf(entity), 1);
    }

    tick = (elapsedTime: number, delta: number) => {
        // this.inputController.tick();
        for (const tickable of this.tickables) {
            tickable.tick(elapsedTime, delta);
        }
    }

    unloadWorld () {
        console.log(`GameWorld: Unloaded ${this.name}`);
        scene.remove(this.world);
        world.removeBody(this.worldBody);
    }
}