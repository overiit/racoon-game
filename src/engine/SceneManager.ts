import type GameScene from "../helper/GameScene";
import { camera, scene } from "./engine";

let currentScene: GameScene = null;

export const switchScene = (gameScene: GameScene) => {
    if (currentScene) {
        currentScene.dispose();
    }

    // clean up scene
    scene.clear();

    currentScene = gameScene;

    currentScene.init();

    // add camera to scene
    scene.add(camera)
}

export const getCurrentScene = () => {
    return currentScene;
}