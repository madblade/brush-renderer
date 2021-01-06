
uniform vec3 color;
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
//    vec4 rotatedTexture = texture2D(brushTexture, rotated);
    vec4 rotatedTexture = texture2D(brushTexture, gl_PointCoord);
    float norm = rotatedTexture.x + rotatedTexture.y + rotatedTexture.z;
//    float alpha = step(0.1, norm);// * vColor.w;
//    if (norm < 0.2) discard;
    gl_FragColor = vec4(vColor.xyz, 1.0) * rotatedTexture;

//    gl_FragColor = vec4(vec3(depth), 1.0);
//    gl_FragColor.r = depth;
//    gl_FragColor.a = 1.0;
//    gl_FragColor.w = alpha;
//    gl_FragColor = vec4(vColor.xyz * rotatedTexture, vColor.w);
//    gl_FragColor = vec4(1.0);
}
