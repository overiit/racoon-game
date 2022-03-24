import * as THREE from 'three';
import type { CharacterController } from '../controller/CharacterController';
import type { ICharacterState } from '../interfaces/ICharacterState';
import { getSignedAngleBetweenVectors } from '../utils/Utils';
import { Idle } from './Idle';
import {
	DropRolling,
	Falling,
	Sprint,
	Walk,
} from './_stateLibrary';

export abstract class CharacterStateBase implements ICharacterState
{
	public character: CharacterController;
	public timer: number;
	public animationLength: any;
	public isCharacterStateBase = true;

	constructor(character: CharacterController)
	{
		this.character = character;

		this.character.velocitySimulator.damping = this.character.defaultVelocitySimulatorDamping;
		this.character.velocitySimulator.mass = this.character.defaultVelocitySimulatorMass;

		this.character.rotationSimulator.damping = this.character.defaultRotationSimulatorDamping;
		this.character.rotationSimulator.mass = this.character.defaultRotationSimulatorMass;

		this.character.arcadeVelocityIsAdditive = false;
		this.character.setArcadeVelocityInfluence(1, 0, 1);


		this.timer = 0;
	}

	public update(timeStep: number): void
	{
		this.timer += timeStep;
	}

	public noDirection(): boolean
	{
		return !this.character.actions.up.isPressed && !this.character.actions.down.isPressed && !this.character.actions.left.isPressed && !this.character.actions.right.isPressed;
	}

	public anyDirection(): boolean
	{
		return this.character.actions.up.isPressed || this.character.actions.down.isPressed || this.character.actions.left.isPressed || this.character.actions.right.isPressed;
	}

	public fallInAir(): void
	{
		if (!this.character.rayHasHit) { this.character.setState(new Falling(this.character)); }
	}

	public animationEnded(timeStep: number): boolean
	{
		if (this.character.mixer !== undefined)
		{
			if (this.animationLength === undefined)
			{
				console.error(this.constructor.name + 'Error: Set this.animationLength in state constructor!');
				return false;
			}
			else
			{
				return this.timer > this.animationLength - timeStep;
			}
		}
		else { return true; }
	}

	public setAppropriateDropState(): void
	{
		// if: this.character.groundImpactData.velocity.y < -6
		  // then: fall from high spot, setState to drop hit hard (DropRolling)
		// else:
		if (this.anyDirection())
		{
			// if (this.character.groundImpactData.velocity.y < -2)
			// {
			// 	this.character.setState(new DropRunning(this.character));
			// }
			// else
			{
				if (this.character.actions.run.isPressed)
				{
					this.character.setState(new Sprint(this.character));
				}
				else
				{
					this.character.setState(new Walk(this.character));
				}
			}
		}
		else
		{
			this.character.setState(new Idle(this.character));
		}
	}

	public setAppropriateStartWalkState(): void
	{
		this.character.setState(new Walk(this.character));
	}

	protected playAnimation(animName: string, fadeIn: number): void
	{
		this.animationLength = this.character.setAnimation(animName, fadeIn);
	}

	onInputChange(): void {
		
	}
}