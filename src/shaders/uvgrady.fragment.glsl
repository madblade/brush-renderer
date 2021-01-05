varying vec2 vUv;

const vec3 black = vec3(0.);
const vec3 white = vec3(1.);

void main()
{
    gl_FragColor = vec4(mix(black, white, vUv.y), 1.0);
}
