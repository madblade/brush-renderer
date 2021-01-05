import {
    Color,
    DepthTexture,
    WebGLRenderTarget,
    DepthFormat,
    NearestFilter,
    RGBFormat,
    UnsignedShortType, Scene, ShaderMaterial
} from 'three';
import { Pass }       from 'three/examples/jsm/postprocessing/Pass';
import uvgradxv       from '../shaders/uvgradx.vertex.glsl';
import uvgradxf       from '../shaders/uvgradx.fragment.glsl';
import uvgradyv       from '../shaders/uvgrady.vertex.glsl';
import uvgradyf       from '../shaders/uvgrady.fragment.glsl';

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

    // color + depth
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.depthTexture = new DepthTexture(this.WIDTH, this.HEIGHT);
    this.depthTexture.format = DepthFormat;
    this.depthTexture.type = UnsignedShortType;
    this.colorTarget = new WebGLRenderTarget(this.WIDTH, this.HEIGHT, {
        format: RGBFormat,
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
    this.sceneParticle = new Scene();

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

        let oldOverrideMaterial = this.scene.overrideMaterial;
        // renderer.setRenderTarget(this.colorTarget);
        this.scene.overrideMaterial = this.uvGradXMaterial;
        renderer.render(this.scene, this.camera);
        this.scene.overrideMaterial = oldOverrideMaterial;

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
