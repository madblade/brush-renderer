
//attribute float size;
//attribute float rotation;
//uniform vec3 ca;

uniform vec2 resolution;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D xFieldTexture;

varying vec3 vColor;
varying float vRotation;
varying float vPointSize;

void main()
{
    //    vColor = ca;
    //    vRotation = rotation;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 mvpPosition = projectionMatrix * mvPosition;
    vec3 ndc = mvpPosition.xyz / mvpPosition.w;
    vec2 viewportCoords = ndc.xy * 0.5 + 0.5;
    vec2 pixelCoords = viewportCoords * resolution;

    // Compute color
    vec2 sampleCoord = (floor(viewportCoords) + 0.5) / resolution;
    vColor = vec3(texture2D(colorTexture, sampleCoord).rgb);
//    vColor = vec3(1.0);

    // Compute rotation from grad
    vRotation = 0.;

    // Compute pont size from depth
    vPointSize = 20.;

    // Point size
    gl_PointSize = vPointSize * ( 300.0 / length( mvPosition.xyz ) );
    vPointSize = gl_PointSize;

    // Output
    gl_Position = mvpPosition;
}
