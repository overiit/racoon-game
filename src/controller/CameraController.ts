import { Ray, RaycastResult } from 'cannon-es';
import { Mesh, Vector3 } from 'three';
import * as THREE from 'three';
import { camera, world } from '../engine/engine';
import type { IInputReceiver } from '../interfaces/InputReceiver';
import { KeyBinding } from '../interfaces/KeyBinding';
import type { Tickable } from '../interfaces/Updatable';
import { Vec3ToVector3, Vector3ToVec3 } from '../utils/Convert';
import { getBack, getRight, getUp } from '../utils/Utils';
import type { GameWorld } from '../world/GameWorld';
import type { CharacterController } from './CharacterController';

export class CameraController implements IInputReceiver, Tickable
{
	public updateOrder: number = 4;

	public world: GameWorld;
	public target: THREE.Vector3;
	public sensitivity: THREE.Vector2;
	public radius: number = 1;
	public theta: number;
	public phi: number;
	public onMouseDownPosition: THREE.Vector2;
	public onMouseDownTheta: any;
	public onMouseDownPhi: any;
	public targetRadius: number = 1;

	public positionalRay: Ray;

	public movementSpeed: number;
	public actions: { [action: string]: KeyBinding };

	public upVelocity: number = 0;
	public forwardVelocity: number = 0;
	public rightVelocity: number = 0;

	public followMode: boolean = true;

	public characterCaller: CharacterController;

	constructor(world: GameWorld, sensitivityX: number = 1, sensitivityY: number = sensitivityX * 0.8)
	{
		this.world = world;
		this.target = new THREE.Vector3();
		this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);

		this.movementSpeed = 0.06;
		this.radius = 3;
		this.theta = 0;
		this.phi = 0;

		this.onMouseDownPosition = new THREE.Vector2();
		this.onMouseDownTheta = this.theta;
		this.onMouseDownPhi = this.phi;

		this.positionalRay = new Ray();

		this.actions = {
			'forward': new KeyBinding('KeyW'),
			'back': new KeyBinding('KeyS'),
			'left': new KeyBinding('KeyA'),
			'right': new KeyBinding('KeyD'),
			'up': new KeyBinding('KeyE'),
			'down': new KeyBinding('KeyQ'),
			'fast': new KeyBinding('ShiftLeft'),
		};

		// world.registerUpdatable(this);
	}

	handleMouseWheel(event: WheelEvent, value: number): void {
		return;
	}

	public setSensitivity(sensitivityX: number, sensitivityY: number = sensitivityX): void
	{
		this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);
	}

	public setRadius(value: number, instantly: boolean = false): void
	{
		this.targetRadius = Math.max(0.001, value);
		if (instantly === true)
		{
			this.radius = value;
		}
	}

	public move(deltaX: number, deltaY: number): void
	{
		this.theta -= deltaX * (this.sensitivity.x / 2);
		this.theta %= 360;
		this.phi += deltaY * (this.sensitivity.y / 2);
		this.phi = Math.min(85, Math.max(-85, this.phi));
	}

	public tick(timeElapsed: number, delta: number): void
	{
		if (this.followMode === true)
		{
			camera.position.y = THREE.MathUtils.clamp(camera.position.y, this.target.y, Number.POSITIVE_INFINITY);
			camera.lookAt(this.target);
			let newPos = this.target.clone().add(new THREE.Vector3().subVectors(camera.position, this.target).normalize().multiplyScalar(this.targetRadius));
			camera.position.x = newPos.x;
			camera.position.y = newPos.y;
			camera.position.z = newPos.z;
		}
		else 
		{
			this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1);
	
			camera.position.x = this.target.x + this.radius * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
			camera.position.y = this.target.y + this.radius * Math.sin(this.phi * Math.PI / 180);
			camera.position.z = this.target.z + this.radius * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
			camera.updateMatrix();
			camera.lookAt(this.target);
		}

		// check if somethign is in the way
		this.positionalRay.from = Vector3ToVec3(camera.position);
		this.positionalRay.to = Vector3ToVec3(this.target);

		const raycastResult = new RaycastResult();

		this.positionalRay.intersectBodies(
			world.bodies.filter(row => row !== this.characterCaller?.characterCollider?.body),
			raycastResult
		)

		if (raycastResult.hasHit) {
			const newPosition = Vec3ToVector3(raycastResult.hitPointWorld).add(new THREE.Vector3(0, 0.2, 0));
			console.log(newPosition.distanceTo(this.target))
			// TODO handle case where its too close to the object
			if (newPosition.distanceTo(this.target) > .0) {
				camera.position.copy(newPosition);
				camera.updateMatrix();
			} else {
				// console.log("too far")
				// this.previousLegitCameraPosition.copy(camera.position);
				// camera.updateMatrix();
				// camera.lookAt(this.target)
			}
		}
	}

	public handleKeyboardEvent(event: KeyboardEvent, code: string, pressed: boolean): void
	{
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				const binding = this.actions[action];

				if (binding.eventCodes.includes(code))
				{
					binding.isPressed = pressed;
				}
			}
		}
	}

	public handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void
	{
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				const binding = this.actions[action];

				if (binding.eventCodes.includes(code))
				{
					binding.isPressed = pressed;
				}
			}
		}
	}

	public handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void
	{
		this.move(deltaX, deltaY);
	}

	public inputReceiverInit(): void
	{
		this.target.copy(camera.position);
		this.setRadius(0, true);
		// this.world.dirLight.target = this.world.camera;
	}

	public inputReceiverUpdate(timeStep: number): void
	{
		// Set fly speed
		// let speed = this.movementSpeed * (this.actions.fast.isPressed ? timeStep * 600 : timeStep * 5);

		// const up = getUp(camera);
		// const right = getRight(camera);
		// const forward = getBack(camera);

		// this.upVelocity = THREE.MathUtils.lerp(this.upVelocity, +this.actions.up.isPressed - +this.actions.down.isPressed, 0.3);
		// this.forwardVelocity = THREE.MathUtils.lerp(this.forwardVelocity, +this.actions.forward.isPressed - +this.actions.back.isPressed, 0.3);
		// this.rightVelocity = THREE.MathUtils.lerp(this.rightVelocity, +this.actions.right.isPressed - +this.actions.left.isPressed, 0.3);

		// this.target.add(up.multiplyScalar(speed * this.upVelocity));
		// this.target.add(forward.multiplyScalar(speed * this.forwardVelocity));
		// this.target.add(right.multiplyScalar(speed * this.rightVelocity));
	}
}