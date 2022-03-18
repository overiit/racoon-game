import { camera, scene } from "../engine/engine";
import GameScene from "../helper/GameScene";
import * as THREE from "three";

export default class LoadingScene extends GameScene {
    
    constructor() {
        super("LoadingScene");
    }

    init() {
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);

        // create a cube and add to scene
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geo, mat);
        
        scene.add(mesh);
        
        camera.position.set(0, 2, 5);
    }

    tick () {
        
    }
}