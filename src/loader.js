/**
 * Model from https://www.mixamo.com/
 */

import {
    FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader';
import {
    AnimationMixer, Color, FrontSide,
    Group, Mesh, MeshPhongMaterial,
    PlaneBufferGeometry,
    SphereBufferGeometry,
    TorusKnotBufferGeometry
} from 'three';

import fbx from './data/samba.fbx';

function moveMesh(mesh)
{
    mesh.scale.multiplyScalar(0.2);
    // mesh.position.set(5, -25, -10);
    mesh.position.set(0, -25, 0);
}

function loadWalls()
{
    let colors = [
        new Color(1., 1., 1.),

        new Color(1., 1., 1.),

        new Color(1.0, 0.15, 0.05), // r
        new Color(0.3, 1.0, 0.08), // g

        new Color(1., 1., 1.),
    ];

    let planes = [];
    let index = 0;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: colors[index], side: FrontSide })
    ));
    planes[index].position.set(0, -25, 0);
    planes[index].rotation.x = -Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: colors[index], side: FrontSide })
    ));
    planes[index].position.set(0,  0, -25);
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: colors[index], side: FrontSide })
    ));
    planes[index].position.set(-25,  0, 0);
    planes[index].rotation.y = Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: colors[index], side: FrontSide })
    ));
    planes[index].position.set(25,  0, 0);
    planes[index].rotation.y = -Math.PI / 2;
    planes[index++].receiveShadow = true;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: colors[index], side: FrontSide })
    ));
    planes[index].position.set(0,  0, 25);
    planes[index].rotation.y = Math.PI;
    planes[index++].receiveShadow = true;
    return planes;
}

function loadObjects()
{
    let colors = [
        new Color(0.05, 0.3, 1.0),

        0xffff00, // bright yellow

        0xffff00, // bright yellow

        new Color(0.05, 0.3, 1.0),

        0xffff00 // bright yellow
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
    torus.position.set(-15, -10, 20);
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
    torus2.scale.multiplyScalar(0.2);
    torus2.rotation.set(0, Math.PI / 2, 0);
    torus2.position.set(15, -5, 12);
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
        }),
    );
    torus3.scale.multiplyScalar(0.5);
    torus3.rotation.set(0, Math.PI / 2, Math.PI / 2);
    torus3.rotation.set(0, 0, Math.PI / 2);
    torus3.position.set(-15, -5, 15);
    torus3.castShadow = true;
    torus3.receiveShadow = true;

    let sphere = new Mesh(
        new SphereBufferGeometry(5, 32, 32),
        new MeshPhongMaterial({
            color: colors[colorIndex++],
            specular: 1.0
        })
    );
    sphere.position.set(-10, -20, 15);
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

    return [torus2, torus3];
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
                let col = c.material.color;
                if (col.r < 0.1)
                    c.material = new MeshPhongMaterial({
                        color: new Color(0.05, 0.3, 1.0),
                        skinning: true
                    });
                else
                    c.material = new MeshPhongMaterial({
                        color: new Color(0.0, 0.0, 0.0),
                        skinning: true
                    });
            }
        });

        scene.add(container);
        mixers.push(mixer);
    });
}

export { loadSkinnedMesh, loadWalls, loadObjects };
