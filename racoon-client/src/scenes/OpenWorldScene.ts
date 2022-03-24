import { Body, Box, Cylinder, Sphere, Vec3, World } from "cannon-es";
import { BoxBufferGeometry, BoxGeometry, Mesh, MeshPhongMaterial, MeshStandardMaterial, MeshToonMaterial, PlaneGeometry, Vector2, Vector3 } from "three";
import { camera, gui, scene, world } from "../engine/engine";
import GameScene from "../interfaces/GameScene";
import { loadGLTF } from "../helper/ModelLoader";
import PhysicsModel from "../interfaces/PhysicsModel";
import { addTestLight, addOrbitalControls } from "../helper/Testing";
import { GroupToMeshes, Vector3ToVec3 } from "../utils/Convert";
import { ModelSources } from "../utils/sources";
import RandChunkWorld from "../world/chunk/RandChunkWorld";
import WorldChunk from "../world/chunk/WorldChunk"
import WorldEnvironment, { ChunkType } from "../world/chunk/WorldEnvironment";
import CannonUtils from "../utils/CannonUtils";
import { GameWorld } from "../world/GameWorld";

export default class OpenWorldScene extends GameScene {
    constructor() {
        super("OpenWorldScene");
    }

    testChunk: WorldChunk;
    currentWorld: GameWorld;

    renderDistance = 5;


    currentPosition: Vector3 = new Vector3(0, 0, 0);

    async init() {

        addTestLight();

        addOrbitalControls();
        
        const proceduralConfig = {
            chunkSize: 5,
            seed: 133742069,
        };

        // const plane = new BoxGeometry(proceduralConfig.chunkSize, 0.1, proceduralConfig.chunkSize);
        const plane = new BoxBufferGeometry(proceduralConfig.chunkSize, 0.1, proceduralConfig.chunkSize);
        // plane.rotateX(-Math.PI / 2);
        // plane.rotateZ(Math.PI / 25);
        
        this.testChunk = new WorldChunk(new Mesh(plane, new MeshPhongMaterial({ color: 0xFFFFFF })), ChunkType.CITY);

        const racoon = await loadGLTF(ModelSources.racoon_model.modelPath, { castShadow: true });


        console.log(racoon);

        let racoonBody = new Body({ mass: 1, fixedRotation: true, shape: new Cylinder(.5, .5, 2), position: new Vec3(0, 10, 0) });
        racoonBody.addShape(new Sphere(.5), new Vec3(0, 1, 0));
        racoonBody.addShape(new Sphere(.5), new Vec3(0, -1, 0));


        // let racoonBody = new Body({
        //     mass: 1,
        //     fixedRotation: true,
        //     position: new Vec3(0, 10, 0),
        // })

        // const racoonMeshes = GroupToMeshes(racoon.scene);

        // for (let mesh of racoonMeshes) {
        //     racoonBody.addShape(CannonUtils.CreateTrimesh(mesh.geometry));
        // }

        const worldGLTF = await loadGLTF(ModelSources.test_world.modelPath, { castShadow: true });

        // this.addModels(
        //     new PhysicsModel(racoon.scene, racoonBody, Vector3ToVec3(
        //         racoon.scene.position
        //     ))
        // );

        try {
            // this.currentWorld = new RandChunkWorld([
            //     // this.testChunk,
            //     // new WorldChunk(new Mesh(plane, new MeshPhongMaterial({ color: 0xFF00FF })), ChunkType.PARK),
            //     // new WorldChunk(new Mesh(plane, new MeshPhongMaterial({ color: 0x00FF00 })), ChunkType.FOREST),
            //     // new WorldChunk(new Mesh(plane, new MeshPhongMaterial({ color: 0x0000FF })), ChunkType.MOUNTAIN),
            //     // new WorldChunk(new Mesh(plane, new MeshPhongMaterial({ color: 0xFFFF00 })), ChunkType.ROAD),
            //     // new WorldChunk(racoon.scene, ChunkType.CITY)
            // ], proceduralConfig);
            this.currentWorld = new GameWorld(
                "OpenWorld",
                worldGLTF.scene,
                
            )
        } catch (err) {
            console.error(err);
        }
        this.currentWorld.loadWorld();
        // camera.position.set(0, 5, 10);

        gui.add(this.currentPosition, "x", 1, 10, 1);
        gui.add(this.currentPosition, "y", 1, 10, 1);
        gui.add(this.currentPosition, "z", 1, 10, 1);
    }

    tick(elapsedTime: number, delta: number): void {
        super.tick(elapsedTime, delta);
        // this.testChunk.mesh.position.set(0, Math.random(), 0);
        // if (this.currentWorld) {
        //     this.currentWorld.reloadChunks(this.currentPosition, this.renderDistance);
        // } else {
        //     console.log("no world");
        // }
    }
}