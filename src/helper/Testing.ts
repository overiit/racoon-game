import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { camera, renderer, scene } from "../engine/engine";

export const addTestLight = () => {
    const light = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(light);

    const pointingLight = new THREE.DirectionalLight(0xffffff, 0.5);
    pointingLight.lookAt(new Vector3(0, 0, 0));
    pointingLight.position.set(0, 20, 0);
    pointingLight.castShadow = true;
    pointingLight.shadow.mapSize.width = 1024
    pointingLight.shadow.mapSize.height = 1024   
    scene.add(pointingLight);
}

export const addOrbitalControls = () => {
    // OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true
    orbitControls.minDistance = 5
    orbitControls.maxDistance = 25
    orbitControls.enablePan = false
    orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
    orbitControls.update();
}