import type { CharacterController } from '../controller/CharacterController';
import {StartWalkBase} from './_stateLibrary';

export class StartWalkForward extends StartWalkBase
{
	constructor(character: CharacterController)
	{
		super(character);
		this.animationLength = character.setAnimation('run', 0.1);
	}
}