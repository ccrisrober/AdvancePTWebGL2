// Path tracer in WebGL2
// Copyright (C) <2016> 
//	- Cristian Rodríguez Bernal (maldicion069)
//	- Juan Guerrero Martín (hire33)
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

/// <reference path="Renderable.ts" />

class Triangle extends Renderable {
	public v0 : Float32Array;
	public v1 : Float32Array;
	public v2 : Float32Array;

	constructor(v0, v1, v2, isDynamic: boolean, material : mat.Material) {
		super("triangle", isDynamic, material);
		this.v0 = v0;
		this.v1 = v1;
		this.v2 = v2;

		this.requiredSourceFrag = [sourceFrags.rayIntersectTriangle, sourceFrags.triangleNormal];
	}

	public update(program) {
	}

	public getUniformsDeclaration() : string {
		return "";
	}
	
	public getIntersectionExprType() {
		return "float";
	}

	public getIntersectionExpr( rayPosName, rayDirName ) {
		return "intersectTriangle(" + rayPosName + ", " + rayDirName + ", " 
			+ globals.toVec3(this.v0) + ", " + globals.toVec3(this.v1) + ", " + globals.toVec3(this.v2) + ");";
	}

	public getValidIntersectionCheck( hitName ) {
		//if (triangle0 < t) t = triangle0;
		return '(' + hitName + ' > ' + globals.smallEpsilon + ')';
	}

	public getT( hitName ) {
		return hitName;
	}

	public getInsideExpression( hitName ) {
		return false;
	}
	
	public getNormal( hitName, hitPositionName, rayPosName, rayDirName ) {
		return "normalForTriangle(" + globals.toVec3(this.v0) + ", " + globals.toVec3(this.v1) + ", " + globals.toVec3(this.v2) + ")";
	}

	public hitRay( ray: scene.Ray ) {
	}
};