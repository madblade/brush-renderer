import {
    DepthTexture,
    WebGLRenderTarget,
    DepthFormat,
    NearestFilter,
    RGBFormat,
    UnsignedShortType,
    CustomBlending, MaxEquation,
    Scene, ShaderMaterial, PerspectiveCamera, TextureLoader,
    BufferGeometry,
    Points, Float32BufferAttribute, Vector2, UniformsUtils, ShaderLib,
    sRGBEncoding,
} from 'three';
import { Pass }       from 'three/examples/jsm/postprocessing/Pass';
import uvgradxv       from '../shaders/uvgradx.vertex.glsl';
import uvgradxf       from '../shaders/uvgradx.fragment.glsl';
import brushTexture   from '../../img/brush-stroke-dry-256.png';
import brushVertex    from '../shaders/brush.vertex.glsl';
import brushFragment  from '../shaders/brush.fragment.glsl';

let BrushPass = function(
    objectScene,
    camera,
    settings,
)
{
    Pass.call(this);

    this.scene = objectScene;
    this.camera = camera;
    this.needsSwap = false;
    this.NB_BRUSHES = settings.number;
    this.drawBrushesOverScene = settings.drawOver;

    // color + depth
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.depthTexture = new DepthTexture(this.WIDTH, this.HEIGHT);
    this.depthTexture.format = DepthFormat;
    this.depthTexture.type = UnsignedShortType;
    this.colorTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {
        format: RGBFormat,
        encoding: sRGBEncoding,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        generateMipmaps: false,
        stencilBuffer: false,
        depthBuffer: true,
        depthTexture: this.depthTexture
    });

    // grad uv
    this.xFieldTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {
        format: RGBFormat,
        encoding: sRGBEncoding,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        generateMipmaps: false,
        stencilBuffer: false,
        depthBuffer: false
    });
    this.uvGradXMaterial = new ShaderMaterial({
        lights: true,
        uniforms:
            UniformsUtils.merge([
                ShaderLib.lambert.uniforms,
                { useV: { value: settings.orientation === 'grad v' } }
            ]),
        vertexShader: `
                #include <common>
                ${uvgradxv}
            `,
        fragmentShader: uvgradxf,
        transparent: true,
    });
    this.uvGradXMaterial2 = new ShaderMaterial({
        lights: true,
        uniforms:
            UniformsUtils.merge([
                ShaderLib.lambert.uniforms,
                { useV: { value: settings.orientation === 'grad v' } }
            ]),
        vertexShader: `
                #include <common>
                ${uvgradxv}
            `,
        fragmentShader: uvgradxf,
        skinning: true,
        transparent: true
    });

    // particles
    this.sceneBrush = new Scene();
    this.cameraBrush = new PerspectiveCamera(40, this.WIDTH / this.HEIGHT, 1, 10000);
    this.cameraBrush.position.z = 300;
    this.brushMaterial = new ShaderMaterial({
        uniforms: {
            resolution: {
                value: new Vector2(
                    this.WIDTH * window.devicePixelRatio,
                    this.HEIGHT * window.devicePixelRatio
                )
            },
            brushTexture: { value: new TextureLoader().load(brushTexture) },
            colorTexture: { value: this.colorTarget.texture },
            depthTexture: { value: this.colorTarget.depthTexture },
            xFieldTexture: { value: this.xFieldTarget.texture },
            horizontalStrokes: { value: settings.brushOrientation === 'horizontal' },
            attenuation: { value: settings.attenuation },
            pointSize: { value: settings.size }
        },
        vertexShader: brushVertex,
        fragmentShader: brushFragment,
        blending: CustomBlending,
        blendEquation: MaxEquation,
        depthTest: false,
        transparent: true,
        vertexColors: false
    });
    const radius = 110;
    this.brushGeometry = new BufferGeometry();
    const positions = [];
    let ratio = this.WIDTH / this.HEIGHT;
    // let NB_PER_LINE = Math.sqrt(this.NB_BRUSHES);
    // let NB_LINES = Math.sqrt(this.NB_BRUSHES);
    // for (let i = 0; i < NB_LINES; ++i)
    // {
    //     for (let j = 0; j < NB_PER_LINE; ++j)
    //     {
    //         positions.push(110 * ratio * ((j / NB_PER_LINE + Math.random() * 0.005) * 2 - 1));
    //         positions.push(110 * ((i / NB_LINES + Math.random() * 0.005) * 2 - 1));
    //         positions.push(0.0);
    //     }
    // }
    for (let i = 0; i < this.NB_BRUSHES; ++i)
    {
        positions.push((Math.random() * 2 - 1) * radius * ratio);
        positions.push((Math.random() * 2 - 1) * radius);
        positions.push(0.0);
    }

    this.brushGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.particleSystem = new Points(this.brushGeometry, this.brushMaterial);
    this.sceneBrush.add(this.particleSystem);

    // legacy
    this.clear = false;
};

BrushPass.prototype = Object.assign(Object.create(Pass.prototype), {

    constructor: BrushPass,

    rebuildParticles(nbParticles)
    {
        this.sceneBrush.remove(this.particleSystem);

        this.NB_BRUSHES = nbParticles;
        this.brushGeometry = new BufferGeometry();
        let ratio = this.WIDTH / this.HEIGHT;
        const positions = [];
        for (let i = 0; i < this.NB_BRUSHES; ++i) {
            positions.push((Math.random() * 2 - 1) * 110 * ratio);
            positions.push((Math.random() * 2 - 1) * 110);
            positions.push(0.0);
        }
        this.brushGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        this.particleSystem = new Points(this.brushGeometry, this.brushMaterial);
        this.sceneBrush.add(this.particleSystem);
    },

    render(renderer)
    {
        let oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.autoClearColor = false;
        renderer.autoClearDepth = false;

        renderer.setRenderTarget(this.colorTarget);
        renderer.clearDepth(); // clear color target

        // render color + depth
        renderer.render(this.scene, this.camera);

        if (this.drawBrushesOverScene)
        {
            renderer.toneMappingExposure = 0.5;
            renderer.setRenderTarget(null);
            renderer.render(this.scene, this.camera);
            renderer.toneMappingExposure = 0.8;
        }

        // render grad uv
        let oldMaterials = {};
        this.scene.traverse(o => {
            if (o.isMesh && !o.isSkinnedMesh)
            {
                oldMaterials[o.uuid] = o.material;
                o.material = this.uvGradXMaterial;
            } else if (o.isSkinnedMesh)
            {
                oldMaterials[o.uuid] = o.material;
                o.material = this.uvGradXMaterial2;
            }
        });
        renderer.setRenderTarget(this.xFieldTarget);
        // renderer.setRenderTarget(null);
        renderer.render(this.scene, this.camera);
        this.scene.traverse(o => {
            if (o.isMesh)
            {
                o.material = oldMaterials[o.uuid];
            }
        });

        // render brush scene
        renderer.setRenderTarget(null);
        renderer.render(this.sceneBrush, this.cameraBrush);

        renderer.autoClear = oldAutoClear;
    },
});

export { BrushPass };
