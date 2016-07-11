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

class Box extends Renderable{
  private isTwoSided;
  private min;
  private max;
  private minName;
  private maxName;
  private centerName;
  private halfSizeName;
  constructor( minPoint, maxPoint, isDynamic, material, isTwoSided ) {
    super("box", isDynamic, material);
    
    this.isTwoSided = isTwoSided;

    this.min = minPoint;
    this.max = maxPoint;

    this.minName = this.prefix + 'min';
    this.maxName = this.prefix + 'max';
    this.centerName = this.prefix + 'center';
    this.halfSizeName = this.prefix + 'halfSize';

    this.requiredSourceFrag = [sourceFrags.rayIntersectBox, 
        sourceFrags.normalForBox];

    this.uniforms = isDynamic ? [this.minName, this.maxName] : [];
  }

  public update(program) {
    if ( this.isDynamic ) {
      gl.uniform3fv( program.uniformLocations[this.minName], vec3.fromValues(this.min[0], this.min[1], this.min[2]) );
      gl.uniform3fv( program.uniformLocations[this.maxName], vec3.fromValues(this.max[0], this.max[1], this.max[2]) );
    }
  }

  public getUniformsDeclaration() {
    if ( this.isDynamic ) {
      return 'uniform vec3 ' + this.minName + ';\n' +
             'uniform vec3 ' + this.maxName + ';\n' +
             'vec3 ' + this.centerName + ' = ( ' + this.maxName + ' + ' + this.minName + ' ) / 2.0;\n' +
             'vec3 ' + this.halfSizeName + ' = ( ' + this.maxName + ' - ' + this.minName + ' ) / 2.0;\n';
    } else {
      return '';
    }
  }

  public getIntersectionExprType() {
    return 'vec2';
  }

  public getIntersectionExpr( rayPosName, rayDirName ) {
    var min = this.isDynamic ? this.minName : globals.toVec3( this.min );
    var max = this.isDynamic ? this.maxName : globals.toVec3( this.max );
    return 'rayIntersectBox( ' + min + ', ' + max + ', ' + rayPosName + ', ' + rayDirName + ' );';
  }

  public getValidIntersectionCheck( hitName ) {
    if ( this.isTwoSided ) {
      // we only care if the more "distant" hit is t>0 if we do the two-sided check
      return '(' + hitName + '.y > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
    } else {
      return '(' + hitName + '.x > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
    }
  }

  public getT( hitName ) {
    if ( this.isTwoSided ) {
      // pick the "front" point that has t>0
      return '(' + hitName + '.x > ' + globals.smallEpsilon + ' ? ' + hitName + '.x : ' + hitName + '.y)';
    } else {
      return hitName + '.x';
    }
  }

  public getInsideExpression( hitName ) {
    if ( this.isTwoSided ) {
      return '(' + hitName + '.x < 0.0)';
    } else {
      return 'false';
    }
  }

  public getNormal( hitName, hitPositionName, rayPosName, rayDirName ) {
    var aux = vec3.create();
    aux = vec3.add(aux, this.max, this.min);
    aux = vec3.fromValues(aux[0]/2, aux[1]/2, aux[2]/2);

    var aux2 = vec3.create();
    aux2 = vec3.sub(aux2, this.max, this.min);
    aux2 = vec3.fromValues(aux2[0]/2, aux2[1]/2, aux2[2]/2);

    var center = globals.toVec3(aux);//this.isDynamic ? this.centerName : globals.toVec3( this.max.plus( this.min ).times( 0.5 ) );
    var halfSize = globals.toVec3(aux2);//this.isDynamic ? this.halfSizeName : globals.toVec3( this.max.minus( this.min ).times( 0.5 ) );

    if ( this.isTwoSided ) {
      // if our "front" hit t<0, negate the normal
      return '( sign( ' + hitName + '.x ) * normalForBox( ' + center + ', ' + halfSize + ', ' + hitPositionName + ' ) )';
    } else {
      return 'normalForBox( ' + center + ', ' + halfSize + ', ' + hitPositionName + ' )';
    }
  }

  public hitRay( ray: scene.Ray ) {
    // t values for the negative plane sides
    var tBack = vec3.fromValues( ( this.min[0] - ray.origin()[0] ) / ray.direction()[0],
                   ( this.min[1] - ray.origin()[1] ) / ray.direction()[1],
                   ( this.min[2] - ray.origin()[2]) / ray.direction()[2]);
    var tFront = vec3.fromValues( ( this.max[0] - ray.origin()[0] ) / ray.direction()[0],
                    ( this.max[1] - ray.origin()[1] ) / ray.direction()[1],
                    ( this.max[2] - ray.origin()[2]) / ray.direction()[2]);

    // sort t values based on closeness
    var tMin = vec3.fromValues( Math.min( tBack[0], tFront[0] ), Math.min( tBack[1], tFront[1] ), Math.min( tBack[2], tFront[2] ) );
    var tMax = vec3.fromValues( Math.max( tBack[0], tFront[0] ), Math.max( tBack[1], tFront[1] ), Math.max( tBack[2], tFront[2] ) );

    // farthest "near" is when the ray as passed all three planes
    var tNear = Math.max( Math.max( tMin[0], tMin[1] ), tMin[2] );

    // closest "far" is when the ray will exit
    var tFar = Math.min( Math.min( tMax[0], tMax[1] ), tMax[2] );

    // if tNear >= tFar, there is no intersection  (tNear,tFar)
    if ( tNear >= tFar || tNear < 0.00001 ) {
      return Number.POSITIVE_INFINITY;
    } else {
      return tNear;
    }
  }
};