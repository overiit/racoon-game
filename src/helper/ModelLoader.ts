import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader();
export const loadGLTF = async (relativeFileLocation: string, {
    castShadow = false,
}): Promise<GLTF> => {
    return new Promise<GLTF>((resolve, reject) => {
        loader.load(relativeFileLocation, (gltf) => {
            const model = gltf.scene;
            model.traverse(function (object: any) {
                if (object.isMesh) object.castShadow = castShadow;
            });
            resolve(gltf);
        }, undefined, (error) => {
            reject(error);
        });
    });
}