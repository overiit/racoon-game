import { Body, Vec3 } from "cannon-es";
import Model from "./Model";
import { CannonQuaternionToThreeQuaternion } from "../utils/Convert";
import type { Group, Mesh } from "three";

export default class PhysicsModel extends Model {
    constructor (public mesh: Mesh | Group, public body: Body, public physicsOffset: Vec3=new Vec3(0, 0, 0)) {
        super(mesh);
    }

    tick () {
        let position = this.body.position.clone();
        this.mesh.position.set(
            position.x + this.physicsOffset.x,
            position.y + this.physicsOffset.y,
            position.z + this.physicsOffset.z
        );
        const threeQuaternion = CannonQuaternionToThreeQuaternion(this.body.quaternion);
        this.mesh.quaternion.set(
            threeQuaternion.x,
            threeQuaternion.y,
            threeQuaternion.z,
            threeQuaternion.w
        );
    }
}