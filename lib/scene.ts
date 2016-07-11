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
/// <reference path="SourceFrag.ts" />
/// <reference path="ShaderProgram.ts" />

module scene {
  export class PerspectiveRays {
    public focalLength;
    public dofSpread;
    constructor( focalLength, dofSpread ) {
      this.focalLength = focalLength;
      this.dofSpread = dofSpread;
    }
    public getUniforms() {
      return `uniform float focalLength;
      uniform float depthField;
      `;
    }
    public computeRayDir() {
      return `
        vec2 dofOffset = depthField * uniformInsideDisk( pseudorandom(seed * 92.72 + 2.9), pseudorandom(seed * 192.72 + 12.9) );
        vec3 rayDir = rotationMatrix * normalize( vec3( jittered - dofOffset / focalLength, 1.0 ) );
        rayPos += rotationMatrix * vec3( dofOffset, 0.0 );
      `;
    }
    public requiredSourceFrag = [sourceFrags.uniformInsideDisk];
    public uniforms = ['focalLength', 'depthField'];
    public update( program ) {
      gl.uniform1f( program.uniformLocations["focalLength"], this.focalLength );
      gl.uniform1f( program.uniformLocations["depthField"], this.dofSpread );
    }
    public getRayDir( rotationMatrix, p ) : Float32Array {
      var aux = vec3.fromValues(p[0], p[1], 1.0);

      var timesVector3 = function( v: any, p ) : Float32Array {
        return new Float32Array([
          v[0] * p[0], v[1] * p[1], v[2],
          v[3] * p[0], v[4] * p[1], v[5],
          v[6] * p[0], v[7] * p[1], v[8]
        ]);
      }

      return timesVector3(rotationMatrix, p);
    }
  }

  // Code based on Ray Tracer in one weekend by Peter Shirley
  export class Ray {
    constructor(pos : Float32Array, dir: Float32Array) {
      this.A = pos;
      this.B = dir;
    }
    public origin() {
       return this.A;
    }
    public direction() {
      return this.B;
    }
    public point_at_parameter(t : number) {
      return this.A + t * this.B;
    }
    protected A;
    protected B;
  }
}