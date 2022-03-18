import * as THREE from 'three';
import { initGame } from '../game';
import { getCurrentScene } from './SceneManager';
import * as cannon from 'cannon-es';

// physics
export let world: cannon.World;

// 3d engine
export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer;


export const init = (el: any): void => {
    // physics
    world = new cannon.World();
    world.gravity.set(0, -9.82, 0);

    // 3d engine 
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: el });
    initGame();
    resize();
    render();
    tick();
}

const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
    
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;


    const currentScene = getCurrentScene();
    if (currentScene) {
        currentScene.tick();
    }
    
    // physics
    world.step(1 / 60, deltaTime, 3)
    
    render();
    // request next tick
    requestAnimationFrame(tick);
}

const render = () => {
    renderer.render(scene, camera);
};

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const resize = () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
}
window.addEventListener('resize', resize);