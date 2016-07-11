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

/// <reference path="../globals.ts" />
/// <reference path="../SourceFrag.ts" />
/// <reference path="../materials.ts" />
/// <reference path="../scene.ts" />

abstract class Renderable {
	protected static renderableGlobalID : number = 1;

	public static resetStaticID() {
		this.renderableGlobalID = 1;
	}

	public id : number;
	public uniforms : Array<string>;
	public prefix : string;
	public isDynamic : boolean;
	public material : mat.Material;
	public requiredSourceFrag = [];
	constructor(type : string, isDynamic : boolean, material : mat.Material) {
		this.id = Renderable.renderableGlobalID++;
		this.prefix = type + this.id;
		this.isDynamic = isDynamic;
		this.material = material;
	}
	abstract getUniformsDeclaration() : string;
	abstract update(program);
	abstract getInsideExpression( hitName );
	abstract getIntersectionExprType();
	abstract getValidIntersectionCheck( hitName );
	abstract getT( hitName );
	abstract getIntersectionExpr( rayPosName, rayDirName );
	abstract getNormal( hitName, hitPositionName, rayPosName, rayDirName );
	
	// HitRay es solo para hacer ray casting con el rato
	abstract hitRay( ray: scene.Ray );
}