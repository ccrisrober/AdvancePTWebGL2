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

namespace HDRLoader {
  export function createHDRTexture( gl, rawData, width, height, format ) {
    var floatTex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, floatTex );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, false );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB16F, width, height, 0, format, gl.FLOAT, rawData );
    gl.bindTexture( gl.TEXTURE_2D, null );

    return floatTex;
  }
  export function asyncLoadHDRTexture( gl, url, width, height, format, callback ) {
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.responseType = 'arraybuffer';

    req.onload = function ( evt ) {
      var arrayBuffer = req.response;
      if ( arrayBuffer ) {
        var bytes = new Uint8Array( arrayBuffer );
        var data = new Float32Array( width * height * 3 );

        var byteIdx = 0;

        // skip the main header (we already assume the format, width and height)
        for ( ; byteIdx < bytes.length; byteIdx++ ) {
          if ( bytes[byteIdx] === 0x0A && bytes[byteIdx+1] === 0x0A ) {
            byteIdx = byteIdx + 2;
            break;
          }
        }
        // skip the resolution bit
        for ( ; byteIdx < bytes.length; byteIdx++ ) {
          if ( bytes[byteIdx] === 0x0A ) {
            byteIdx = byteIdx + 1;
            break;
          }
        }

        var idx = 0;
        for ( var row = 0; row < height; row++ ) {
          for ( var col = 0; col < width; col++ ) {
            var r = bytes[byteIdx++];
            var g = bytes[byteIdx++];
            var b = bytes[byteIdx++];
            var e = bytes[byteIdx++];
            var expFactor = Math.pow( 2, e - 128 );
            data[idx++] = ( r / 256 ) * expFactor;
            data[idx++] = ( g / 256 ) * expFactor;
            data[idx++] = ( b / 256 ) * expFactor;
          }
        }

        var floatTex = createHDRTexture( gl, data, width, height, format );

        callback( floatTex );
      } else {
        callback( null );
      }
    };
    req.send( null );
  }
}