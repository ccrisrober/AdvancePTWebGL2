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


function getContext() : string {
  var contexts : Array<string> = "webgl2,experimental-webgl2,webgl,experimental-webgl".split(",");
  var currentCtx : string;
  var ctx;
  for ( var i = 0; i < contexts.length; i++ ) {
    ctx = contexts[i];
    gl = canvas.getContext(ctx);
    if(gl) {
      currentCtx = ctx;
      break;
    }
  }
  return currentCtx;
}

function getVendors() {
  var vendors = "ms,moz,webkit,o".split(",");
  if (!window.requestAnimationFrame) {
    var vendor;
    for (var i = 0; i < vendors.length; i++) {
      vendor = vendors[i];
      window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
      if (window.requestAnimationFrame) {
        break;
      }
    }
  }
}

module textures {
  var _textureID = 0;
  export function nextTextureID() : number {
    return _textureID++;
  }
  export function reset() {
    _textureID = 0;
  }
}





var canvas: any = document.getElementById( 'canvas' );
var size = [canvas.width, canvas.height];

var fog = false;

var gl : WebGLRenderingContext;
var failureMessage = '';


document.getElementById("webgl-impl").innerHTML = getContext();

console.log(gl);
if (!gl) {
  failureMessage = 'Could not load WebGL Context';
  alert("WEBGL not supported");
  throw "ERROR";
}

gl.getExtension("OES_texture_float"); // Only if webgl 1
gl.getExtension("OES_texture_float_linear");

getVendors();

if (!window.requestAnimationFrame) {
  alert("Please, update your navegator ...");
}

module globals {

	export var defaultIOR = 1.000277;
	export var epsilon = 0.0001;
	export var smallEpsilon = 0.0000001;
  export var montecarloActive : boolean = true;

	export var vertexCode = `#version 300 es
in vec3 vertex;
out vec2 texCoord;
void main() {
  texCoord = vertex.xy * 0.5 + 0.5;
  gl_Position = vec4( vertex, 1 );
}`;

	export function toFloat( n ) {
    var s = n.toString();
    return ( s.indexOf( '.' ) < 0 && s.indexOf( 'e' ) < 0 && s.indexOf( 'E' ) < 0 ) ? ( s + '.0' ) : s;
  };

  export function toVec2( vector2 ) {
    return 'vec2(' + vector2[0] + ',' + vector2[1] + ')';
  };

  export function toVec3( vector3 ) {
    return 'vec3(' + vector3[0] + ',' + vector3[1] + ','+ vector3[2] + ')';
  };
};
