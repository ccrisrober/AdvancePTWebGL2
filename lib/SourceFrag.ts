// Path tracer in WebGL2
// Copyright (C) <2016> 
//  - Cristian Rodríguez Bernal (maldicion069)
//  - Juan Guerrero Martín (hire33)
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/// <reference path="globals.ts" />

class SourceFrag {
  protected static globalSourceFragIdCounter : number = 0;
  public id : number;
  public src : string;
  public dependencies : Array<SourceFrag>;
  constructor( src: string, dependencies : Array<SourceFrag> = [] ) {
    this.id = SourceFrag.globalSourceFragIdCounter++;
    this.src = src;
    this.dependencies = dependencies;
  }
  // NOTE: Not check circular dependencies
  public toString( usedSourceFrag? ) : string {
    if ( !usedSourceFrag ) {
      usedSourceFrag = {};
    }

    var result : string = '';

    // if we have already been included, all of our dependencies have been included
    if ( usedSourceFrag[this.id] ) {
      return result;
    }

    if ( this.dependencies ) {
      for ( var i = 0; i < this.dependencies.length; i++ ) {
        if(!this.dependencies[i])  throw "Dependency not found";
        result += this.dependencies[i].toString( usedSourceFrag );
      }
    }

    result += this.src;

    usedSourceFrag[this.id] = true;

    return result;
  }
}

module sourceFrags {

  export var PI = new SourceFrag( '#define PI 3.14159\n' );
  export var TWO_PI = new SourceFrag( '#define TWO_PI ' + '6.2831\n' );

  export var rand = new SourceFrag(`
highp float rand(vec2 co) {
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt= dot(co.xy ,vec2(a,b));
  highp float sn= mod(dt,3.1415926);
  return fract(sin(sn) * c);
}
`);

  export var pseudorandom = new SourceFrag(`
float pseudorandom(float u) {
  float a = fract(sin(gl_FragCoord.x*12.9898*3758.5453));
  float b = fract(sin(gl_FragCoord.x*63.7264*3758.5453));
  return rand(gl_FragCoord.xy * mod(u * 4.5453,3.1415926));
}
`, [sourceFrags.rand] );

  export var rayT = new SourceFrag(`
vec3 rayT( vec3 rayPos, vec3 rayDir, float t ) {
  return rayPos + t * rayDir;
}
` );

  // for a plane determined by "normal . p = d" for points "p", returns ray t to intersection
  export var rayIntersectPlane = new SourceFrag(
`float rayIntersectPlane( vec3 normal, float d, vec3 rayPos, vec3 rayDir ) {
  return ( d - dot( normal, rayPos ) ) / dot( normal, rayDir );
}
` );

  // returns (tNear,tFar). intersection based on the slab method. no intersection if tN
  export var rayIntersectBox = new SourceFrag(
'vec2 rayIntersectBox( vec3 boxMinCorner, vec3 boxMaxCorner, vec3 rayPos, vec3 rayDir ) {\n' +
// t values for the negative plane sides
'  vec3 tBack = ( boxMinCorner - rayPos ) / rayDir;\n' +
'  vec3 tFront = ( boxMaxCorner - rayPos ) / rayDir;\n' +

// sort t values based on closeness
'  vec3 tMin = min( tBack, tFront );\n' +
'  vec3 tMax = max( tBack, tFront );\n' +

// farthest "near" is when the ray as passed all three planes
'  float tNear = max( max( tMin.x, tMin.y ), tMin.z );\n' +

// closest "far" is when the ray will exit
'  float tFar = min( min( tMax.x, tMax.y ), tMax.z );\n' +

// if tNear >= tFar, there is no intersection
'  return vec2( tNear, tFar );\n' +
'}\n' );

  // boxCenter = (maxCorner + minCorner)/2, boxHalfSize = (maxCorner - minCorner)/2
  // NOTE: for intersections very close to corners and edges, we may return a normal blended between the faces
  export var normalForBox = new SourceFrag(`
vec3 normalForBox( vec3 boxCenter, vec3 boxHalfSize, vec3 point ) {
  vec3 unitDelta = ( point - boxCenter ) / boxHalfSize;
  return normalize( step( 1.0 - ${globals.epsilon}, unitDelta ) - step( 1.0 - ${globals.epsilon}, -1.0 * unitDelta ) );
}
` );

  // returns vec2( tNear, tFar ), only assume intersection if tNear < tFar
  export var rayIntersectSphere = new SourceFrag(`
vec2 rayIntersectSphere( vec3 center, float radius, vec3 rayPos, vec3 rayDir ) {
  vec3 toSphere = rayPos - center;
  float a = dot( rayDir, rayDir );
  float b = 2.0 * dot( toSphere, rayDir );
  float c = dot( toSphere, toSphere ) - radius * radius;
  float discriminant = b * b - 4.0 * a * c;
  if( discriminant > ${globals.smallEpsilon} ) {
    float sqt = sqrt( discriminant );
    return ( vec2( -sqt, sqt ) - b ) / ( 2.0 * a );
  } else {
    return vec2( 1.0, -1.0 );
  }
}
` );

  export var normalForSphere = new SourceFrag(`
vec3 normalForSphere( vec3 center, float radius, vec3 point ) {
  return ( point - center ) / radius;
}
` );

  export var rayIntersectTriangle = new SourceFrag(
`float intersectTriangle(vec3 origin, vec3 dir, vec3 v0, vec3 v1, vec3 v2) {

  vec3 e1 = v1-v0;
  vec3 e2 = v2-v0;
  vec3 tvec = origin - v0;  

  vec3 pvec = cross(dir, e2);  
  float det  = dot(e1, pvec);   

  // check face
  //if(det < ${globals.epsilon}) return INFINITY;

  float inv_det = 1.0/ det;  

  float u = dot(tvec, pvec) * inv_det;  

  if (u < 0.0 || u > 1.0) return INFINITY;  

  vec3 qvec = cross(tvec, e1);  

  float v = dot(dir, qvec) * inv_det;  

  if (v < 0.0 || (u + v) > 1.0) return INFINITY;  

  float t = dot(e2, qvec) * inv_det;
return t;
}
`);

  export var triangleNormal = new SourceFrag(
`vec3 normalForTriangle( vec3 v0, vec3 v1, vec3 v2 ) {
  vec3 e1 = v1-v0;
  vec3 e2 = v2-v0;
  return normalize(cross(e2, e1));
}
`);

  export var rayIntersectMesh = new SourceFrag(
`
vec2 intersectMesh( vec3 origin, vec3 dir, vec3 aabb_min, vec3 aabb_max) {
  
    //for(int index = 0; index < 16; index++) {
    int index = 0;
    ivec3 list_pos = //texture(triangles_list, vec2((float(index)+0.5)/float(36.0), 0.5)).xyz;
    //list_pos = vec3(0, 1, 2);
    if((index+1) % 2 !=0 ) { 
      list_pos.xyz = list_pos.zxy;
    }
    vec3 v0 = texture(vertex_positions, vec2((float(list_pos.z) + 0.5 )/float(28.0), 0.5)).xyz;
    vec3 v1 = texture(vertex_positions, vec2((float(list_pos.y) + 0.5 )/float(28.0), 0.5)).xyz;
    vec3 v2 = texture(vertex_positions, vec2((float(list_pos.x) + 0.5 )/float(28.0), 0.5)).xyz;

    float hit = intersectTriangle(origin, dir, v0, v1, v2);
    if(hit < t) { 
      t = hit;
      tri = index;
    }
    //}
  return vec2(t, float(tri/3));
}
`, [sourceFrags.rayIntersectTriangle, sourceFrags.rayIntersectBox]);

  export var normalOnMesh = new SourceFrag(
`vec3 normalOnMesh( float tri ) {
  int index = int(tri);

  ivec3 list_pos = indices[index];    //texture(triangles_list, vec2((float(index)+0.5)/float(TRIANGLE_TEX_SIZE), 0.5)).xyz;
  if((index+1) % 2 !=0 ) { 
    list_pos.xyz = list_pos.zxy;
  }
  vec3 v0 = texture(vertex_positions, vec2((float(list_pos.z) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);
  vec3 v1 = texture(vertex_positions, vec2((float(list_pos.y) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);
  vec3 v2 = texture(vertex_positions, vec2((float(list_pos.x) + 0.5 )/float(VERTEX_TEX_SIZE), 0.5)).xyz * 30.0 + vec3(0, 75, 0);

  return normalForTriangle( v0, v1, v2 );
}
`, [sourceFrags.triangleNormal]);


  export var uniformInsideDisk = new SourceFrag(`
vec2 uniformInsideDisk( float xi1, float xi2 ) {
  float angle = TWO_PI * xi1;
  float mag = sqrt( xi2 );
  return vec2( mag * cos( angle ), mag * sin( angle ) );
}
`, [sourceFrags.TWO_PI] );

  export var sampleUniformOnSphere = new SourceFrag(
    'vec3 sampleUniformOnSphere( float xi1, float xi2 ) {\n' +
    '  float angle = TWO_PI * xi1;\n' +
    '  float mag = 2.0 * sqrt( xi2 * ( 1.0 - xi2 ) );\n' +
    // NOTE: don't change order without checking sampleUniformOnHemisphere, order of uniform xi is required to stay the same
    '  return vec3( mag * cos( angle ), mag * sin( angle ), 1.0 - 2.0 * xi2 );\n' +
    '}\n', [sourceFrags.TWO_PI] );

  // z >= 0
  export var sampleUniformOnHemisphere = new SourceFrag(`
vec3 sampleUniformOnHemisphere( float xi1, float xi2 ) {
  return sampleUniformOnSphere( xi1, xi2 / 2.0 );
}
`, [sourceFrags.sampleUniformOnSphere] );

  // dot-weighted by (0,0,1)
  export var sampleDotWeightOnHemiphere = new SourceFrag(`
vec3 sampleDotWeightOnHemiphere( float xi1, float xi2 ) {
  float angle = TWO_PI * xi1; /* Polar angle PHI */
  float mag = sqrt( xi2 ); /* sin(Polar angle THETA) */
  /* cos(THETA) = (1-r2)^(1/e+1); We use e=1; */
  /* p = sin(THETA)cos(PHI)*u + sin(THETA)sin(PHI)*v + cos(THETA)*w; */ 
  return vec3( mag * cos( angle ), mag * sin( angle ), sqrt( 1.0 - xi2 ) ); 
}
`, [sourceFrags.TWO_PI] );

  // (dot)^n-weighted by (0,0,1)
  export var samplePowerDotWeightOnHemiphere = new SourceFrag(`
vec3 samplePowerDotWeightOnHemiphere( float n, float xi1, float xi2 ) {
  float angle = TWO_PI * xi1;
  float z = pow( abs( xi2 ), 1.0 / ( n + 1.0 ) );
  float mag = sqrt( 1.0 - z * z );
  return vec3( mag * cos( angle ), mag * sin( angle ), z );
}
`, [sourceFrags.TWO_PI] );

  // dot-weighted by (0,0,0,1)
  export var sampleDotWeightOn3Hemiphere = new SourceFrag(`
vec4 sampleDotWeightOnHemiphere( float xi1, float xi2, float xi3 ) {
  float tr = pow( abs( xi1 ), 1.0/3.0 );
  float mag = tr * sqrt( xi2 * ( 1 - xi2 ) );
  float angle = TWO_PI * xi3;
  return vec4( mag * cos( angle ), mag * sin( angle ), tr * ( 1 - 2 * xi2 ), sqrt( 1 - tr * tr ) );
}
`, [sourceFrags.TWO_PI] );


  export var sampleTowardsNormal = new SourceFrag(`
vec3 sampleTowardsNormal( vec3 normal, vec3 sampleDir ) {
  vec3 a, b;
  if ( abs( normal.x ) < 0.5 ) {
    a = normalize( cross( normal, vec3( 1, 0, 0 ) ) );
  } else {
    a = normalize( cross( normal, vec3( 0, 1, 0 ) ) );
  }
  b = normalize( cross( normal, a ) );
  return a * sampleDir.x + b * sampleDir.y + normal * sampleDir.z;
}
` );

  // if abs(dot(normal,incident)) < TIRcutoff, it's total internal reflection
  export var totalInternalReflectionCutoff = new SourceFrag(`
float totalInternalReflectionCutoff( float na, float nb ) {
  if ( na <= nb ) {
    return 0.0;
  }
  float ratio = nb / na;
  return sqrt( 1.0 - ratio * ratio );
}
` );

  // reflectance for dielectrics, requires precomputed transmitted unit vector. Going from IOR na => nb. returns vec2( sReflect, pReflect )
  export var fresnelDielectric = new SourceFrag(
    'vec2 fresnelDielectric( vec3 incident, vec3 normal, vec3 transmitted, float na, float nb ) {\n' +
    '  float doti = abs( dot( incident, normal ) );\n' +
    '  float dott = abs( dot( transmitted, normal ) );\n' +
    '  vec2 result = vec2( ( na * doti - nb * dott ) / ( na * doti + nb * dott ), ( na * dott - nb * doti ) / ( na * dott + nb * doti ) );\n' +
    '  return result * result;\n' +
    '}\n' );

  // reflectance for general surfaces. Going from IOR na => nb. returns vec2( sReflect, pReflect ). k is the extinction coefficient?
  export var fresnel = new SourceFrag(`
vec2 fresnel( vec3 incident, vec3 normal, float na, float nb, float k ) {
  float doti = abs( dot( incident, normal ) );
  float comm = na * na * ( doti * doti - 1.0 ) / ( ( nb * nb + k * k ) * ( nb * nb + k * k ) );
  float resq = 1.0 + comm * ( nb * nb - k * k );
  float imsq = 2.0 * comm * nb * k;
  float temdott = sqrt( resq * resq + imsq * imsq );
  float redott = ( sqrt( 2.0 ) / 2.0 ) * sqrt( temdott + resq );
  float imdott = ( imsq >= 0.0 ? 1.0 : -1.0 ) * ( sqrt( 2.0 ) / 2.0 ) * sqrt( temdott - resq );
  float renpdott = nb * redott + k * imdott;
  float imnpdott = nb * imdott - k * redott;
  float retop = na * doti - renpdott;
  float rebot = na * doti + renpdott;
  float retdet = rebot * rebot + imnpdott * imnpdott;
  float reret = ( retop * rebot + -imnpdott * imnpdott ) / retdet;
  float imret = ( -imnpdott * rebot - retop * imnpdott ) / retdet;
  float sReflect = reret * reret + imret * imret;
  retop = ( nb * nb - k * k ) * doti - na * renpdott;
  rebot = ( nb * nb - k * k ) * doti + na * renpdott;
  float imtop = -2.0 * nb * k * doti - na * imnpdott;
  float imbot = -2.0 * nb * k * doti + na * imnpdott;
  retdet = rebot * rebot + imbot * imbot;
  reret = ( retop * rebot + imtop * imbot ) / retdet;
  imret = ( imtop * rebot - retop * imbot ) / retdet;
  float pReflect = reret * reret + imret * imret;
  return vec2( sReflect, pReflect );
}
` );

  export var sampleFresnelDielectric = new SourceFrag(
    'vec3 sampleFresnelDielectric( vec3 incident, vec3 normal, float na, float nb, float xi1 ) {\n' +
    '  vec3 transmitDir = refract( incident, normal, na / nb );\n' +
    '  vec2 reflectance = fresnelDielectric( incident, normal, transmitDir, na, nb );\n' +
    '  if ( xi1 > ( reflectance.x + reflectance.y ) / 2.0 ) {\n' +
    // refract
    '    return transmitDir;\n' +
    '  } else {\n' +
    // reflect
    '    return reflect( incident, normal );\n' +
    '  }\n' +
    '}\n', [sourceFrags.fresnelDielectric] );

  export var SHCoefficients = new SourceFrag(`struct SHCoefficients {
    vec3 l00, l1m1, l10, l11, l2m2, l2m1, l20, l21, l22;
};
`);

  // Based on https://www.shadertoy.com/view/lt2GRD
  // These constants have been calculated with a light probe from this website:
  // http://www.pauldebevec.com/Probes/
  export var SHCoeffsGrace = new SourceFrag(`
const SHCoefficients sph_arm = SHCoefficients(
  vec3( 1.630401,  1.197034,  1.113651),
  vec3( 0.699675,  0.540300,  0.536132),
  vec3(-0.354008, -0.287976, -0.268514),
  vec3( 1.120136,  0.854082,  0.880019),
  vec3( 1.012764,  0.783031,  0.812029),
  vec3(-0.181137, -0.147510, -0.132195),
  vec3(-0.589437, -0.434048, -0.452781),
  vec3(-0.266943, -0.211540, -0.210316),
  vec3( 0.868657,  0.665028,  0.655598)
);
`, [sourceFrags.SHCoefficients]);

  // Based on https://www.shadertoy.com/view/lt2GRD
  // These constants have been calculated with a light probe from this website:
  // http://www.pauldebevec.com/Probes/
  export var SHCoeffsGalileo = new SourceFrag(`
const SHCoefficients sph_arm = SHCoefficients(
  vec3( 0.7953949,  0.4405923,  0.5459412 ),
  vec3( 0.3981450,  0.3526911,  0.6097158 ),
  vec3(-0.3424573, -0.1838151, -0.2715583 ),
  vec3(-0.2944621, -0.0560606,  0.0095193 ),
  vec3(-0.1123051, -0.0513088, -0.1232869 ),
  vec3(-0.2645007, -0.2257996, -0.4785847 ),
  vec3(-0.1569444, -0.0954703, -0.1485053 ),
  vec3( 0.5646247,  0.2161586,  0.1402643 ),
  vec3( 0.2137442, -0.0547578, -0.3061700 )
);
`, [sourceFrags.SHCoefficients]);

  // Based on https://www.shadertoy.com/view/lt2GRD
  // These constants have been calculated with a light probe from this website:
  // http://www.pauldebevec.com/Probes/
  export var SHCoeffsBeach = new SourceFrag(`
const SHCoefficients sph_arm = SHCoefficients(
  vec3( 2.479083,  2.954692,  3.087378),
  vec3( 1.378513,  1.757425,  2.212955),
  vec3(-0.321538, -0.574806, -0.866179),
  vec3( 1.431262,  1.181306,  0.620145),
  vec3( 0.580104,  0.439953,  0.154851),
  vec3(-0.446477, -0.688690, -0.986783),
  vec3(-1.225432, -1.270607, -1.146588),
  vec3( 0.274751,  0.234544,  0.111212),
  vec3( 2.098766,  2.112738,  1.652628)
);
`, [sourceFrags.SHCoefficients]);

  // Based on https://www.shadertoy.com/view/lt2GRD
  // These constants have been calculated with a light probe from this website:
  // http://www.pauldebevec.com/Probes/
  export var SHCoeffsNeighbor = new SourceFrag(`
const SHCoefficients sph_arm = SHCoefficients(
  vec3( 2.283449,  2.316459,  2.385942),
  vec3(-0.419491, -0.409525, -0.400615),
  vec3(-0.013020, -0.004712,  0.007341),
  vec3( 0.050598,  0.052119,  0.052227),
  vec3(-0.319785, -0.315880, -0.312267),
  vec3( 0.700243,  0.703244,  0.718901),
  vec3(-0.086157, -0.082425, -0.073467),
  vec3(-0.242395, -0.228124, -0.218358),
  vec3( 0.001888,  0.012843,  0.029843)
);
`, [sourceFrags.SHCoefficients]);
  export var calcIrradiance = new SourceFrag(`vec3 calcIrradiance(vec3 nor) {
    const float c1 = 0.429043;
    const float c2 = 0.511664;
    const float c3 = 0.743125;
    const float c4 = 0.886227;
    const float c5 = 0.247708;
    return (
        c1 * sph_arm.l22 * (nor.x * nor.x - nor.y * nor.y) +
        c3 * sph_arm.l20 * nor.z * nor.z +
        c4 * sph_arm.l00 -
        c5 * sph_arm.l20 +
        2.0 * c1 * sph_arm.l2m2 * nor.x * nor.y +
        2.0 * c1 * sph_arm.l21  * nor.x * nor.z +
        2.0 * c1 * sph_arm.l2m1 * nor.y * nor.z +
        2.0 * c2 * sph_arm.l11  * nor.x +
        2.0 * c2 * sph_arm.l1m1 * nor.y +
        2.0 * c2 * sph_arm.l10  * nor.z
    );
}
`, [sourceFrags.SHCoefficients]);

  export var atan2 = new SourceFrag(`float atan2(vec2 p) {
  return atan(p.y, p.x);
}
`, []);
  export var noise3D = new SourceFrag(`float noise3D(vec3 p) {
  return fract(sin(dot(p ,vec3(12.9898,78.233,12.7235))) * 43758.5453);
}
`, []);
  export var worley = new SourceFrag(`
float create_cells3D(in vec3 p) {
  p.xy *= 18.0;
  float d = 1.0e10;
  vec3 f = floor(p);
  vec3 x = fract(p);
  for (int xo = -1; xo <= 1; xo++) {
    for (int yo = -1; yo <= 1; yo++) {
      for (int zo = -1; zo <= 1; zo++) {
        vec3 xyz = vec3(float(xo),float(yo),float(zo));  // Position
        vec3 tp = xyz + noise3D((xyz+f)/18.0) - x;
        d = min(d, dot(tp, tp));
      }
    }
  }
  return sin(d);
}
`, [sourceFrags.noise3D]);

   export var hash_perlin = new SourceFrag(`vec2 hash_perlin( vec2 p ) {
  p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)) );
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
 `, []);
   export var perlin = new SourceFrag(` // Based on https://www.shadertoy.com/view/Msf3WH
  float perlin( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
    vec2 i = floor( p + (p.x+p.y)*K1 );
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
    vec3 n = h*h*h*h*vec3( dot(a,hash_perlin(i+0.0)), dot(b,hash_perlin(i+o)), dot(c,hash_perlin(i+1.0)));
    return dot( n, vec3(70.0) );
}
`, [sourceFrags.hash_perlin]);

   export var sellmeier = new SourceFrag(
    `float sellmeierDispersion( float bx, float by, float bz, float cx, float cy, float cz, float wavelength ) {
      float lams = wavelength * wavelength / 1000000.0;
      return sqrt( 1.0 + ( bx * lams ) / ( lams - cx ) + ( by * lams ) / ( lams - cy ) + ( bz * lams ) / ( lams - cz ) );
    }
    `, [])

   export var noise = new SourceFrag(`
    float rand_(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }
    float noise(vec2 n) {
        const vec2 d = vec2(0.0, 1.0);
      vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
        return mix(mix(rand_(b), rand_(b + d.yx), f.x), mix(rand_(b + d.xy), rand_(b + d.yy), f.x), f.y);
    }
    `, []);
}

/*
float phi = atan2(vec2(hitPos.z, hitPos.x));
float theta = asin(hitPos.y);
vec2 uv;
uv.x = 1.0-(phi + 3.14) / (2.0*3.14);
uv.y = (theta + 3.14/2.0) / 3.14;

//float f = create_cells3D(vec3(hitPos.xz*0.004, 1.0), NUM_CELLS);
//vec3 col = vec3(1.0)*f*f;

//float f = perlin(hitPos.xz*10.0);
//f = 0.5 + 0.5*f;

//attenuation = vec3(f);
*/