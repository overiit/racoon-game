class GameSource {
    constructor(
        public readonly name: string, 
        public readonly modelPath: `http://localhost:51268/resources/${string}.glb`, 
        public readonly physicsMeshPath?: `http://localhost:51268/resources/${string}.glb`, 
        public readonly texture?: string
    ) {}
}

export const ModelSources = {
    racoon_model: new GameSource("racoon", "http://localhost:51268/resources/models/racoon_mixed_2.glb"),
    test_world: new GameSource("test_world", "http://localhost:51268/resources/worlds/Test.glb",  "http://localhost:51268/resources/worlds/Test.Hitbox.glb"),
    sketchbook_world: new GameSource("test_world", "http://localhost:51268/resources/worlds/sketchbook.glb"),
}