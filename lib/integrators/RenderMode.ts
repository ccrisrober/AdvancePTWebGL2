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

/// <reference path="../utility.ts" />
/// <reference path="../ShaderProgram.ts" />
/// <reference path="../quadsToneMap.ts" />

abstract class RenderMode {
  public stepProgram : ShaderProgram;
  public uniformCallback;
  public size;
  public renderProgram : ShaderProgram;
  public startTime;
  public samples;
  public MAX_SAMPLES = 32;
  constructor( uniformCallback, size ) {
    this.uniformCallback = uniformCallback;
    this.size = size;
    this.renderProgram = toneMap.textureQuadGammaProgram;

    this.startTime = Date.now();

    this.initialize();
  }

  public resetShader(objects, projection, environment, bounces : number = 1) {
    if( this.stepProgram ) {
      this.stepProgram.dispose();
    }
    // Las clases heredadas implementan la recreación del nuevo shader
    this.recreateShader( objects, projection, environment, bounces );
  }

  abstract recreateShader( objects, projection, environment, bounces );

  public makeTexture() {
    var type = gl.FLOAT; //gl.getExtension( 'OES_texture_float' ) || gl ? gl.FLOAT : gl.UNSIGNED_BYTE;
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, this.size[0], this.size[1], 0, gl.RGB, type, null );
    gl.bindTexture( gl.TEXTURE_2D, null );
    return texture;
  }

  protected frameBuffer : WebGLFramebuffer;
  protected vertexBuffer : WebGLBuffer;
  protected textures : Array<WebGLTexture>;
  public brightness : number;

  public initialize() {
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [
      -1, -1,
      -1, +1,
      +1, -1,
      +1, +1
    ] ), gl.STATIC_DRAW );

    this.frameBuffer = gl.createFramebuffer();

    this.textures = new Array(2);

    this.textures[0] = this.makeTexture();
    this.textures[1] = this.makeTexture();

    this.samples = 0;
    this.brightness = 1;
  }

  public dispose() {
    gl.deleteBuffer( this.vertexBuffer );
    gl.deleteFramebuffer( this.frameBuffer );
    gl.deleteTexture( this.textures[0] );
    gl.deleteTexture( this.textures[1] );
  }

  public reset() {
    this.samples = 0;
  }

  public step() {
    if(!this.stepProgram || ((this.samples > this.MAX_SAMPLES) && (this.MAX_SAMPLES > 0))) { return; }
    
    this.stepProgram.use();

    // update uniforms specific to the sampler
    this.uniformCallback( this.stepProgram );

    var state0 = 1;
    var state1 = 2;

    var mwc1616 = function() {
      this.state0 = 18030 * (this.state0 & 0xffff) + (this.state0 << 16);
      this.state1 = 30903 * (this.state1 & 0xffff) + (this.state1 << 16);
      return this.state0 << 16 + (this.state1 & 0xffff);
    }

    gl.uniform1f( this.stepProgram.uniformLocations["time"], ( Date.now() - this.startTime + mwc1616() ) );
    gl.uniform1f( this.stepProgram.uniformLocations["weight"], this.samples / ( this.samples + 1 ) );
    gl.uniform2fv( this.stepProgram.uniformLocations["size"], this.size );

    // render to texture
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, this.textures[1] );
    gl.uniform1i( this.stepProgram.uniformLocations["previousTexture"], 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.frameBuffer );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[0], 0 );

    gl.enableVertexAttribArray( this.stepProgram.attribLocations["vertex"] );
    gl.vertexAttribPointer( this.stepProgram.attribLocations["vertex"], 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.bindTexture( gl.TEXTURE_2D, null );
    //gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );

    this.samples++;
  }

  public resetRenderProgram( prog: ShaderProgram ) {
    this.renderProgram = prog;
  }

  public render() {
    this.renderProgram.use();

    gl.uniform1f( this.renderProgram.uniformLocations["brightness"], this.brightness );

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, this.textures[0] );
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );

    gl.enableVertexAttribArray( this.renderProgram.attribLocations["vertex"] );
    gl.vertexAttribPointer( this.renderProgram.attribLocations["vertex"], 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    gl.bindTexture( gl.TEXTURE_2D, null );

    this.textures.reverse();
  }
}