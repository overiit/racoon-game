import { Object3D, Vector3 } from "three";
import { camera } from "../engine/engine";

type ThirdPersonParams = {
    target: Object3D;
}

export default class ThirdPersonCamera {
    currentPosition: Vector3;
    currentLookat: Vector3;
    constructor (public params: ThirdPersonParams) {
        this.currentPosition = new Vector3();
        this.currentLookat = new Vector3();
    }

    calculateIdealOffset = () => {
        const idealOffset = new Vector3(0, 1, -5);
        idealOffset.applyQuaternion(this.params.target.quaternion);
        idealOffset.add(this.params.target.position);
        return idealOffset;
    }

    calculateIdealLookat = () => {
        const idealLookat = new Vector3(0, 10, 50);
        idealLookat.applyQuaternion(this.params.target.quaternion);
        idealLookat.add(this.params.target.position);
        return idealLookat;
    }

    update = () => {
        const idealOffset = this.calculateIdealOffset();
        const idealLookat = this.calculateIdealLookat();

        this.currentPosition.copy(idealOffset);
        this.currentLookat.copy(idealLookat);

        camera.position.copy(this.currentPosition);
        camera.lookAt(this.currentLookat);
    }
}