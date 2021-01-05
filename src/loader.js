/**
 * Model from https://www.mixamo.com/
 */

import {
    FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader';
import {
    AnimationMixer,
    Group
} from 'three';

import fbx from './data/samba.fbx';
import {createShadowCastingMaterial} from './shadow';
import { getDynamicShadowVolumeGeometry, snapNormals } from './snapper';

function moveMesh(mesh)
{
    mesh.scale.multiplyScalar(0.1);
    mesh.position.set(5, -25, -10);
}

function load(
    scene,
    sceneShadows, shadowCasters, lightPosition,
    mixers
)
{
    new FBXLoader().load(fbx, mesh =>
    {
        let mixer = new AnimationMixer(mesh);
        mixer.clipAction(mesh.animations[0]).play();

        moveMesh(mesh);

        let isApproximate = false;
        let container = new Group();
        container.add(mesh);
        mesh.traverse(c => {
            if (c.isMesh)
            {
                let vMesh = new c.constructor(
                    isApproximate ? c.geometry : getDynamicShadowVolumeGeometry(c.geometry),
                    createShadowCastingMaterial(true, lightPosition, 0.0, isApproximate)
                ); // clone mesh

                if (isApproximate)
                    snapNormals(vMesh, 10000.0);

                shadowCasters.push(vMesh);
                sceneShadows.add(vMesh);

                c.castShadow = true;
                c.receiveShadow = true;
                vMesh.material.skinning = c.isSkinnedMesh;
                vMesh.skeleton = c.skeleton;
                moveMesh(vMesh);
            }
        });

        scene.add(container);
        mixers.push(mixer);
    });
}

export { load };
