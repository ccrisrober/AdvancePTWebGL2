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

/// <reference path="../gl-matrix.d.ts" />
/// <reference path="Renderable.ts" />

class Plane extends Renderable {
  public d : number;
  public normal : Float32Array;
  public normalName : string;
  public dName : string;

  constructor( normal, d, isDynamic, material ) {
    super("plane", isDynamic, material);

    this.normal = normal;
    this.d = d;

    this.normalName = this.prefix + 'normal';
    this.dName = this.prefix + 'd';

    this.requiredSourceFrag = [sourceFrags.rayIntersectPlane];

    this.uniforms = isDynamic ? [this.normalName, this.dName] : [];
  }

  public getInsideExpression( hitName ) {
    return false;
  }

  public update( program ) {
    if ( this.isDynamic ) {
      gl.uniform3fv( program.uniformLocations[this.normalName], this.normal );
      gl.uniform1f( program.uniformLocations[this.dName], this.d );
    }
  }

  public getUniformsDeclaration() {
    if ( this.isDynamic ) {
      return 'uniform vec3 ' + this.normalName + ';\n' +
             'uniform float ' + this.dName + ';\n';
    } else {
      return 'const vec3 ' + this.normalName + ' = ' + globals.toVec3( this.normal ) + ';\n' +
             'const float ' + this.dName + ' = ' + globals.toFloat( this.d ) + ';\n';
    }
  }

  public getIntersectionExprType() {
    return 'float';
  }

  public getIntersectionExpr( rayPosName, rayDirName ) {
    return 'rayIntersectPlane( ' + this.normalName + ', ' + this.dName + ', ' + rayPosName + ', ' + rayDirName + ' );';
  }

  public getValidIntersectionCheck( hitName ) {
    return '(' + hitName + ' > ' + globals.smallEpsilon + ')';
  }

  public getT( hitName ) {
    return hitName;
  }

  public getNormal( hitName, hitPositionName, rayPosName, rayDirName ) {
    return this.normalName;
  }

  public hitRay( ray: scene.Ray ) {
    var t : number = ( this.d - vec3.dot(this.normal, ray.origin()) ) / vec3.dot(this.normal, ray.direction());
    return t > globals.smallEpsilon ? t : Number.POSITIVE_INFINITY;
  }
}
