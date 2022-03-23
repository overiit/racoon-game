import { Sphere } from 'cannon-es';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import * as GLTFLoader from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterController } from '../controller/CharacterController';
import { loadGLTF } from '../helper/ModelLoader';
import { ModelSources } from '../utils/sources';
import { getForward } from '../utils/Utils';

export class CharacterSpawnPoint
{
	private object: THREE.Object3D;

	constructor(object: THREE.Object3D)
	{
		this.object = object;
	}
	
	public spawn(): void
	{
		const GROUP = ModelSources.racoon_model.modelPath;
		loadGLTF(GROUP, { castShadow: true }).then((model) => {
			let player = new CharacterController(model);
			
			let worldPos = new Vector3();
			this.object.getWorldPosition(worldPos);
			player.setPosition(worldPos.x, worldPos.y, worldPos.z);
			
			let forward = getForward(this.object);
			player.setOrientation(forward, true);
			
			player.spawn();
			player.takeControl();
        });
	}
}