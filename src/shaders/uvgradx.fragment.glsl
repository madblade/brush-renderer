
uniform bool useV;
varying vec2 vUv;

const vec3 black = vec3(0.);
const vec3 white = vec3(1.);

void main()
{
    float x = vUv.x;
    if (useV) x = vUv.y;
    gl_FragColor = vec4(mix(black, white, x), 1.0);
}
