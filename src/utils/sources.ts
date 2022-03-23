class GameSource {
    constructor(
        public readonly name: string, 
        public readonly modelPath: `/resources/${string}.glb`, 
        public readonly physicsMeshPath?: `/resources/${string}.glb`, 
        public readonly texture?: string
    ) {}
}

export const ModelSources = {
    racoon_model: new GameSource("racoon", "/resources/models/racoon_mixed_2.glb"),
    test_world: new GameSource("test_world", "/resources/worlds/Test.glb",  "/resources/worlds/Test.Hitbox.glb"),
    sketchbook_world: new GameSource("test_world", "/resources/worlds/sketchbook.glb"),
}