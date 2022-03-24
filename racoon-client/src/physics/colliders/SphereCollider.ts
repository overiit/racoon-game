import { Body, Material, Sphere, Vec3 } from 'cannon-es';
import type { ICollider } from '../../interfaces/ICollider';
import { setDefaults } from '../../utils/Utils';

export class SphereCollider implements ICollider
{
	public options: any;
	public body: Body;
	public debugModel: THREE.Mesh;

	constructor(options: any)
	{
		let defaults = {
			mass: 0,
			position: new Vec3(),
			radius: 0.3,
			friction: 0.3
		};
		options = setDefaults(options, defaults);
		this.options = options;

		let mat = new Material('sphereMat');
		mat.friction = options.friction;

		let shape = new Sphere(options.radius);
		// shape.material = mat;

		// Add phys sphere
		let physSphere = new Body({
			mass: options.mass,
			position: options.position,
			shape
		});
		physSphere.material = mat;

		this.body = physSphere;
	}
}