import type GameScene from "../interfaces/GameScene";
import { camera, scene, world } from "./engine";

let currentScene: GameScene = null;

export const switchScene = async (gameScene: GameScene) => {
    if (currentScene) {
        await currentScene.dispose();
    }

    // clean up scene
    scene.clear();
    
    // remove all bodies from world
    while (world.bodies.length) {
        world.removeBody(world.bodies[0]);
    }

    currentScene = gameScene;

    camera.position.set(0, 0, 0);

    if (gameScene?.settings?.autoCamera) {
        // add camera to scene
        scene.add(camera)
    }
    
    
    await currentScene.init();
}

export const getCurrentScene = () => {
    return currentScene;
}