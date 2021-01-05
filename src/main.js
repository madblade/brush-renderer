/**
 * (c) madblade 2021
 */

import {
    AmbientLight,
    FrontSide,
    Matrix4,
    Mesh,
    MeshPhongMaterial,
    PCFShadowMap,
    PCFSoftShadowMap,
    PerspectiveCamera, PlaneBufferGeometry, PointLight, PointLightHelper,
    Scene,
    SphereBufferGeometry,
    TorusKnotBufferGeometry,
    Vector3, Vector4, VSMShadowMap,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

import { createShadowCastingMaterial } from './shadow';
import { render } from './render';
import { load } from './loader';
import { getDynamicShadowVolumeGeometry, snapNormals } from './snapper';

// screen size
let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

// shadow map
const SHADOW_MAP_WIDTH = 1024;
const SHADOW_MAP_HEIGHT = 512;

// camera
let VIEW_ANGLE = 90;
let ASPECT = WIDTH / HEIGHT;
let NEAR = 0.1;
let FAR = 5000;

let camera;
let scene;
let sceneShadows;
let renderer;
let controls;
let lightPosition;

let light;
let lightHelper;
let gl;
let ambient;
let shadowCasters = [];
let lights = [];
let mixers = [];

init();
animate();

function addPlanes()
{
    let planes = [];
    let index = 0;
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0xff0000, side: FrontSide })
    ));
    planes[index].position.set(0, -25, 0);
    planes[index].rotation.x = -Math.PI / 2;
    planes[index].receiveShadow = true;
    scene.add(planes[index++]);
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x0000ff, side: FrontSide })
    ));
    planes[index].position.set(0,  0, -25);
    planes[index].receiveShadow = true;
    scene.add(planes[index++]);
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x00ff00, side: FrontSide })
    ));
    planes[index].position.set(-25,  0, 0);
    planes[index].rotation.y = Math.PI / 2;
    planes[index].receiveShadow = true;
    scene.add(planes[index++]);
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x00ff00, side: FrontSide })
    ));
    planes[index].position.set(25,  0, 0);
    planes[index].rotation.y = -Math.PI / 2;
    planes[index].receiveShadow = true;
    scene.add(planes[index++]);
    planes.push(new Mesh(
        new PlaneBufferGeometry(50, 50),
        new MeshPhongMaterial({ color: 0x0000ff, side: FrontSide })
    ));
    planes[index].position.set(0,  0, 25);
    planes[index].rotation.y = Math.PI;
    planes[index].receiveShadow = true;
    scene.add(planes[index++]);
}

function initScene()
{
    renderer = new WebGLRenderer({
        antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    // shadow map
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    scene = new Scene();
    sceneShadows = new Scene();

    camera = new PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 0, 30);

    lightPosition = new Vector3(1, 1, 1);
    light = new PointLight(0xffffff, 1.0);
    light.position.copy(lightPosition);

    // shadow map
    light.castShadow = true;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 100;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    lights.push(light);

    scene.add(light);
    lightHelper = new PointLightHelper(light, 5);
    scene.add(lightHelper);

    // Ambient that'll draw the shadowed region
    ambient = new AmbientLight(0x404040);
    scene.add(ambient);

    addPlanes();

    // Resize renderer.
    let resizeCallback =  () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeCallback, false);
    window.addEventListener('orientationchange', resizeCallback, false);

    controls = new OrbitControls(camera, renderer.domElement);

    // renderer.autoClear = false;
    // renderer.autoClearStencil = false;
    // renderer.autoClearDepth = false;
    // renderer.autoClearColor = false;
    gl = renderer.getContext();
}


function createObjects(isShadow)
{
    let torus = new Mesh(
        new TorusKnotBufferGeometry(
            10, 3,
            200, 50
        ),
        createShadowCastingMaterial(
            isShadow, lightPosition,
            0.0, // no bias for non-convex geometry!
            false
        )
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
        createShadowCastingMaterial(
            isShadow, lightPosition,
            0.0,
            false
        )
    );
    torus2.scale.multiplyScalar(0.5);
    torus2.rotation.set(0, Math.PI / 2, 0);
    torus2.position.set(15, 5, 0);
    torus2.castShadow = true;
    torus2.receiveShadow = true;

    let torus3 = new Mesh(
        new TorusKnotBufferGeometry(
            10, 3,
            200, 128,
        ),
        // new TorusBufferGeometry(15, 5, 32, 32),
        createShadowCastingMaterial(isShadow, lightPosition, 0.0, false)
    );
    torus3.scale.multiplyScalar(0.5);
    torus3.rotation.set(0, Math.PI / 2, Math.PI / 2);
    torus3.rotation.set(0, 0, Math.PI / 2);
    torus3.position.set(-15, 5, 10);
    torus3.castShadow = true;
    torus3.receiveShadow = true;

    let sphere = new Mesh(
        new SphereBufferGeometry(5, 32, 32),
        createShadowCastingMaterial(
            isShadow, lightPosition,
            -0.1, // small bias for very smooth convex geometries!
            false
        )
    );
    sphere.position.set(5, -15, 15);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    let sphere2 = new Mesh(
        new SphereBufferGeometry(5, 32, 32),
        createShadowCastingMaterial(isShadow, lightPosition, -0.1, true)
    );
    sphere2.scale.multiplyScalar(1.5);
    sphere2.position.set(-10, -5, -15);
    sphere2.castShadow = true;
    sphere2.receiveShadow = true;

    return [torus, torus2, torus3, sphere, sphere2];
}

function init()
{
    initScene();

    let objs = createObjects(false);
    objs.forEach(o => {
        // Debug
        // let nh = new VertexNormalsHelper(o, 0.1);
        // scene.add(nh);
        // o.material = new MeshBasicMaterial({wireframe: true});
        scene.add(o);
    });

    shadowCasters = createObjects(true);
    shadowCasters.forEach(sc => {
        if (sc.material.uniforms.isApproximate.value === true) {
            sc.geometry.computeVertexNormals();
            snapNormals(sc, 100000.0);
        } else {
            sc.geometry = getDynamicShadowVolumeGeometry(sc.geometry);
        }
        // Debug
        // let nh2 = new VertexNormalsHelper(sc, 0.5, 0x00ff00);
        // scene.add(nh2);
        // scene.add(sc);
        sceneShadows.add(sc);
    });

    load(scene, sceneShadows, shadowCasters, lightPosition, mixers);
}

let time = 0;
let lastTime = window.performance.now();
function animate()
{
    requestAnimationFrame(animate);

    let now = window.performance.now();
    let delta = now - lastTime;
    lastTime = now;
    time += delta * 0.001;
    // time = 0.001;
    lightPosition.x = Math.sin(time) * 10.0;
    lightPosition.z = Math.cos(time) * 10.0 + 4.0;
    lightPosition.y = Math.cos(time) * Math.sin(time) * 10.0;

    // Update light positions from inverse model matrices, for each shadow model.
    shadowCasters.forEach(sc => {
        let tr = sc.matrixWorld;
        let im = new Matrix4();
        // im.getInverse(tr);
        im.copy(tr).invert();
        let vec = new Vector4();
        vec.set(lightPosition.x, lightPosition.y, lightPosition.z, 1.0);
        vec.applyMatrix4(im);
        sc.material.uniforms.lightPosition.value = vec;
    });
    light.position.copy(lightPosition);

    if (mixers.length) {
        mixers.forEach(m => m.update(delta / 1000.));
    }

    // Update camera rotation and position
    controls.update();

    // Perform.
    // render(gl, renderer, scene, sceneShadows, camera, lights);
    renderer.render(scene, camera);
}
