import type { CharacterController } from '../controller/CharacterController';
import type { ICharacterState } from '../interfaces/ICharacterState';
import type { Tickable } from '../interfaces/Updatable';
import { Idle } from './Idle';
import
{
	CharacterStateBase,
	JumpRunning,
	Sprint,
	Walk,
} from './_stateLibrary';

export class DropRunning extends CharacterStateBase implements ICharacterState
{
	constructor(character: CharacterController)
	{
		super(character);

		this.character.setArcadeVelocityTarget(0.8);
		this.playAnimation('drop_running_roll', 0.1);
	}

	public update(timeStep: number): void
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();

		if (this.animationEnded(timeStep))
		{
			this.character.setState(new Walk(this.character));
		}
	}

	public onInputChange(): void
	{
		super.onInputChange();
		
		if (this.noDirection())
		{
			this.character.setState(new Idle(this.character));
		}

		if (this.anyDirection() && this.character.actions.run.justPressed)
		{
			this.character.setState(new Sprint(this.character));
		}

		if (this.character.actions.jump.justPressed)
		{
			this.character.setState(new JumpRunning(this.character));
		}
	}
}