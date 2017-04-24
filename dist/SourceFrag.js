var SourceFrag = (function () {
    function SourceFrag(src, dependencies) {
        if (dependencies === void 0) { dependencies = []; }
        this.id = SourceFrag.globalSourceFragIdCounter++;
        this.src = src;
        this.dependencies = dependencies;
    }
    SourceFrag.prototype.toString = function (usedSourceFrag) {
        if (!usedSourceFrag) {
            usedSourceFrag = {};
        }
        var result = '';
        if (usedSourceFrag[this.id]) {
            return result;
        }
        if (this.dependencies) {
            for (var i = 0; i < this.dependencies.length; i++) {
                if (!this.dependencies[i])
                    throw "Dependency not found";
                result += this.dependencies[i].toString(usedSourceFrag);
            }
        }
        result += this.src;
        usedSourceFrag[this.id] = true;
        return result;
    };
    SourceFrag.globalSourceFragIdCounter = 0;
    return SourceFrag;
}());
var sourceFrags;
(function (sourceFrags) {
    sourceFrags.PI = new SourceFrag('#define PI 3.14159\n');
    sourceFrags.TWO_PI = new SourceFrag('#define TWO_PI ' + '6.2831\n');
    sourceFrags.rand = new SourceFrag("\nhighp float rand(vec2 co) {\n  highp float a = 12.9898;\n  highp float b = 78.233;\n  highp float c = 43758.5453;\n  highp float dt= dot(co.xy ,vec2(a,b));\n  highp float sn= mod(dt,3.1415926);\n  return fract(sin(sn) * c);\n}\n");
    sourceFrags.pseudorandom = new SourceFrag("\nfloat pseudorandom(float u) {\n  float a = fract(sin(gl_FragCoord.x*12.9898*3758.5453));\n  float b = fract(sin(gl_FragCoord.x*63.7264*3758.5453));\n  return rand(gl_FragCoord.xy * mod(u * 4.5453,3.1415926));\n}\n", [sourceFrags.rand]);
    sourceFrags.rayT = new SourceFrag("\nvec3 rayT( vec3 rayPos, vec3 rayDir, float t ) {\n  return rayPos + t * rayDir;\n}\n");
    sourceFrags.rayIntersectPlane = new SourceFrag("float rayIntersectPlane( vec3 normal, float d, vec3 rayPos, vec3 rayDir ) {\n  return ( d - dot( normal, rayPos ) ) / dot( normal, rayDir );\n}\n");
    sourceFrags.rayIntersectBox = new SourceFrag('vec2 rayIntersectBox( vec3 boxMinCorner, vec3 boxMaxCorner, vec3 rayPos, vec3 rayDir ) {\n' +
        '  vec3 tBack = ( boxMinCorner - rayPos ) / rayDir;\n' +
        '  vec3 tFront = ( boxMaxCorner - rayPos ) / rayDir;\n' +
        '  vec3 tMin = min( tBack, tFront );\n' +
        '  vec3 tMax = max( tBack, tFront );\n' +
        '  float tNear = max( max( tMin.x, tMin.y ), tMin.z );\n' +
        '  float tFar = min( min( tMax.x, tMax.y ), tMax.z );\n' +
        '  return vec2( tNear, tFar );\n' +
        '}\n');
    sourceFrags.normalForBox = new SourceFrag("\nvec3 normalForBox( vec3 boxCenter, vec3 boxHalfSize, vec3 point ) {\n  vec3 unitDelta = ( point - boxCenter ) / boxHalfSize;\n  return normalize( step( 1.0 - " + globals.epsilon + ", unitDelta ) - step( 1.0 - " + globals.epsilon + ", -1.0 * unitDelta ) );\n}\n");
    sourceFrags.rayIntersectSphere = new SourceFrag("\nvec2 rayIntersectSphere( vec3 center, float radius, vec3 rayPos, vec3 rayDir ) {\n  vec3 toSphere = rayPos - center;\n  float a = dot( rayDir, rayDir );\n  float b = 2.0 * dot( toSphere, rayDir );\n  float c = dot( toSphere, toSphere ) - radius * radius;\n  float discriminant = b * b - 4.0 * a * c;\n  if( discriminant > " + globals.smallEpsilon + " ) {\n    float sqt = sqrt( discriminant );\n    return ( vec2( -sqt, sqt ) - b ) / ( 2.0 * a );\n  } else {\n    return vec2( 1.0, -1.0 );\n  }\n}\n");
    sourceFrags.normalForSphere = new SourceFrag("\nvec3 normalForSphere( vec3 center, float radius, vec3 point ) {\n  return ( point - center ) / radius;\n}\n");
    sourceFrags.rayIntersectTriangle = new SourceFrag("float intersectTriangle(vec3 origin, vec3 dir, vec3 v0, vec3 v1, vec3 v2) {\n\n  vec3 e1 = v1-v0;\n  vec3 e2 = v2-v0;\n  vec3 tvec = origin - v0;  \n\n  vec3 pvec = cross(dir, e2);  \n  float det  = dot(e1, pvec);   \n\n  // check face\n  //if(det < " + globals.epsilon + ") return INFINITY;\n\n  float inv_det = 1.0/ det;  \n\n  float u = dot(tvec, pvec) * inv_det;  \n\n  if (u < 0.0 || u > 1.0) return INFINITY;  \n\n  vec3 qvec = cross(tvec, e1);  \n\n  float v = dot(dir, qvec) * inv_det;  \n\n  if (v < 0.0 || (u + v) > 1.0) return INFINITY;  \n\n  float t = dot(e2, qvec) * inv_det;\nreturn t;\n}\n");
    sourceFrags.triangleNormal = new SourceFrag("vec3 normalForTriangle( vec3 v0, vec3 v1, vec3 v2 ) {\n  vec3 e1 = v1-v0;\n  vec3 e2 = v2-v0;\n  return normalize(cross(e2, e1));\n}\n");
    sourceFrags.rayIntersectMesh = new SourceFrag("\nvec2 intersectMesh( vec3 origin, vec3 dir, vec3 aabb_min, vec3 aabb_max) {\n  \n    //for(int index = 0; index < 16; index++) {\n    int index = 0;\n    ivec3 list_pos = //texture(triangles_list, vec2((float(index)+0.5)/float(36.0), 0.5)).xyz;\n    //list_pos = vec3(0, 1, 2);\n    if((index+1) % 2 !=0 ) { \n      list_pos.xyz = list_pos.zxy;\n    }\n    vec3 v0 = texture(vertex_positions, vec2((float(list_pos.z) + 0.5 )/float(28.0), 0.5)).xyz;\n    vec3 v1 = texture(vertex_positions, vec2((float(list_pos.y) + 0.5 )/float(28.0), 0.5)).xyz;\n    vec3 v2 = texture(vertex_positions, vec2((float(list_pos.x) + 0.5 )/float(28.0), 0.5)).xyz;\n\n    float hit = intersectTriangle(origin, dir, v0, v1, v2);\n    if(hit < t) { \n      t = hit;\n      tri = index;\n    }\n    //}\n  return vec2(t, float(tri/3));\n}\n", [sourceFrags.rayIntersectTriangle, sourceFrags.rayIntersectBox]);
    sourceFrags.normalOnMesh = new SourceFrag("vec3 normalOnMesh( float tri ) {\n  int index = int(tri);\n\n  ivec3 list_pos = indices[index];    //texture(triangles_list, vec2((float(index)+0.5)/float(TRIANGLE_TEX_SIZE), 0.5)).xyz;\n  if((index+1) % 2 !=0 ) { \n    list_pos.xyz = list_pos.zxy;\n  }\n  vec3 v0 = texture(vertex_positions, vec2((float(list_pos.z) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);\n  vec3 v1 = texture(vertex_positions, vec2((float(list_pos.y) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);\n  vec3 v2 = texture(vertex_positions, vec2((float(list_pos.x) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);\n\n  return normalForTriangle( v0, v1, v2 );\n}\n", [sourceFrags.triangleNormal]);
    sourceFrags.uniformInsideDisk = new SourceFrag("\nvec2 uniformInsideDisk( float xi1, float xi2 ) {\n  float angle = TWO_PI * xi1;\n  float mag = sqrt( xi2 );\n  return vec2( mag * cos( angle ), mag * sin( angle ) );\n}\n", [sourceFrags.TWO_PI]);
    sourceFrags.sampleUniformOnSphere = new SourceFrag('vec3 sampleUniformOnSphere( float xi1, float xi2 ) {\n' +
        '  float angle = TWO_PI * xi1;\n' +
        '  float mag = 2.0 * sqrt( xi2 * ( 1.0 - xi2 ) );\n' +
        '  return vec3( mag * cos( angle ), mag * sin( angle ), 1.0 - 2.0 * xi2 );\n' +
        '}\n', [sourceFrags.TWO_PI]);
    sourceFrags.sampleUniformOnHemisphere = new SourceFrag("\nvec3 sampleUniformOnHemisphere( float xi1, float xi2 ) {\n  return sampleUniformOnSphere( xi1, xi2 / 2.0 );\n}\n", [sourceFrags.sampleUniformOnSphere]);
    sourceFrags.sampleDotWeightOnHemiphere = new SourceFrag("\nvec3 sampleDotWeightOnHemiphere( float xi1, float xi2 ) {\n  float angle = TWO_PI * xi1; /* Polar angle PHI */\n  float mag = sqrt( xi2 ); /* sin(Polar angle THETA) */\n  /* cos(THETA) = (1-r2)^(1/e+1); We use e=1; */\n  /* p = sin(THETA)cos(PHI)*u + sin(THETA)sin(PHI)*v + cos(THETA)*w; */ \n  return vec3( mag * cos( angle ), mag * sin( angle ), sqrt( 1.0 - xi2 ) ); \n}\n", [sourceFrags.TWO_PI]);
    sourceFrags.samplePowerDotWeightOnHemiphere = new SourceFrag("\nvec3 samplePowerDotWeightOnHemiphere( float n, float xi1, float xi2 ) {\n  float angle = TWO_PI * xi1;\n  float z = pow( abs( xi2 ), 1.0 / ( n + 1.0 ) );\n  float mag = sqrt( 1.0 - z * z );\n  return vec3( mag * cos( angle ), mag * sin( angle ), z );\n}\n", [sourceFrags.TWO_PI]);
    sourceFrags.sampleDotWeightOn3Hemiphere = new SourceFrag("\nvec4 sampleDotWeightOnHemiphere( float xi1, float xi2, float xi3 ) {\n  float tr = pow( abs( xi1 ), 1.0/3.0 );\n  float mag = tr * sqrt( xi2 * ( 1 - xi2 ) );\n  float angle = TWO_PI * xi3;\n  return vec4( mag * cos( angle ), mag * sin( angle ), tr * ( 1 - 2 * xi2 ), sqrt( 1 - tr * tr ) );\n}\n", [sourceFrags.TWO_PI]);
    sourceFrags.sampleTowardsNormal = new SourceFrag("\nvec3 sampleTowardsNormal( vec3 normal, vec3 sampleDir ) {\n  vec3 a, b;\n  if ( abs( normal.x ) < 0.5 ) {\n    a = normalize( cross( normal, vec3( 1, 0, 0 ) ) );\n  } else {\n    a = normalize( cross( normal, vec3( 0, 1, 0 ) ) );\n  }\n  b = normalize( cross( normal, a ) );\n  return a * sampleDir.x + b * sampleDir.y + normal * sampleDir.z;\n}\n");
    sourceFrags.totalInternalReflectionCutoff = new SourceFrag("\nfloat totalInternalReflectionCutoff( float na, float nb ) {\n  if ( na <= nb ) {\n    return 0.0;\n  }\n  float ratio = nb / na;\n  return sqrt( 1.0 - ratio * ratio );\n}\n");
    sourceFrags.fresnelDielectric = new SourceFrag('vec2 fresnelDielectric( vec3 incident, vec3 normal, vec3 transmitted, float na, float nb ) {\n' +
        '  float doti = abs( dot( incident, normal ) );\n' +
        '  float dott = abs( dot( transmitted, normal ) );\n' +
        '  vec2 result = vec2( ( na * doti - nb * dott ) / ( na * doti + nb * dott ), ( na * dott - nb * doti ) / ( na * dott + nb * doti ) );\n' +
        '  return result * result;\n' +
        '}\n');
    sourceFrags.fresnel = new SourceFrag("\nvec2 fresnel( vec3 incident, vec3 normal, float na, float nb, float k ) {\n  float doti = abs( dot( incident, normal ) );\n  float comm = na * na * ( doti * doti - 1.0 ) / ( ( nb * nb + k * k ) * ( nb * nb + k * k ) );\n  float resq = 1.0 + comm * ( nb * nb - k * k );\n  float imsq = 2.0 * comm * nb * k;\n  float temdott = sqrt( resq * resq + imsq * imsq );\n  float redott = ( sqrt( 2.0 ) / 2.0 ) * sqrt( temdott + resq );\n  float imdott = ( imsq >= 0.0 ? 1.0 : -1.0 ) * ( sqrt( 2.0 ) / 2.0 ) * sqrt( temdott - resq );\n  float renpdott = nb * redott + k * imdott;\n  float imnpdott = nb * imdott - k * redott;\n  float retop = na * doti - renpdott;\n  float rebot = na * doti + renpdott;\n  float retdet = rebot * rebot + imnpdott * imnpdott;\n  float reret = ( retop * rebot + -imnpdott * imnpdott ) / retdet;\n  float imret = ( -imnpdott * rebot - retop * imnpdott ) / retdet;\n  float sReflect = reret * reret + imret * imret;\n  retop = ( nb * nb - k * k ) * doti - na * renpdott;\n  rebot = ( nb * nb - k * k ) * doti + na * renpdott;\n  float imtop = -2.0 * nb * k * doti - na * imnpdott;\n  float imbot = -2.0 * nb * k * doti + na * imnpdott;\n  retdet = rebot * rebot + imbot * imbot;\n  reret = ( retop * rebot + imtop * imbot ) / retdet;\n  imret = ( imtop * rebot - retop * imbot ) / retdet;\n  float pReflect = reret * reret + imret * imret;\n  return vec2( sReflect, pReflect );\n}\n");
    sourceFrags.sampleFresnelDielectric = new SourceFrag('vec3 sampleFresnelDielectric( vec3 incident, vec3 normal, float na, float nb, float xi1 ) {\n' +
        '  vec3 transmitDir = refract( incident, normal, na / nb );\n' +
        '  vec2 reflectance = fresnelDielectric( incident, normal, transmitDir, na, nb );\n' +
        '  if ( xi1 > ( reflectance.x + reflectance.y ) / 2.0 ) {\n' +
        '    return transmitDir;\n' +
        '  } else {\n' +
        '    return reflect( incident, normal );\n' +
        '  }\n' +
        '}\n', [sourceFrags.fresnelDielectric]);
    sourceFrags.SHCoefficients = new SourceFrag("struct SHCoefficients {\n    vec3 l00, l1m1, l10, l11, l2m2, l2m1, l20, l21, l22;\n};\n");
    sourceFrags.SHCoeffsGrace = new SourceFrag("\nconst SHCoefficients sph_arm = SHCoefficients(\n  vec3( 1.630401,  1.197034,  1.113651),\n  vec3( 0.699675,  0.540300,  0.536132),\n  vec3(-0.354008, -0.287976, -0.268514),\n  vec3( 1.120136,  0.854082,  0.880019),\n  vec3( 1.012764,  0.783031,  0.812029),\n  vec3(-0.181137, -0.147510, -0.132195),\n  vec3(-0.589437, -0.434048, -0.452781),\n  vec3(-0.266943, -0.211540, -0.210316),\n  vec3( 0.868657,  0.665028,  0.655598)\n);\n", [sourceFrags.SHCoefficients]);
    sourceFrags.SHCoeffsGalileo = new SourceFrag("\nconst SHCoefficients sph_arm = SHCoefficients(\n  vec3( 0.7953949,  0.4405923,  0.5459412 ),\n  vec3( 0.3981450,  0.3526911,  0.6097158 ),\n  vec3(-0.3424573, -0.1838151, -0.2715583 ),\n  vec3(-0.2944621, -0.0560606,  0.0095193 ),\n  vec3(-0.1123051, -0.0513088, -0.1232869 ),\n  vec3(-0.2645007, -0.2257996, -0.4785847 ),\n  vec3(-0.1569444, -0.0954703, -0.1485053 ),\n  vec3( 0.5646247,  0.2161586,  0.1402643 ),\n  vec3( 0.2137442, -0.0547578, -0.3061700 )\n);\n", [sourceFrags.SHCoefficients]);
    sourceFrags.SHCoeffsBeach = new SourceFrag("\nconst SHCoefficients sph_arm = SHCoefficients(\n  vec3( 2.479083,  2.954692,  3.087378),\n  vec3( 1.378513,  1.757425,  2.212955),\n  vec3(-0.321538, -0.574806, -0.866179),\n  vec3( 1.431262,  1.181306,  0.620145),\n  vec3( 0.580104,  0.439953,  0.154851),\n  vec3(-0.446477, -0.688690, -0.986783),\n  vec3(-1.225432, -1.270607, -1.146588),\n  vec3( 0.274751,  0.234544,  0.111212),\n  vec3( 2.098766,  2.112738,  1.652628)\n);\n", [sourceFrags.SHCoefficients]);
    sourceFrags.SHCoeffsNeighbor = new SourceFrag("\nconst SHCoefficients sph_arm = SHCoefficients(\n  vec3( 2.283449,  2.316459,  2.385942),\n  vec3(-0.419491, -0.409525, -0.400615),\n  vec3(-0.013020, -0.004712,  0.007341),\n  vec3( 0.050598,  0.052119,  0.052227),\n  vec3(-0.319785, -0.315880, -0.312267),\n  vec3( 0.700243,  0.703244,  0.718901),\n  vec3(-0.086157, -0.082425, -0.073467),\n  vec3(-0.242395, -0.228124, -0.218358),\n  vec3( 0.001888,  0.012843,  0.029843)\n);\n", [sourceFrags.SHCoefficients]);
    sourceFrags.calcIrradiance = new SourceFrag("vec3 calcIrradiance(vec3 nor) {\n    const float c1 = 0.429043;\n    const float c2 = 0.511664;\n    const float c3 = 0.743125;\n    const float c4 = 0.886227;\n    const float c5 = 0.247708;\n    return (\n        c1 * sph_arm.l22 * (nor.x * nor.x - nor.y * nor.y) +\n        c3 * sph_arm.l20 * nor.z * nor.z +\n        c4 * sph_arm.l00 -\n        c5 * sph_arm.l20 +\n        2.0 * c1 * sph_arm.l2m2 * nor.x * nor.y +\n        2.0 * c1 * sph_arm.l21  * nor.x * nor.z +\n        2.0 * c1 * sph_arm.l2m1 * nor.y * nor.z +\n        2.0 * c2 * sph_arm.l11  * nor.x +\n        2.0 * c2 * sph_arm.l1m1 * nor.y +\n        2.0 * c2 * sph_arm.l10  * nor.z\n    );\n}\n", [sourceFrags.SHCoefficients]);
    sourceFrags.atan2 = new SourceFrag("float atan2(vec2 p) {\n  return atan(p.y, p.x);\n}\n", []);
    sourceFrags.noise3D = new SourceFrag("float noise3D(vec3 p) {\n  return fract(sin(dot(p ,vec3(12.9898,78.233,12.7235))) * 43758.5453);\n}\n", []);
    sourceFrags.worley = new SourceFrag("\nfloat create_cells3D(in vec3 p) {\n  p.xy *= 18.0;\n  float d = 1.0e10;\n  vec3 f = floor(p);\n  vec3 x = fract(p);\n  for (int xo = -1; xo <= 1; xo++) {\n    for (int yo = -1; yo <= 1; yo++) {\n      for (int zo = -1; zo <= 1; zo++) {\n        vec3 xyz = vec3(float(xo),float(yo),float(zo));  // Position\n        vec3 tp = xyz + noise3D((xyz+f)/18.0) - x;\n        d = min(d, dot(tp, tp));\n      }\n    }\n  }\n  return sin(d);\n}\n", [sourceFrags.noise3D]);
    sourceFrags.hash_perlin = new SourceFrag("vec2 hash_perlin( vec2 p ) {\n  p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)) );\n  return -1.0 + 2.0*fract(sin(p)*43758.5453123);\n}\n ", []);
    sourceFrags.perlin = new SourceFrag(" // Based on https://www.shadertoy.com/view/Msf3WH\n  float perlin( in vec2 p ) {\n    const float K1 = 0.366025404; // (sqrt(3)-1)/2;\n    const float K2 = 0.211324865; // (3-sqrt(3))/6;\n    vec2 i = floor( p + (p.x+p.y)*K1 );\n    vec2 a = p - i + (i.x+i.y)*K2;\n    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));\n    vec2 b = a - o + K2;\n    vec2 c = a - 1.0 + 2.0*K2;\n    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );\n    vec3 n = h*h*h*h*vec3( dot(a,hash_perlin(i+0.0)), dot(b,hash_perlin(i+o)), dot(c,hash_perlin(i+1.0)));\n    return dot( n, vec3(70.0) );\n}\n", [sourceFrags.hash_perlin]);
    sourceFrags.sellmeier = new SourceFrag("float sellmeierDispersion( float bx, float by, float bz, float cx, float cy, float cz, float wavelength ) {\n      float lams = wavelength * wavelength / 1000000.0;\n      return sqrt( 1.0 + ( bx * lams ) / ( lams - cx ) + ( by * lams ) / ( lams - cy ) + ( bz * lams ) / ( lams - cz ) );\n    }\n    ", []);
    sourceFrags.noise = new SourceFrag("\n    float rand_(vec2 n) { \n      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n    }\n    float noise(vec2 n) {\n        const vec2 d = vec2(0.0, 1.0);\n      vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\n        return mix(mix(rand_(b), rand_(b + d.yx), f.x), mix(rand_(b + d.xy), rand_(b + d.yy), f.x), f.y);\n    }\n    ", []);
})(sourceFrags || (sourceFrags = {}));
//# sourceMappingURL=SourceFrag.js.map