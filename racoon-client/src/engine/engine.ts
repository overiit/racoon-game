import * as THREE from 'three';
import { initGame } from '../game';
import { getCurrentScene } from './SceneManager';
import * as cannon from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GUI } from 'lil-gui'
import { DEBUG_PHYSICS, DEBUG_THREE } from '../config/constants';

// physics
export let world: cannon.World;

// 3d engine
export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;

export let gui: GUI;

export let canvasElement: HTMLCanvasElement;

let cannonDebugger: { update: () => void };

export const init = (el: any): void => {
    canvasElement = el;
    // physics
    world = new cannon.World();
    world.gravity.set(0, -9.82, 0);

    // 3d engine 
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasElement });
    if (DEBUG_THREE) gui = new GUI();
    if (DEBUG_PHYSICS) cannonDebugger = CannonDebugger(scene, world);
    renderer.shadowMap.enabled = true;
    initGame();
    resize();
    tick();
}

const clock = new THREE.Clock();
let oldElapsedTime = 0;

let requestDelta = 0;
let renderDelta = 0;
let logicDelta = 0;

const tick = () => {
    requestDelta = clock.getDelta();

    // request next tick
    requestAnimationFrame(tick);
    
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;


		let unscaledTimeStep = (requestDelta + renderDelta + logicDelta) ;
		let timeStep = Math.min(unscaledTimeStep, 1 / 30);

    // physics
    world.fixedStep();
    logicDelta = clock.getDelta();

    // scnene changes
    const currentScene = getCurrentScene();
    if (currentScene) {
        currentScene.tick(elapsedTime, deltaTime);
    }
    
    // debugger
    if (cannonDebugger) cannonDebugger.update();

    // render scene
    renderer.render(scene, camera);

    renderDelta = clock.getDelta();
}

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