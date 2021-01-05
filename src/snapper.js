import { BufferAttribute, Vector3 } from 'three';

/**
 * Normal vector field smoother.
 * (c) madblade 2020
 *
 * Preprocesses shadow mesh normals.
 * This prevents faces from dissociating in optimized models.
 */
function snapNormals(mesh, thresh)
{
    let g = mesh.geometry;
    let p = g.attributes.position;
    let n = g.attributes.normal.array;
    let nbVertices = p.count;

    // Sort
    let sorted = [];
    let maxs = [-Infinity, -Infinity, -Infinity];
    let mins = [Infinity, Infinity, Infinity];
    let bufferPositions = p.array; let stride;
    for (let i = 0; i < nbVertices; ++i) {
        stride = 3 * i;
        let x = bufferPositions[stride];
        let y = bufferPositions[stride + 1];
        let z = bufferPositions[stride + 2];
        maxs[0] = maxs[0] < x ? x : maxs[0];
        maxs[1] = maxs[1] < y ? y : maxs[1];
        maxs[2] = maxs[2] < z ? z : maxs[2];
        mins[0] = mins[0] > x ? x : mins[0];
        mins[1] = mins[1] > y ? y : mins[1];
        mins[2] = mins[2] > z ? z : mins[2];
        sorted.push([x, y, z, i]);
    }
    sorted.sort((a, b) => a[0] - b[0]);

    // Compute extent
    let xE = maxs[0] - mins[0];
    let yE = maxs[1] - mins[1];
    let zE = maxs[2] - mins[2];
    let snapDistance = Math.sqrt(
        Math.pow(xE, 2) +
        Math.pow(yE, 2) +
        Math.pow(zE, 2)
    ) / thresh;
    let maxDeltaX = snapDistance; // xE / 1000.0; // Manhattan on x

    // Smoothe normals
    let processed = new Uint8Array(nbVertices);
    processed.fill(0);
    let numberSnapLocii = 0;
    let nbWarns = 0;
    for (let i = 0; i < nbVertices; ++i)
    {
        if (processed[i]) continue;
        let currentPoint = sorted[i];
        let xc = currentPoint[0];
        let yc = currentPoint[1];
        let zc = currentPoint[2];

        let currentXDistance = 0;
        let colocalized = [];
        let j = i + 1;
        while (currentXDistance < maxDeltaX && j !== nbVertices) {
            let nextPoint = sorted[j];
            if (processed[j]) { ++j; continue; }

            let xn = nextPoint[0];
            let yn = nextPoint[1];
            let zn = nextPoint[2];

            currentXDistance = xn - xc; // > 0
            if (currentXDistance > maxDeltaX) break;

            let distance3D = Math.sqrt(
                Math.pow(xc - xn, 2) +
                Math.pow(yc - yn, 2) +
                Math.pow(zc - zn, 2)
            );
            if (distance3D < snapDistance) {
                colocalized.push(nextPoint[3]);
                processed[j] = 1;
            }

            ++j;
        }

        // Recompute normal
        if (colocalized.length) {
            ++numberSnapLocii;
            let ni = currentPoint[3];
            let currentNormal = [n[3 * ni], n[3 * ni + 1], n[3 * ni + 2]];
            let nbNormals = colocalized.length + 1;

            if (colocalized.length > 5) {
                ++nbWarns;
            }

            // Average normals
            for (let k = 0; k < colocalized.length; ++k) {
                let nk = colocalized[k];
                currentNormal[0] += n[3 * nk];
                currentNormal[1] += n[3 * nk + 1];
                currentNormal[2] += n[3 * nk + 2];
            }
            currentNormal[0] /= nbNormals;
            currentNormal[1] /= nbNormals;
            currentNormal[2] /= nbNormals;

            // Replace normals in attribute array.
            n[3 * ni] = currentNormal[0];
            n[3 * ni + 1] = currentNormal[1];
            n[3 * ni + 2] = currentNormal[2];
            for (let k = 0; k < colocalized.length; ++k) {
                let nk = colocalized[k];
                n[3 * nk] = currentNormal[0];
                n[3 * nk + 1] = currentNormal[1];
                n[3 * nk + 2] = currentNormal[2];
            }
        }
    }

    if (numberSnapLocii > 0)
        console.log(`Snapped ${numberSnapLocii} locations.`);
    if (nbWarns > 0)
        console.log(`${nbWarns} snaps done on more than 5 points.`);

    mesh.geometry.attributes.normal.needsUpdate = true;
}

// From https://github.com/gkjohnson/threejs-sandbox/tree/master/shadow-volumes
const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const v01 = new Vector3();
const v12 = new Vector3();
const norm = new Vector3();
function vecToString(v, multiplier)
{
    const x = ~~(v.x * multiplier);
    const y = ~~(v.y * multiplier);
    const z = ~~(v.z * multiplier);
    return `${x},${y},${z}`;
}

function getDynamicShadowVolumeGeometry(geometry) {
    const shadowGeom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    for (const key in shadowGeom.attributes) {
        if (!shadowGeom.attributes.hasOwnProperty(key)) continue;
        shadowGeom.attributes[key] = shadowGeom.attributes[key].clone();
    }

    // Generate per-face normals
    const posAttr = shadowGeom.getAttribute('position');
    const normArr = [];
    for (let i = 0, l = posAttr.count; i < l; i += 3)
    {
        v0.x = posAttr.getX(i);
        v0.y = posAttr.getY(i);
        v0.z = posAttr.getZ(i);

        v1.x = posAttr.getX(i + 1);
        v1.y = posAttr.getY(i + 1);
        v1.z = posAttr.getZ(i + 1);

        v2.x = posAttr.getX(i + 2);
        v2.y = posAttr.getY(i + 2);
        v2.z = posAttr.getZ(i + 2);

        v01.subVectors(v0, v1);
        v12.subVectors(v1, v2);

        norm.crossVectors(v01, v12).normalize();

        normArr.push(norm.x, norm.y, norm.z);
        normArr.push(norm.x, norm.y, norm.z);
        normArr.push(norm.x, norm.y, norm.z);
    }
    const normAttr = new BufferAttribute(new Float32Array(normArr), 3, false);
    // shadowGeom.addAttribute('normal', normAttr);
    shadowGeom.setAttribute('normal', normAttr);

    // generate an edge map
    const vertHash = {};
    const vertMap = {};
    for (let i = 0, l = posAttr.count; i < l; ++i)
    {
        let str = '';
        str += `
           ${posAttr.getX(i).toFixed(9)},
           ${posAttr.getY(i).toFixed(9)}
           ${posAttr.getZ(i).toFixed(9)}
        `;

        if (str in vertHash)
        {
            vertMap[i] = vertHash[str];
            vertMap[vertHash[str]] = i;
        } else
            vertHash[str] = i;
    }

    // generate the new index array
    const indexArr = new Array(posAttr.count).fill().map((e, i) => i);
    const edgeHash = {};
    const multiplier = 1e6;
    for (let i = 0, l = posAttr.count; i < l; i += 3)
    {
        for (let j = 0; j < 3; j++)
        {
            const e00 = i + j;
            const e01 = i + (j + 1) % 3;

            v0.x = posAttr.getX(e00);
            v0.y = posAttr.getY(e00);
            v0.z = posAttr.getZ(e00);

            v1.x = posAttr.getX(e01);
            v1.y = posAttr.getY(e01);
            v1.z = posAttr.getZ(e01);

            let str0 = vecToString(v0, multiplier);
            let str1 = vecToString(v1, multiplier);

            let hash0 = `${str0}|${str1}`;
            let hash1 = `${str1}|${str0}`;

            if (hash0 in edgeHash || hash1 in edgeHash)
            {
                const [e10, e11] = edgeHash[hash0];

                delete edgeHash[hash0];
                delete edgeHash[hash1];

                indexArr.push(e00);
                indexArr.push(e11);
                indexArr.push(e10);

                indexArr.push(e00);
                indexArr.push(e10);
                indexArr.push(e01);
            }
            else
            {
                edgeHash[hash0] = [e00, e01];
                edgeHash[hash1] = [e00, e01];
            }
        }
    }

    const indexAttr = new BufferAttribute(new Uint32Array(indexArr), 1, false);
    shadowGeom.setIndex(indexAttr);

    return shadowGeom;
}

export { snapNormals, getDynamicShadowVolumeGeometry };
