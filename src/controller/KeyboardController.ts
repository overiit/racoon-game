export default class KeyboardController {
    
    keysPressed: { [key: string]: boolean } = {};

    constructor () {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    onKeyDown = (event: KeyboardEvent) => {
        this.keysPressed[event.key] = true;
        
    }

    onKeyUp = (event: KeyboardEvent) => {
        this.keysPressed[event.key] = false;
    }

    isKeyPressed = (key: string) => {
        return this.keysPressed[key];
    }

}