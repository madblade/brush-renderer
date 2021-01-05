
uniform vec3 color;
uniform sampler2D brushTexture;

varying vec3 vColor;
varying float vRotation;
varying float vPointSize;

void main()
{
    float mid = 0.5;
    vec2 rotated = vec2(
        cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,
        cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid
    );
    vec4 rotatedTexture = texture2D(brushTexture,  rotated);
    gl_FragColor = vec4(color * vColor, 1.0) * rotatedTexture;
}
