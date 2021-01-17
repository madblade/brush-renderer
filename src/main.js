/**
 * (c) madblade 2021
 */

import {
    ACESFilmicToneMapping,
    AmbientLight,
    PCFSoftShadowMap,
    PerspectiveCamera, PointLight,
    Scene, sRGBEncoding,
    Vector3,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

import { loadObjects, loadSkinnedMesh, loadWalls } from './loader';
import { EffectComposer }                          from 'three/examples/jsm/postprocessing/EffectComposer';
import { BrushPass }                               from './passes/BrushPass';
import { GUI }                                     from 'three/examples/jsm/libs/dat.gui.module';

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
let ambient;
let lights = [];
let mixers = [];

// composers
let composer;
let brushPass;

// gui
let brushSize = 10.;
let brushPower = 2.;
let brushOrientation = 'grad v';
let brushNumber = 100000;
let settings = {
    number: brushNumber,
    orientation: brushOrientation,
    size: brushSize,
    attenuation: brushPower,
    drawOver: true,
    animate: true,
};
let isDoingCountdown = false;
let timeout = null;
function updateParticleNumber()
{
    console.log('Rebuilding brushes…');
    brushPass.rebuildParticles(settings.number);
}
function updateUniforms()
{
    if (settings.number !== brushNumber)
    {
        brushNumber = settings.number;
        if (isDoingCountdown) clearTimeout(timeout);
        else isDoingCountdown = true;
        timeout = setTimeout(updateParticleNumber, 200);
    }

    if (settings.brushOrientation === 'grad v')
    {
        brushOrientation = settings.brushOrientation;
        brushPass.uvGradXMaterial.uniforms.useV.value = true;
        brushPass.uvGradXMaterial.uniformsNeedUpdate = true;
        brushPass.uvGradXMaterial2.uniforms.useV.value = true;
        brushPass.uvGradXMaterial2.uniformsNeedUpdate = true;
        brushPass.brushMaterial.uniforms.horizontalStrokes.value = false;
        // brushPass.brushMaterial.uniformsNeedUpdate = true;
    }
    else if (settings.brushOrientation === 'grad u')
    {
        brushOrientation = settings.brushOrientation;
        brushPass.uvGradXMaterial.uniforms.useV.value = false;
        brushPass.uvGradXMaterial.uniformsNeedUpdate = true;
        brushPass.uvGradXMaterial2.uniforms.useV.value = false;
        brushPass.uvGradXMaterial2.uniformsNeedUpdate = true;
        brushPass.brushMaterial.uniforms.horizontalStrokes.value = false;
        // brushPass.brushMaterial.uniformsNeedUpdate = true;
    }
    else if (settings.brushOrientation === 'horizontal')
    {
        brushPass.brushMaterial.uniforms.horizontalStrokes.value = true;
        // brushPass.brushMaterial.uniformsNeedUpdate = true;
    }

    brushPass.brushMaterial.uniforms.attenuation.value = settings.attenuation;
    brushPass.brushMaterial.uniforms.pointSize.value = settings.size;
    brushPass.brushMaterial.uniformsNeedUpdate = true;
    brushPass.drawBrushesOverScene = settings.drawOver;
}
function initGUI()
{
    const gui = new GUI();
    const folder1 = gui.addFolder('Brush settings');
    // const folder2 = gui.addFolder('Brush settings');
    const brushOrientations = [
        'horizontal', 'grad u', 'grad v'
    ];
    folder1.add(settings, 'number', 1000, 150000, 100).onChange(function(value)
    {
        settings.number = value;
        updateUniforms();
    });
    folder1.add(settings, 'orientation').options(brushOrientations).onChange(function(value)
    {
        settings.brushOrientation = value;
        updateUniforms();
    });
    folder1.add(settings, 'size', 1, 20, 1).onChange(function(value)
    {
        settings.size = value;
        updateUniforms();
    });
    folder1.add(settings, 'attenuation', 1, 3, 0.1).onChange(function(value)
    {
        settings.attenuation = value;
        updateUniforms();
    });
    folder1.add(settings, 'drawOver').onChange(function(value)
    {
        settings.drawOver = value;
        updateUniforms();
    });
    folder1.add(settings, 'animate').onChange(function(value)
    {
        settings.animate = value;
        updateUniforms();
    });
    gui.open();
}

function initRenderer()
{
    renderer = new WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true
    });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = sRGBEncoding;
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
    brushPass = new BrushPass(scene, camera, settings);
    composer.addPass(brushPass);
}

function initScene()
{
    scene = new Scene();
    camera = new PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 0, 30);
    scene.add(camera);

    lightPosition = new Vector3(1, 10, 10);
    light = new PointLight(0xffffff, 0.5);
    light.position.copy(lightPosition);
    light.castShadow = true;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 100;
    light.shadow.bias = 0.0001;
    light.shadow.radius = 10;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    lights.push(light);
    scene.add(light);

    // Ambient for the shadowed region
    ambient = new AmbientLight(0x404040);
    scene.add(ambient);

    // user input
    controls = new OrbitControls(camera, renderer.domElement);
}

let staticMeshes = [];
function init()
{
    initRenderer();
    initScene();
    initComposer();
    initGUI();

    let walls = loadWalls();
    walls.forEach(w => scene.add(w));

    let objs = loadObjects();
    objs.forEach(o => {
        scene.add(o);
        staticMeshes.push(o);
    });

    loadSkinnedMesh(scene, mixers);
}

let time = 0;
let lastTime = window.performance.now();
function step(i, j)
{
    return i > j;
}
function animate()
{
    requestAnimationFrame(animate);

    if (settings.animate)
    {
        let now = window.performance.now();
        let delta = now - lastTime;
        lastTime = now;
        time += delta * 0.001;
        lightPosition.x = Math.sin(time) * 10.0;
        lightPosition.z = 10 + Math.cos(time) * 10.0 + 4.0;
        lightPosition.y = 10 + Math.cos(time) * Math.sin(time) * 10.0;

        for (let i = 0; i < staticMeshes.length; ++i)
        {
            let o = staticMeshes[i];
            o.rotation.x += 0.02 * step(i % 3, 0);
            o.rotation.y += 0.02 * step((i + 1) % 3, 0);
            o.rotation.z += 0.02 * step((i + 2) % 3, 0);
        }
        light.position.copy(lightPosition);
        if (mixers.length) {
            mixers.forEach(m => m.update(delta / 1000.));
        }
    } else {
        lastTime = window.performance.now();
    }

    // Update camera rotation and position
    controls.update();

    // Perform.
    composer.render();
}

init();
animate();
