import { Quaternion as CannonQuaternon, Shape, Trimesh, Vec3 } from "cannon-es";
import { BufferGeometry, Group, Mesh, Quaternion, Quaternion as ThreeQuaternion, Vector, Vector3 } from "three";

export const Vec3ToVector3 = (vec3: Vec3): Vector3 => {
    return new Vector3(vec3.x, vec3.y, vec3.z);
}

export const Vector3ToVec3 = (vector3: Vector3): Vec3 => {
    return new Vec3(vector3.x, vector3.y, vector3.z);
}

export const ThreeQuaternionToCannonQuaternion = (quaternion: ThreeQuaternion): CannonQuaternon => {
    return new CannonQuaternon(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

export const CannonQuaternionToThreeQuaternion = (quaternion: CannonQuaternon): ThreeQuaternion => {
    return new ThreeQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

export const ThreeGeometryToCannonShapes = (geo: BufferGeometry): Shape[] => {
    const shapes: Shape[] = [];
    
    const vertices = geo.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i=i+3) {
        shapes.push(new Trimesh([vertices[i],vertices[i+1],vertices[i+2]], [0, 1, 2]));
    }
    
    return shapes;
}

export const GroupToMeshes = (group: Group | Mesh, offset: Vector3=new Vector3(0, 0, 0), offsetDirection: Quaternion=new Quaternion(0, 0, 0, 0)): Mesh[] => {
    if ((group as Mesh).isMesh) return [group as Mesh]
    const meshes: Mesh[] = [];
    for (const child of group.children) {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            mesh.position.add(offset.clone());
            mesh.applyQuaternion(offsetDirection);
            meshes.push(mesh);
        } else if ((child as Group).isGroup) {
            const group = child as Group;
            const groupOffset = group.position.clone().add(offset);
            const groupOffsetDirection = group.quaternion.clone().multiply(offsetDirection);
            meshes.push(...GroupToMeshes(group, groupOffset, groupOffsetDirection));
        } else {
            console.log("GroupToMeshes: invalid type check for geometry", child);
        }
    }
    return meshes;
}