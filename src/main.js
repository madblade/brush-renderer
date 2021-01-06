/**
 * (c) madblade 2021
 */

import {
    AmbientLight,
    PCFSoftShadowMap,
    PerspectiveCamera, PointLight, PointLightHelper,
    Scene,
    Vector3,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

import { loadObjects, loadSkinnedMesh, loadWalls } from './loader';
import { EffectComposer }                          from 'three/examples/jsm/postprocessing/EffectComposer';
import { GlitchPass }                              from 'three/examples/jsm/postprocessing/GlitchPass';
import { RenderPass }                              from 'three/examples/jsm/postprocessing/RenderPass';
import { LuminosityShader }                        from 'three/examples/jsm/shaders/LuminosityShader';
import { ShaderPass }                              from 'three/examples/jsm/postprocessing/ShaderPass';
import { SobelOperatorShader }                     from 'three/examples/jsm/shaders/SobelOperatorShader';
import { BokehDepthShader }                        from 'three/examples/jsm/shaders/BokehShader2';
import { BokehPass }                               from 'three/examples/jsm/postprocessing/BokehPass';
import { BrushPass }                               from './passes/BrushPass';

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

// light & animation
let light;
let lightHelper;
let ambient;
let lights = [];
let mixers = [];

// composers
let composer;

init();
animate();

function initRenderer()
{
    renderer = new WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    let resizeCallback =  () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeCallback, false);
    window.addEventListener('orientationchange', resizeCallback, false);
}

function initComposer()
{
    composer = new EffectComposer(renderer);
    // const renderPass = new RenderPass(scene, camera);
    // composer.addPass(renderPass);
    // const glitchPass = new GlitchPass();
    // composer.addPass(glitchPass);

    // const grayScalePass = new ShaderPass(LuminosityShader);
    // composer.addPass(grayScalePass);

    // const sobelPass = new ShaderPass(SobelOperatorShader);
    // sobelPass.uniforms['resolution'].value.x = window.innerWidth * window.devicePixelRatio;
    // sobelPass.uniforms['resolution'].value.y = window.innerHeight * window.devicePixelRatio;
    // composer.addPass(sobelPass);

    const brushPass = new BrushPass(scene, camera);
    composer.addPass(brushPass);
}

function initScene()
{
    scene = new Scene();
    camera = new PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 0, 30);
    scene.add(camera);

    lightPosition = new Vector3(1, 1, 1);
    light = new PointLight(0xffffff, 1.0);
    light.position.copy(lightPosition);
    light.castShadow = true;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 100;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    lights.push(light);
    scene.add(light);
    // lightHelper = new PointLightHelper(light, 5);
    // scene.add(lightHelper);

    // Ambient for the shadowed region
    ambient = new AmbientLight(0x404040);
    scene.add(ambient);

    // user input
    controls = new OrbitControls(camera, renderer.domElement);
}

function init()
{
    initRenderer();
    initScene();
    initComposer();

    let walls = loadWalls();
    walls.forEach(w => scene.add(w));

    let objs = loadObjects();
    objs.forEach(o => {
        scene.add(o);
    });

    // loadSkinnedMesh(scene, mixers);
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
    composer.render();
    // renderer.render(scene, camera);
}
