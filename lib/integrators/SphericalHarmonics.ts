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

/// <reference path="RenderMode.ts" />

class SphericalHarmonics extends RenderMode {

	public sf : SourceFrag;

  constructor( uniformCallback, size, sf : string ) {
    super( uniformCallback, size );
    this.sf = sourceFrags[sf];
    if(!this.sf) {
    	throw "SourceFrag not found";
    }
  }
  public recreateShader(objects, projection, enviroments, bounces) {
    this.stepProgram = utility.createSphericalHarmonicShader(objects, projection, environment, bounces, this.sf);
  }
}