import { Matrix4, MeshPhongMaterial, Object3D, Vector3 } from "three";
import { SimulationFrame } from "../physics/spring_simulation/SimulationFrame";

export enum Space
{
	Local = 'local',
	Global = 'global'
}

export function setDefaults<T> (obj: any, defaults: T): T {
    if (!obj) return defaults;
    for (const key in defaults) {
        if (typeof obj[key] === "object") {
            setDefaults(obj[key], defaults[key]);
        } else {
            if (obj[key] === undefined) {
                obj[key] = defaults[key];
            }
        }
    }
    return obj;
}



export function spring(source: number, dest: number, velocity: number, mass: number, damping: number): SimulationFrame
{
	let acceleration = dest - source;
	acceleration /= mass;
	velocity += acceleration;
	velocity *= damping;

	let position = source + velocity;

	return new SimulationFrame(position, velocity);
}

export function springV(source: THREE.Vector3, dest: THREE.Vector3, velocity: THREE.Vector3, mass: number, damping: number): void
{
	let acceleration = new Vector3().subVectors(dest, source);
	acceleration.divideScalar(mass);
	velocity.add(acceleration);
	velocity.multiplyScalar(damping);
	source.add(velocity);
}



export function getRight(obj: Object3D, space: Space = Space.Global): Vector3
{
	const matrix = getMatrix(obj, space);
	return new Vector3(
		matrix.elements[0],
		matrix.elements[1],
		matrix.elements[2]
		);
}

export function getUp(obj: Object3D, space: Space = Space.Global): Vector3
{
	const matrix = getMatrix(obj, space);
	return new Vector3(
		matrix.elements[4],
		matrix.elements[5],
		matrix.elements[6]
		);
}

export function getForward(obj: Object3D, space: Space = Space.Global): Vector3
{
	const matrix = getMatrix(obj, space);
	return new Vector3(
		matrix.elements[8],
		matrix.elements[9],
		matrix.elements[10]
		);
}

export function getBack(obj: Object3D, space: Space = Space.Global): Vector3
{
	const matrix = getMatrix(obj, space);
	return new Vector3(
		-matrix.elements[8],
		-matrix.elements[9],
		-matrix.elements[10]
		);
}

export function getMatrix(obj: Object3D, space: Space): Matrix4
{
	switch (space)
	{
		case Space.Local: return obj.matrix;
		case Space.Global: return obj.matrixWorld;
	}
}

export function setupMeshProperties(child: any): void
{
	child.castShadow = true;
	child.receiveShadow = true;

	if (child.material.map !== null)
	{
		let mat = new MeshPhongMaterial();
		mat.shininess = 0;
		mat.name = child.material.name;
		mat.map = child.material.map;
		mat.map.anisotropy = 4;
		mat.aoMap = child.material.aoMap;
		mat.transparent = child.material.transparent;
		// mat.skinning = child.material.skinning;
		// mat.map.encoding = LinearEncoding;
		child.material = mat;
	}
}


/**
 * Finds an angle between two vectors with a sign relative to normal vector
 */
 export function getSignedAngleBetweenVectors(v1: Vector3, v2: Vector3, normal: Vector3 = new Vector3(0, 1, 0), dotTreshold: number = 0.0005): number
 {
	 let angle = getAngleBetweenVectors(v1, v2, dotTreshold);
 
	 // Get vector pointing up or down
	 let cross = new Vector3().crossVectors(v1, v2);
	 // Compare cross with normal to find out direction
	 if (normal.dot(cross) < 0)
	 {
		 angle = -angle;
	 }
 
	 return angle;
 }
 
 export function haveSameSigns(n1: number, n2: number): boolean
 {
	 return (n1 < 0) === (n2 < 0);
 }
 
 export function haveDifferentSigns(n1: number, n2: number): boolean
 {
	 return (n1 < 0) !== (n2 < 0);
 }





/**
 * Constructs a 2D matrix from first vector, replacing the Y axes with the global Y axis,
 * and applies this matrix to the second vector. Saves performance when compared to full 3D matrix application.
 * Useful for character rotation, as it only happens on the Y axis.
 * @param {Vector3} a Vector to construct 2D matrix from
 * @param {Vector3} b Vector to apply basis to
 */
export function appplyVectorMatrixXZ(a: Vector3, b: Vector3): Vector3
{
	return new Vector3(
		(a.x * b.z + a.z * b.x),
		b.y,
		(a.z * b.z + -a.x * b.x)
	);
}

export function round(value: number, decimals: number = 0): number
{
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function roundVector(vector: Vector3, decimals: number = 0): Vector3
{
	return new Vector3(
		round(vector.x, decimals),
		round(vector.y, decimals),
		round(vector.z, decimals),
	);
}

/**
 * Finds an angle between two vectors
 * @param {Vector3} v1 
 * @param {Vector3} v2 
 */
export function getAngleBetweenVectors(v1: Vector3, v2: Vector3, dotTreshold: number = 0.0005): number
{
	let angle: number;
	let dot = v1.dot(v2);

	// If dot is close to 1, we'll round angle to zero
	if (dot > 1 - dotTreshold)
	{
		angle = 0;
	}
	else
	{
		// Dot too close to -1
		if (dot < -1 + dotTreshold)
		{
			angle = Math.PI;
		}
		else
		{
			// Get angle difference in radians
			angle = Math.acos(dot);
		}
	}

	return angle;
}