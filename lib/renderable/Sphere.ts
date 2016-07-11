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

class Sphere extends Renderable {
  protected isTwoSided;
  public center;
  protected radius;
  protected radiusName;
  protected centerName;
  protected radiusValue;
  protected centerValue;
  constructor( center, radius, isDynamic, material, isTwoSided ) {
    super("sphere", isDynamic, material);
    this.isTwoSided = isTwoSided;

    this.center = center;
    this.radius = radius;

    this.radiusName = this.prefix + 'radius';
    this.centerName = this.prefix + 'center';

    this.requiredSourceFrag = [sourceFrags.rayIntersectSphere,sourceFrags.normalForSphere];

    this.refresh();
  }
  public update(program) {
    if ( this.isDynamic ) {
      gl.uniform3fv( program.uniformLocations[this.centerName], this.center );
      gl.uniform1f( program.uniformLocations[this.radiusName], this.radius );
    }
  }
  public refresh() {
    if ( this.isDynamic ) {
      this.radiusValue = this.radiusName;
      this.centerValue = this.centerName;
    } else {
      this.centerValue = globals.toVec3( this.center );
      this.radiusValue = globals.toFloat( this.radius );


      this.centerValue = '( ' + this.centerValue + ' + vec3( -( times.x + ( times.y - times.x ) * ( pseudorandom(seed*14.53+1.6) ) ), 0.0, 0.0 ) )'
    }

    this.uniforms = this.isDynamic ? [this.radiusName, this.centerName] : [];
  }

  public getUniformsDeclaration() {
    if ( this.isDynamic ) {
      return 'uniform vec3 ' + this.centerName + ';\n' +
             'uniform float ' + this.radiusName + ';\n';
    } else {
      return '';
    }
  }

  public getIntersectionExprType() {
    return 'vec2';
  }

  public getIntersectionExpr( rayPosName, rayDirName ) {
    return 'rayIntersectSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + rayPosName + ', ' + rayDirName + ' );';
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
    if ( this.isTwoSided ) {
      // if our "front" hit t<0, negate the normal
      return '( sign( ' + hitName + '.x ) * normalForSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + hitPositionName + ' ) )';
    } else {
      return 'normalForSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + hitPositionName + ' )';
    }
  }

  public hitRay( ray: scene.Ray ) {
    var toSphere = vec3.subtract(ray.origin(), ray.origin(), this.center);
    var a = vec3.dot(ray.direction(), ray.direction() );
    var b = 2 * vec3.dot(toSphere, ray.direction() );
    var c = vec3.dot(toSphere, toSphere ) - this.radius * this.radius;
    var discriminant = b * b - 4 * a * c;
    if ( discriminant > 0.00001 ) {
      var sqt = Math.sqrt( discriminant );
      var ta = ( -sqt - b ) / ( 2 * a );
      if ( ta > 0.00001 ) {
        return ta;
      }
      var tb = ( sqt - b ) / ( 2 * a );
      if ( tb > 0.00001 ) {
        return tb;
      }
    }
    return Number.POSITIVE_INFINITY;
  }
}