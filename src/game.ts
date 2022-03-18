import { switchScene } from "./engine/SceneManager";
import LoadingScene from "./scenes/LoadingScene";

export const initGame = () => {
    const loadingScene = new LoadingScene();
    switchScene(loadingScene);
}