import type { Group, Mesh, Object3D } from "three";

export default class Model {
    constructor(public mesh: Mesh | Group) {}
    tick () {}
}