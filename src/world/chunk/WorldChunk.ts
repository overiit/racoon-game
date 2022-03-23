import { Body, Quaternion, Shape, Vec3 } from "cannon-es";
import { Group, Mesh, Object3D, Vector3 } from "three";
import CannonUtils from "../../utils/CannonUtils";
import { GroupToMeshes, Vector3ToVec3 } from "../../utils/Convert";
import type { ChunkType } from "./WorldEnvironment";

export default class WorldChunk {

    bodyOrientation: Quaternion;
    bodyOffset: Vec3;
    constructor (
        public mesh: Group | Mesh,
        public type: ChunkType,
        public body?: Body
    ) {
        mesh.position.set(0, 0, 0);
        if (!body) {
            this.body = new Body({
                mass: 0,
                position: Vector3ToVec3(mesh.position),
            });
            const meshes = GroupToMeshes(mesh);
            for (const mesh of meshes) {
                const shape = CannonUtils.CreateTrimesh(mesh.geometry);
                this.body.addShape(shape);
            }
        }
    }
    


    public static playerPositionToInnerChunkPosition (position: Vector3, chunkSize: number): Vector3 {
        return new Vector3(
            position.x % chunkSize,
            position.y % chunkSize,
            position.z % chunkSize
        )
    }

    clone () {
        let mesh;
        if ((this.mesh as Mesh).isMesh) {
            mesh = new Mesh().copy(this.mesh as Mesh);
        } else {
            mesh = new Group().copy(this.mesh as Group);
        }
        return new WorldChunk(
            mesh,
            this.type
        )
    }
}