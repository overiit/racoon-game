import { Tickable } from "./Updatable";

export enum EntityType {
    PLAYER,
    ANIMAL,
    OBJECT
}

export class Entity extends Tickable {
    spawn() {}
    destroy() {}
}