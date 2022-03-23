import type { CharacterController } from '../controller/CharacterController';
import
{
	CharacterStateBase,
	Idle,
	JumpRunning,
	Sprint,
} from './_stateLibrary';

export class Walk extends CharacterStateBase
{
	constructor(character: CharacterController)
	{
		super(character);

		this.character.setArcadeVelocityTarget(0.3);
		this.playAnimation('run', 0.1);
	}

	public update(timeStep: number): void
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();

		this.fallInAir();
	}

	public onInputChange(): void
	{
		super.onInputChange();

		if (this.noDirection())
		{
			this.character.setState(new Idle(this.character));
		}
		
		if (this.character.actions.run.isPressed)
		{
			this.character.setState(new Sprint(this.character));
		}
		
		if (this.character.actions.run.justPressed)
		{
			this.character.setState(new Sprint(this.character));
		}

		if (this.character.actions.jump.justPressed)
		{
			this.character.setState(new JumpRunning(this.character));
		}

		if (this.noDirection())
		{
			this.character.setState(new Idle(this.character));
		}
	}
}