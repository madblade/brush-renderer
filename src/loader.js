/**
 * Model from https://www.mixamo.com/
 */

import {
    FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader';
import {
    AnimationMixer, FrontSide,
    Group, Mesh, MeshPhongMaterial, PlaneBufferGeometry, SphereBufferGeometry, TorusKnotBufferGeometry
} from 'three';

import fbx from './data/samba.fbx';

function moveMesh(mesh)
{
    mesh.scale.multiplyScalar(0.2);
    mesh.position.set(5, -25, -10);
}

function loadWalls()
{
    let planes = [];
    let index = 0;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0xff0000, side: FrontSide })
    ));
    planes[index].position.set(0, -25, 0);
    planes[index].rotation.x = -Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x0000ff, side: FrontSide })
    ));
    planes[index].position.set(0,  0, -25);
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x00ff00, side: FrontSide })
    ));
    planes[index].position.set(-25,  0, 0);
    planes[index].rotation.y = Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x00ff00, side: FrontSide })
    ));
    planes[index].position.set(25,  0, 0);
    planes[index].rotation.y = -Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x0000ff, side: FrontSide })
    ));
    planes[index].position.set(0,  0, 25);
    planes[index].rotation.y = Math.PI;
    planes[index++].receiveShadow = true;
    return planes;
}

function loadObjects()
{
    let colors = [
        0xff0000,
        0xaaff00,
        0xaaaa00,
        0x00a0a0,
        0xffff00
    ];
    let colorIndex = 0;

    let torus = new Mesh(
        new TorusKnotBufferGeometry(
            10, 3,
            200, 50
        ),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    torus.scale.multiplyScalar(0.6);
    torus.position.set(-5, -10, 5);
    torus.castShadow = true;
    torus.receiveShadow = true;

    let torus2 = new Mesh(
        new TorusKnotBufferGeometry(
            10, 3,
            200, 50
        ),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    torus2.scale.multiplyScalar(0.5);
    torus2.rotation.set(0, Math.PI / 2, 0);
    torus2.position.set(15, 5, 10);
    torus2.castShadow = true;
    torus2.receiveShadow = true;

    let torus3 = new Mesh(
        new TorusKnotBufferGeometry(
            10, 3,
            200, 128,
        ),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    torus3.scale.multiplyScalar(0.5);
    torus3.rotation.set(0, Math.PI / 2, Math.PI / 2);
    torus3.rotation.set(0, 0, Math.PI / 2);
    torus3.position.set(-15, 5, 10);
    torus3.castShadow = true;
    torus3.receiveShadow = true;

    let sphere = new Mesh(
        new SphereBufferGeometry(5, 32, 32),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    sphere.position.set(5, -15, 15);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    let sphere2 = new Mesh(
        new SphereBufferGeometry(5, 32, 32),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    sphere2.scale.multiplyScalar(1.5);
    sphere2.position.set(-10, -5, -15);
    sphere2.castShadow = true;
    sphere2.receiveShadow = true;

    return [torus, torus2, torus3, sphere, sphere2];
}

function loadSkinnedMesh(
    scene,
    mixers
)
{
    new FBXLoader().load(fbx, mesh =>
    {
        let mixer = new AnimationMixer(mesh);
        mixer.clipAction(mesh.animations[0]).play();
        moveMesh(mesh);

        let container = new Group();
        container.add(mesh);
        mesh.traverse(c => {
            if (c.isMesh)
            {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });

        scene.add(container);
        mixers.push(mixer);
    });
}

export { loadSkinnedMesh, loadWalls, loadObjects };
