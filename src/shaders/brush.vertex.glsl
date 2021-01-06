
//attribute float size;
//attribute float rotation;
//uniform vec3 ca;

uniform vec2 resolution;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D xFieldTexture;

varying vec4 vColor;
varying float vRotation;
varying float vPointSize;
varying float depth;
varying float vTex;

// Sobel kernel
const mat3 Gx = mat3(-1., -2., -1., 0., 0., 0., 1., 2., 1.);
const mat3 Gy = mat3(-1., 0., 1., -2., 0., 2., -1., 0., 1.);

void main()
{
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 mvpPosition = projectionMatrix * mvPosition;
    vec3 ndc = mvpPosition.xyz / mvpPosition.w;
    vec2 viewportCoords = ndc.xy * 0.5 + 0.5;
    // vec2 pixelCoords = viewportCoords * resolution;

    // Compute color
    // vec2 sampleCoord = (floor(viewportCoords) + 0.5) / resolution;
    // vColor = vec3(texture2D(colorTexture, sampleCoord).rgb);
    vColor = texture2D(colorTexture, viewportCoords);
    // vColor = vec3(texture2D(colorTexture, vec2(0.2,0.2)).rgb);
    // vColor = vec3(1.0);

    // Rotation from grad of uv field
    vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
    vRotation = 0.;
//     vTex = texture2D(xFieldTexture, viewportCoords).x;
    // Sobel convolution
    // c1
    float tx0y0 = texture2D(xFieldTexture, viewportCoords + texel * vec2(-1., -1.)).r;
    float tx0y1 = texture2D(xFieldTexture, viewportCoords + texel * vec2(-1., 0.)).r;
    float tx0y2 = texture2D(xFieldTexture, viewportCoords + texel * vec2(-1., 1.)).r;
    // c2
    float tx1y0 = texture2D(xFieldTexture, viewportCoords + texel * vec2(0., -1.)).r;
    float tx1y1 = texture2D(xFieldTexture, viewportCoords + texel * vec2(0., 0.)).r;
    float tx1y2 = texture2D(xFieldTexture, viewportCoords + texel * vec2(0., 1.)).r;
    // c3
    float tx2y0 = texture2D(xFieldTexture, viewportCoords + texel * vec2(1., -1.)).r;
    float tx2y1 = texture2D(xFieldTexture, viewportCoords + texel * vec2(1., 0.)).r;
    float tx2y2 = texture2D(xFieldTexture, viewportCoords + texel * vec2(1., 1.)).r;
    // grad
    float gradX =
        Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
        Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
        Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;
    float gradY =
        Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
        Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
        Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;
    float mag = sqrt((gradX * gradX) + (gradY * gradY));
    vTex = mag;
//    vRotation = 1.5 / 2.0;
//    if (mag > 0.05)
        vRotation = atan(gradX, gradY);
//    vRotation = 0.;
//    else
//        vRotation = atan(gradY, gradX);
//    vRotation = atan(gradY, gradX);
//        vRotation += 1.5;
//    vRotation += mag * 1.5;
    // if grad > thresh -> cross the grad
    // else -> follow grad

//    if (!(mag < 0.015 || mag > 0.02))
//        vRotation = atan(gradX, gradY);

    // TODO different textures

    // Point size from depth
    vPointSize = 40.;
    depth = 1. - texture2D(depthTexture, viewportCoords).x;
    vPointSize *= 1. + 4.0 * pow(depth, 4.0);

//    if (mag < 0.1)
//        depth = 0.;
//    if (mag < 0.015 || mag > 0.02)
//        depth = 0.;
//    if (mag > 0.02)
//        depth = 0.;

    // Point size
    gl_PointSize = vPointSize * ( 300.0 / length( mvPosition.xyz ) );
    vPointSize = gl_PointSize;

    // Output
    gl_Position = mvpPosition;
}
