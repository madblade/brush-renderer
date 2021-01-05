import {
    Color,
    DepthTexture,
    WebGLRenderTarget,
    DepthFormat,
    NearestFilter,
    RGBFormat,
    UnsignedShortType,
    Scene, ShaderMaterial, PerspectiveCamera, TextureLoader,
    NoBlending, BufferGeometry,
    Points, Float32BufferAttribute, Vector2
} from 'three';
import { Pass }       from 'three/examples/jsm/postprocessing/Pass';
import uvgradxv       from '../shaders/uvgradx.vertex.glsl';
import uvgradxf       from '../shaders/uvgradx.fragment.glsl';
import uvgradyv       from '../shaders/uvgrady.vertex.glsl';
import uvgradyf       from '../shaders/uvgrady.fragment.glsl';
// import brushTexture   from '../../img/brush-stroke-dry.png';
import brushTexture   from '../../img/snowflake1.png';
import brushVertex    from '../shaders/brush.vertex.glsl';
import brushFragment  from '../shaders/brush.fragment.glsl';

let BrushPass = function(
    objectScene,
    camera,
    overrideMaterial, clearColor, clearAlpha
)
{
    Pass.call(this);

    this.scene = objectScene;
    this.camera = camera;
    this.needsSwap = false;
    this.NB_BRUSHES = 1000;

    // color + depth
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.depthTexture = new DepthTexture(this.WIDTH, this.HEIGHT);
    this.depthTexture.format = DepthFormat;
    this.depthTexture.type = UnsignedShortType;
    this.colorTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {
        format: RGBFormat,
        // minFilter: NearestFilter,
        // magFilter: NearestFilter,
        generateMipmaps: false,
        stencilBuffer: false,
        // depthBuffer: true,
        // depthTexture: this.depthTexture
    });
    // TODO render to depth target
    //   https://github.com/mrdoob/three.js/blob/master/examples/webgl_depth_texture.html
    this.depthTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {

    });

    // grad uv
    this.xFieldTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {
        format: RGBFormat,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        generateMipmaps: false,
        stencilBuffer: false,
        depthBuffer: false
    });
    this.uvGradXMaterial = new ShaderMaterial({
        uniforms: {},
        vertexShader: uvgradxv,
        fragmentShader: uvgradxf,
    });
    this.uvGradYMaterial = new ShaderMaterial({
        uniforms: {},
        vertexShader: uvgradyv,
        fragmentShader: uvgradyf,
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
            xFieldTexture: { value: this.xFieldTarget.texture }
        },
        vertexShader: brushVertex,
        fragmentShader: brushFragment,
        blending: NoBlending,
        depthTest: false, // todo check perf
        transparent: true,
        vertexColors: true
    });
    const radius = 200;
    this.brushGeometry = new BufferGeometry();
    const positions = [];
    // const sizes = [];
    for (let i = 0; i < this.NB_BRUSHES; ++i) {
        positions.push((Math.random() * 2 - 1) * radius);
        positions.push((Math.random() * 2 - 1) * radius);
        positions.push((Math.random() * 2 - 1) * radius);
        // sizes.push(20);
    }

    this.brushGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    // this.brushGeometry.setAttribute('size', new Float32BufferAttribute(sizes, 1).setUsage(DynamicDrawUsage));
    const particleSystem = new Points(this.brushGeometry, this.brushMaterial);
    this.sceneBrush.add(particleSystem);

    // legacy
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha !== undefined ? clearAlpha : 0;
    this.clear = false;
    this.clearDepth = false;
    this._oldClearColor = new Color();
};

BrushPass.prototype = Object.assign(Object.create(Pass.prototype), {

    constructor: BrushPass,

    render(renderer)
    {
        let oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.autoClearColor = false;
        renderer.autoClearDepth = false;

        renderer.clear();
        // let oldOverrideMaterial = this.scene.overrideMaterial;
        renderer.setRenderTarget(this.colorTarget);
        renderer.clear();
        // this.scene.overrideMaterial = this.uvGradXMaterial;
        renderer.render(this.scene, this.camera);
        // this.scene.overrideMaterial = oldOverrideMaterial;

        renderer.setRenderTarget(null);
        renderer.render(this.sceneBrush, this.cameraBrush);

        // TODO particle perturbation

        renderer.autoClear = oldAutoClear;
    },

    renderLegacy(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */)
    {
        let oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        let oldClearAlpha;
        let oldOverrideMaterial;

        if (this.overrideMaterial !== undefined)
        {
            oldOverrideMaterial = this.scene.overrideMaterial;
            this.scene.overrideMaterial = this.overrideMaterial;
        }

        if (this.clearColor)
        {
            renderer.getClearColor(this._oldClearColor);
            oldClearAlpha = renderer.getClearAlpha();
            renderer.setClearColor(this.clearColor, this.clearAlpha);
        }

        if (this.clearDepth)
            renderer.clearDepth();

        renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

        if (this.clear)
            renderer.clear(
                renderer.autoClearColor,
                renderer.autoClearDepth,
                renderer.autoClearStencil
            );
        renderer.render(this.scene, this.camera);

        if (this.clearColor)
            renderer.setClearColor(this._oldClearColor, oldClearAlpha);

        if (this.overrideMaterial !== undefined)
            this.scene.overrideMaterial = oldOverrideMaterial;

        renderer.autoClear = oldAutoClear;
    }
});

export { BrushPass };
