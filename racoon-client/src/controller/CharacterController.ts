import { Body, Material, RaycastResult, Vec3, World } from 'cannon-es';
import { AnimationAction, AnimationClip, AnimationMixer, BoxGeometry, Group, MathUtils, Matrix4, Mesh, MeshLambertMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { Idle } from '../character_states/Idle';
import { camera, gui, world } from '../engine/engine';
import { getCurrentScene } from '../engine/SceneManager';
import type { Entity } from '../interfaces/Entity';
import { GroundImpactData } from '../interfaces/GroundImpactData';
import type { ICharacterState } from '../interfaces/ICharacterState';
import { KeyBinding } from '../interfaces/KeyBinding';
import { RelativeSpringSimulator } from '../physics/spring_simulation/RelativeSpringSimulator';
import { VectorSpringSimulator } from '../physics/spring_simulation/VectorSpringSimulator';
import { Vec3ToVector3, Vector3ToVec3 } from '../utils/Convert';
import { appplyVectorMatrixXZ, getForward, getSignedAngleBetweenVectors, haveDifferentSigns, setupMeshProperties } from '../utils/Utils';
import type { GameWorld } from '../world/GameWorld';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SphereCollider } from '../physics/colliders/SphereCollider';
import type { ICollider } from '../interfaces/ICollider';

export enum CollisionGroups {
	Default = 1,
	Characters = 2,
	TrimeshColliders = 4
}

type PhysicsPrePostStep = {
	type: "preStep" | "postStep",
	target: World
}

export class CharacterController extends Object3D implements Entity
{
	public updateOrder: number = 1;

	public height: number = 0;
	public tiltContainer: Group;
	public modelContainer: Group;
	public materials: Material[] = [];
	public mixer: AnimationMixer;
	public animations: any[];

	// Movement
	public acceleration: Vector3 = new Vector3();
	public velocity: Vector3 = new Vector3();
	public arcadeVelocityInfluence: Vector3 = new Vector3();
	public velocityTarget: Vector3 = new Vector3();
	public arcadeVelocityIsAdditive: boolean = false;

	public defaultVelocitySimulatorDamping: number = 0.8;
	public defaultVelocitySimulatorMass: number = 50;
	public velocitySimulator: VectorSpringSimulator;
	public moveSpeed: number = 4;
	public angularVelocity: number = 0;
	public orientation: Vector3 = new Vector3(0, 0, 1);
	public orientationTarget: Vector3 = new Vector3(0, 0, 1);
	public defaultRotationSimulatorDamping: number = 0.5;
	public defaultRotationSimulatorMass: number = 10;
	public rotationSimulator: RelativeSpringSimulator;
	public viewVector: Vector3;
	public actions: { [action: string]: KeyBinding };
	public characterCollider: ICollider;
	
	// Ray casting
	public rayResult: RaycastResult = new RaycastResult();
	public rayHasHit: boolean = false;
	public rayCastLength: number = 0.40;
	public raySafeOffset: number = 0.03;
	public wantsToJump: boolean = false;
	public initJumpSpeed: number = -1;
	public groundImpactData: GroundImpactData = new GroundImpactData();
	public raycastBox: Mesh;
	
	public world: GameWorld;
	public charState: ICharacterState;
	
	private physicsEnabled: boolean = true;

	constructor(gltf: GLTF)
	{
		super();

		this.readCharacterData(gltf);
		this.setAnimations(gltf.animations);

		// The visuals group is centered for easy character tilting
		this.tiltContainer = new Group();
		this.add(this.tiltContainer);

		// Model container is used to reliably ground the character, as animation can alter the position of the model itself
		this.modelContainer = new Group();
		this.modelContainer.position.y = -this.rayCastLength;
		this.tiltContainer.add(this.modelContainer);
		this.modelContainer.add(gltf.scene);

		this.mixer = new AnimationMixer(gltf.scene);

		this.velocitySimulator = new VectorSpringSimulator(60, this.defaultVelocitySimulatorMass, this.defaultVelocitySimulatorDamping);
		this.rotationSimulator = new RelativeSpringSimulator(60, this.defaultRotationSimulatorMass, this.defaultRotationSimulatorDamping);

		this.viewVector = new Vector3();

		// Actions
		this.actions = {
			'up': new KeyBinding('KeyW'),
			'down': new KeyBinding('KeyS'),
			'left': new KeyBinding('KeyA'),
			'right': new KeyBinding('KeyD'),
			'run': new KeyBinding('ShiftLeft'),
			'jump': new KeyBinding('Space'),
			'use': new KeyBinding('KeyE'),
			'enter': new KeyBinding('KeyF'),
			'enter_passenger': new KeyBinding('KeyG'),
			'seat_switch': new KeyBinding('KeyX'),
			'primary': new KeyBinding('Mouse0'),
			'secondary': new KeyBinding('Mouse1'),
		};

		// Physics
		// Player Capsule
		this.characterCollider = new SphereCollider({
			mass: 1,
			position: new Vec3(),
			// height: 0.55,
			radius: 0.20,
			segments: 8,
			friction: 0.0
		});
		// capsulePhysics.physical.collisionFilterMask = ~CollisionGroups.Trimesh;
		this.characterCollider.body.shapes.forEach((shape) => {
			// tslint:disable-next-line: no-bitwise
			shape.collisionFilterMask = ~CollisionGroups.Characters;
		});
		this.characterCollider.body.allowSleep = false;

		// Move character to different collision group for raycasting
		this.characterCollider.body.collisionFilterGroup = 2;

		// Disable character rotation
		this.characterCollider.body.fixedRotation = true;
		this.characterCollider.body.updateMassProperties();

		// Ray cast debug
		const boxGeo = new BoxGeometry(0.1, 0.1, 0.1);
		const boxMat = new MeshLambertMaterial({
			color: 0xff0000
		});
		this.raycastBox = new Mesh(boxGeo, boxMat);
		this.raycastBox.visible = false;

		// Physics pre/post step callback bindings
		world.addEventListener('preStep',  (preStep: PhysicsPrePostStep) => {
			for (const body of preStep.target.bodies) {
				if (body === this.characterCollider.body) {
					this.physicsPreStep(body, this);
				}
			}
		});
		world.addEventListener('postStep',  (postStep: PhysicsPrePostStep) => { 
			for (const body of postStep.target.bodies) {
				if (body === this.characterCollider.body) {
					this.physicsPostStep(body, this);
				}
			}
		});

		// States
		this.setState(new Idle(this));
	}

	public setAnimations(animations: AnimationClip[]): void
	{
		this.animations = animations;
	}

	public setArcadeVelocityInfluence(x: number, y: number = x, z: number = x): void
	{
		this.arcadeVelocityInfluence.set(x, y, z);
	}

	public setViewVector(vector: Vector3): void
	{
		this.viewVector.copy(vector).normalize();
	}

	/**
	 * Set state to the player. Pass state class (function) name.
	 * @param {function} State 
	 */
	public setState(state: ICharacterState): void
	{
		this.charState = state;
		this.charState.onInputChange();
	}

	public setPosition(x: number, y: number, z: number): void
	{
		if (this.physicsEnabled)
		{
			this.characterCollider.body.previousPosition = new Vec3(x, y, z);
			this.characterCollider.body.position = new Vec3(x, y, z);
			this.characterCollider.body.interpolatedPosition = new Vec3(x, y, z);
		}
		else
		{
			this.position.x = x;
			this.position.y = y;
			this.position.z = z;
		}
	}

	public resetVelocity(): void
	{
		this.velocity.x = 0;
		this.velocity.y = 0;
		this.velocity.z = 0;

		this.characterCollider.body.velocity.x = 0;
		this.characterCollider.body.velocity.y = 0;
		this.characterCollider.body.velocity.z = 0;

		this.velocitySimulator.init();
	}

	public setArcadeVelocityTarget(velZ: number, velX: number = 0, velY: number = 0): void
	{
		this.velocityTarget.z = velZ;
		this.velocityTarget.x = velX;
		this.velocityTarget.y = velY;
	}

	public setOrientation(vector: Vector3, instantly: boolean = false): void
	{
		let lookVector = new Vector3().copy(vector).setY(0).normalize();
		this.orientationTarget.copy(lookVector);
		
		if (instantly)
		{
			this.orientation.copy(lookVector);
		}
	}

	public resetOrientation(): void
	{
		const forward = getForward(this);
		this.setOrientation(forward, true);
	}

	public setPhysicsEnabled(value: boolean): void {
		this.physicsEnabled = value;

		if (value === true)
		{
			world.addBody(this.characterCollider.body);
		}
		else
		{
			world.removeBody(this.characterCollider.body);
		}
	}

	public readCharacterData(gltf: any): void
	{
		gltf.scene.traverse((child) => {

			if (child.isMesh)
			{
				setupMeshProperties(child);

				if (child.material !== undefined)
				{
					this.materials.push(child.material);
				}
			}
		});
	}

	public handleKeyboardEvent(event: KeyboardEvent, code: string, pressed: boolean): void
	{
				for (const action in this.actions) {
					if (this.actions.hasOwnProperty(action)) {
						const binding = this.actions[action];
	
						if (binding.eventCodes.includes(code))
						{
							this.triggerAction(action, pressed);
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
						this.triggerAction(action, pressed);
					}
				}
			}
	}

	public handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void
	{
        this.world.cameraController.move(deltaX, deltaY);
	}
	
	public handleMouseWheel(event: WheelEvent, value: number): void
	{
	}

	public triggerAction(actionName: string, value: boolean): void
	{
		// Get action and set it's parameters
		let action = this.actions[actionName];

		if (action.isPressed !== value)
		{
			// Set value
			action.isPressed = value;

			// Reset the 'just' attributes
			action.justPressed = false;
			action.justReleased = false;

			// Set the 'just' attributes
			if (value) action.justPressed = true;
			else action.justReleased = true;

			// Tell player to handle states according to new input
			this.charState.onInputChange();

			// Reset the 'just' attributes
			action.justPressed = false;
			action.justReleased = false;
		}
	}

	public takeControl(): void
	{
		if (this.world !== undefined)
		{
			this.world.inputController.setInputReceiver(this);
		}
		else
		{
			console.warn('Attempting to take control of a character that doesn\'t belong to a world.');
		}
	}

	public resetControls(): void
	{
		for (const action in this.actions) {
			if (this.actions.hasOwnProperty(action)) {
				this.triggerAction(action, false);
			}
		}
	}

	public tick(elapsedTime: number, delta: number): void
	{
		// console.log(this.occupyingSeat);
		this.charState?.update(delta);

		// this.visuals.position.copy(this.modelOffset);
		if (this.physicsEnabled) this.springMovement(delta);
		if (this.physicsEnabled) this.springRotation(delta);
		if (this.physicsEnabled) this.rotateModel();
		if (this.mixer !== undefined) this.mixer.update(delta);

		// Sync physics/graphics
		if (this.physicsEnabled)
		{
			this.position.set(
				this.characterCollider.body.interpolatedPosition.x,
				this.characterCollider.body.interpolatedPosition.y,
				this.characterCollider.body.interpolatedPosition.z
			);
		}
		else {
			let newPos = new Vector3();
			this.getWorldPosition(newPos);

			this.characterCollider.body.position.copy(Vector3ToVec3(newPos));
			this.characterCollider.body.interpolatedPosition.copy(Vector3ToVec3(newPos));
		}

		this.updateMatrixWorld();
	}

	public inputReceiverInit(): void
	{
		this.world.cameraController.setRadius(1.6, true);
		this.world.cameraController.followMode = false;
		// this.world.dirLight.target = this;
	}

	public inputReceiverUpdate(timeStep: number): void
	{
        // Look in camera's direction
        this.viewVector = new Vector3().subVectors(this.position, camera.position);
        this.getWorldPosition(this.world.cameraController.target);
	}

	currentAction: AnimationAction;

	public setAnimation(clipName: string, fadeIn: number): number
	{
		if (this.mixer !== undefined)
		{
			// gltf
			let clip = AnimationClip.findByName( this.animations, clipName );

			let action = this.mixer.clipAction(clip);
			if (action === null)
			{
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}
			// this.mixer.stopAllAction();
			if (this.currentAction && this.currentAction != action) {
				this.currentAction.fadeOut(fadeIn);
			}

			action
			.reset()
			.setEffectiveTimeScale( 1 )
			.setEffectiveWeight( 1 )
			.fadeIn( fadeIn )
			.play();

			this.currentAction = action;

			return action.getClip().duration;
		}
	}

	public springMovement(timeStep: number): void
	{
		// Simulator
		this.velocitySimulator.target.copy(this.velocityTarget);
		this.velocitySimulator.simulate(timeStep);

		// Update values
		this.velocity.copy(this.velocitySimulator.position);
		this.acceleration.copy(this.velocitySimulator.velocity);
	}

	public springRotation(timeStep: number): void
	{
		// Spring rotation
		// Figure out angle between current and target orientation
		let angle = getSignedAngleBetweenVectors(this.orientation, this.orientationTarget);

		// Simulator
		this.rotationSimulator.target = angle;
		this.rotationSimulator.simulate(timeStep);
		let rot = this.rotationSimulator.position;

		// Updating values
		this.orientation.applyAxisAngle(new Vector3(0, 1, 0), rot);
		this.angularVelocity = this.rotationSimulator.velocity;
	}

	public getLocalMovementDirection(): Vector3
	{
		const positiveX = this.actions.right.isPressed ? -1 : 0;
		const negativeX = this.actions.left.isPressed ? 1 : 0;
		const positiveZ = this.actions.up.isPressed ? 1 : 0;
		const negativeZ = this.actions.down.isPressed ? -1 : 0;

		return new Vector3(positiveX + negativeX, 0, positiveZ + negativeZ).normalize();
	}

	public getCameraRelativeMovementVector(): Vector3
	{
		const localDirection = this.getLocalMovementDirection();
		const flatViewVector = new Vector3(this.viewVector.x, 0, this.viewVector.z).normalize();

		return appplyVectorMatrixXZ(flatViewVector, localDirection);
	}

	public setCameraRelativeOrientationTarget(): void
	{
        let moveVector = this.getCameraRelativeMovementVector();

        if (moveVector.x === 0 && moveVector.y === 0 && moveVector.z === 0)
        {
            this.setOrientation(this.orientation);
        }
        else
        {
            this.setOrientation(moveVector);
        }
	}

	public rotateModel(): void
	{
		this.lookAt(this.position.x + this.orientation.x, this.position.y + this.orientation.y, this.position.z + this.orientation.z);
		this.tiltContainer.rotation.z = (-this.angularVelocity * 2.3 * this.velocity.length());
		this.tiltContainer.position.setY((Math.cos(Math.abs(this.angularVelocity * 2.3 * this.velocity.length())) / 2) - 0.5);
	}

	public jump(initJumpSpeed: number = -1): void
	{
		this.wantsToJump = true;
		this.initJumpSpeed = initJumpSpeed;
	}

	public physicsPreStep(body: Body, character: CharacterController): void
	{
		character.feetRaycast();

		// Raycast debug
		if (character.rayHasHit)
		{
			if (character.raycastBox.visible) {
				character.raycastBox.position.x = character.rayResult.hitPointWorld.x;
				character.raycastBox.position.y = character.rayResult.hitPointWorld.y;
				character.raycastBox.position.z = character.rayResult.hitPointWorld.z;
			}
		}
		else
		{
			if (character.raycastBox.visible) {
				character.raycastBox.position.set(body.position.x, body.position.y - character.rayCastLength - character.raySafeOffset, body.position.z);
			}
		}
	}

	feetRaycast(): void
	{
		// Player ray casting
		// Create ray
		let body = this.characterCollider.body;
		const start = new Vec3(body.position.x, body.position.y, body.position.z);
		const end = new Vec3(body.position.x, body.position.y - this.rayCastLength - this.raySafeOffset, body.position.z);
		// Raycast options
		const rayCastOptions = {
			collisionFilterMask: CollisionGroups.Default,
			skipBackfaces: true      /* ignore back faces */
		};
		// Cast the ray
		this.rayHasHit = world.raycastClosest(start, end, rayCastOptions, this.rayResult);
	}

	public physicsPostStep(body: Body, character: CharacterController): void
	{
		// Get velocities
		let simulatedVelocity = new Vector3(body.velocity.x, body.velocity.y, body.velocity.z);

		// Take local velocity
		let arcadeVelocity = new Vector3().copy(character.velocity).multiplyScalar(character.moveSpeed);
		
		// Turn local into global
		arcadeVelocity = appplyVectorMatrixXZ(character.orientation, arcadeVelocity);

		let newVelocity = new Vector3();

		// Additive velocity mode
		if (character.arcadeVelocityIsAdditive)
		{
			newVelocity.copy(simulatedVelocity);

			let globalVelocityTarget = appplyVectorMatrixXZ(character.orientation, character.velocityTarget);
			let add = new Vector3().copy(arcadeVelocity).multiply(character.arcadeVelocityInfluence);

			if (Math.abs(simulatedVelocity.x) < Math.abs(globalVelocityTarget.x * character.moveSpeed) || haveDifferentSigns(simulatedVelocity.x, arcadeVelocity.x)) { newVelocity.x += add.x; }
			if (Math.abs(simulatedVelocity.y) < Math.abs(globalVelocityTarget.y * character.moveSpeed) || haveDifferentSigns(simulatedVelocity.y, arcadeVelocity.y)) { newVelocity.y += add.y; }
			if (Math.abs(simulatedVelocity.z) < Math.abs(globalVelocityTarget.z * character.moveSpeed) || haveDifferentSigns(simulatedVelocity.z, arcadeVelocity.z)) { newVelocity.z += add.z; }
		}
		else
		{
			newVelocity = new Vector3(
				MathUtils.lerp(simulatedVelocity.x, arcadeVelocity.x, character.arcadeVelocityInfluence.x),
				MathUtils.lerp(simulatedVelocity.y, arcadeVelocity.y, character.arcadeVelocityInfluence.y),
				MathUtils.lerp(simulatedVelocity.z, arcadeVelocity.z, character.arcadeVelocityInfluence.z),
			);
		}

		// If we're hitting the ground, stick to ground
		if (character.rayHasHit)
		{
			// Flatten velocity
			newVelocity.y = 0;

			// Move on top of moving objects
			if (character.rayResult.body.mass > 0)
			{
				let pointVelocity = new Vec3();
				character.rayResult.body.getVelocityAtWorldPoint(character.rayResult.hitPointWorld, pointVelocity);
				newVelocity.add(Vec3ToVector3(pointVelocity));
			}

			// Measure the normal vector offset from direct "up" vector
			// and transform it into a matrix
			let up = new Vector3(0, 1, 0);
			let normal = new Vector3(character.rayResult.hitNormalWorld.x, character.rayResult.hitNormalWorld.y, character.rayResult.hitNormalWorld.z);
			let q = new Quaternion().setFromUnitVectors(up, normal);
			let m = new Matrix4().makeRotationFromQuaternion(q);

			// Rotate the velocity vector
			newVelocity.applyMatrix4(m);

			// Compensate for gravity
			// newVelocity.y -= body.world.physicsWorld.gravity.y / body.character.world.physicsFrameRate;

			// Apply velocity
			body.velocity.x = newVelocity.x;
			body.velocity.y = newVelocity.y;
			body.velocity.z = newVelocity.z;
			// Ground character
			body.position.y = character.rayResult.hitPointWorld.y + character.rayCastLength + (newVelocity.y / character.world.physicsFrameRate);
		}
		else
		{
			// If we're in air
			body.velocity.x = newVelocity.x;
			body.velocity.y = newVelocity.y;
			body.velocity.z = newVelocity.z;

			// Save last in-air information
			if (character.groundImpactData.velocity) {
				character.groundImpactData.velocity.x = body.velocity.x;
				character.groundImpactData.velocity.y = body.velocity.y;
				character.groundImpactData.velocity.z = body.velocity.z;
			}
		}

		// Jumping
		if (character.wantsToJump)
		{
			// If initJumpSpeed is set
			if (character.initJumpSpeed > -1)
			{
				// Flatten velocity
				body.velocity.y = 0;
				let speed = Math.max(character.velocitySimulator.position.length() * 4, character.initJumpSpeed);
				body.velocity = Vector3ToVec3(character.orientation.clone().multiplyScalar(speed));
			}
			else {
				// Moving objects compensation
				let add = new Vec3();
				character.rayResult.body.getVelocityAtWorldPoint(character.rayResult.hitPointWorld, add);
				body.velocity.vsub(add, body.velocity);
			}

			// Add positive vertical velocity 
			body.velocity.y += 4;

			// Move above ground by 2x safe offset value
			body.position.y += character.raySafeOffset * 2;
			// Reset flag
			character.wantsToJump = false;
		}
	}

	public spawn(): void
	{
        const gameWorld = getCurrentScene().gameWorld;
		if (gameWorld.tickables.includes(this))
		{
			console.warn('Adding character to a world in which it already exists.');
		}
		else
		{
			// Set world
			this.world = gameWorld;

			// Register character
			gameWorld.addEntity(this);

			// Register physics
			world.addBody(this.characterCollider.body);

			// Add to graphicsWorld
			gameWorld.world.add(this);
			gameWorld.world.add(this.raycastBox);

			// set cameraController characterCaller
			gameWorld.cameraController.characterCaller = this;

			// Shadow cascades
			// this.materials.forEach((mat) =>
			// {
			// 	world.sky.csm.setupMaterial(mat);
			// });
		}
	}

	public destroy(): void
	{
        const gameWorld = getCurrentScene().gameWorld;
		if (gameWorld.tickables.includes(this))
		{
			console.warn('Removing character from a world in which it isn\'t present.');
		}
		else
		{
			if (gameWorld.inputController.inputReceiver === this)
			{
				gameWorld.inputController.inputReceiver = undefined;
			}

			this.world = undefined;

			// Remove from characters
			gameWorld.removeEntity(this);

			// Remove physics
			world.removeBody(this.characterCollider.body);

			// Remove visuals
			gameWorld.world.remove(this);
			gameWorld.world.remove(this.raycastBox);
		}
	}
}