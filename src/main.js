/**
 * (c) madblade 2021
 */

import {
    AmbientLight,
    FrontSide,
    Mesh,
    MeshPhongMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera, PlaneBufferGeometry, PointLight, PointLightHelper,
    Scene,
    SphereBufferGeometry,
    TorusKnotBufferGeometry,
    Vector3,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

import { load, loadObjects, loadSkinnedMesh, loadWalls } from './loader';

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
let renderer;
let controls;
let lightPosition;

let light;
let lightHelper;
let ambient;
let lights = [];
let mixers = [];

init();
animate();

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

    // Resize renderer.
    let resizeCallback =  () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeCallback, false);
    window.addEventListener('orientationchange', resizeCallback, false);

    controls = new OrbitControls(camera, renderer.domElement);
}

function init()
{
    initScene();

    let walls = loadWalls();
    walls.forEach(w => scene.add(w));

    let objs = loadObjects();
    objs.forEach(o => {
        // Debug
        // let nh = new VertexNormalsHelper(o, 0.1);
        // scene.add(nh);
        // o.material = new MeshBasicMaterial({wireframe: true});
        scene.add(o);
    });

    loadSkinnedMesh(scene,
        // sceneShadows, shadowCasters, lightPosition,
        mixers);
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

    light.position.copy(lightPosition);

    if (mixers.length) {
        mixers.forEach(m => m.update(delta / 1000.));
    }

    // Update camera rotation and position
    controls.update();

    // Perform.
    renderer.render(scene, camera);
}
