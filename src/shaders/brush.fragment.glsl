
uniform sampler2D brushTexture;

varying vec4 vColor;
varying float vRotation;
varying float vPointSize;
varying float depth;

void main()
{
    if (depth == 0.) discard;
    float mid = 0.5;
    vec2 rotated = vec2(
        cos(vRotation) * (gl_PointCoord.x - mid) + sin(vRotation) * (gl_PointCoord.y - mid) + mid,
        cos(vRotation) * (gl_PointCoord.y - mid) - sin(vRotation) * (gl_PointCoord.x - mid) + mid
    );
    vec4 rotatedTexture = texture2D(brushTexture, rotated);
    float norm = rotatedTexture.x + rotatedTexture.y + rotatedTexture.z;
    gl_FragColor = vec4(vColor.xyz, 1.0) * rotatedTexture;
}
