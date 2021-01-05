
uniform vec3 lightPosition;
uniform bool isShadow;
uniform bool isApproximate;
uniform float bias;

varying vec3 vViewPosition;

varying vec3 vLightFront;
varying vec3 vIndirectFront;
#ifdef DOUBLE_SIDED
varying vec3 vLightBack;
varying vec3 vIndirectBack;
#endif
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars_begin>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>

    // #include <project_vertex>
    vec3 nn = objectNormal;
    vec3 translated = transformed;
    vec3 nlight = normalize(lightPosition);
    float d = dot(normalize(nn), nlight);

    if (isShadow)
    {
        vec3 infty;
        if (d < bias) {
            infty = translated - nlight * 10000.0;
        } else {
            vec3 correction = isApproximate ? normalize(nn) : nlight;
            infty = translated - correction * 0.1; // To expose
        }
        translated = infty;
    }
    vec4 mvPosition =  modelViewMatrix * vec4(translated, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <lights_lambert_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
}
