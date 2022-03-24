import { switchScene } from "./engine/SceneManager";
import { LobbyScene } from "./scenes/LobbyScene";
import OpenWorldScene from "./scenes/OpenWorldScene";

export const initGame = async () => {
    // const openWorldScene = new OpenWorldScene();
    // switchScene(openWorldScene);
    
    const lobby = new LobbyScene();
    switchScene(lobby);

    // game logic goes here
    while (true) {

    }
}