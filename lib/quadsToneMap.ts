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

/// <reference path="shaderProgram.ts" />
/// <reference path="globals.ts" />

// FOG bonita https://www.shadertoy.com/view/lsc3RM

// Based on https://www.shadertoy.com/view/lslGzl
module toneMap {
  //console.log("textureQuadSimpleProgram");
  export var textureQuadSimpleProgram : ShaderProgram = new ShaderProgram();
  textureQuadSimpleProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadSimpleProgram.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'out vec4 fragColor;\n' +
    'void main() {\n' +
    '  fragColor = texture( texture_, texCoord );\n' +
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadSimpleProgram.compile_and_link();
  textureQuadSimpleProgram.addAttributes(["vertex"]);
  textureQuadSimpleProgram.addUniforms(["texture_"]);

  //console.log("textureQuadGammaProgram");
  export var textureQuadGammaProgram : ShaderProgram = new ShaderProgram();
  textureQuadGammaProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadGammaProgram.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'uniform float brightness;\n' +
    'out vec4 fragColor;\n' +
    'void main() {\n' +
    '  fragColor = texture( texture_, texCoord );\n' +
    '  fragColor.rgb = brightness * pow( abs( fragColor.rgb ), vec3( 1.0 / 2.2 ) );\n' + // gamma correction
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadGammaProgram.compile_and_link();
  textureQuadGammaProgram.addAttributes(["vertex"]);
  textureQuadGammaProgram.addUniforms(["texture_", "brightness"]);

  // draw a textured quad
  //console.log("textureQuadReinhardProgram");
  export var textureQuadReinhardProgram : ShaderProgram = new ShaderProgram();
  textureQuadReinhardProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadReinhardProgram.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'uniform float brightness;\n' +
    'out vec4 fragColor;\n' +
    'void main() {\n' +
    '  fragColor = texture( texture_, texCoord );\n' +
    '  fragColor.rgb = fragColor.rgb / ( 1.0 + fragColor.rgb );\n' +
    '  fragColor.rgb = brightness * pow( abs( fragColor.rgb ), vec3( 1.0 / 2.2 ) );\n' + // gamma correction
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadReinhardProgram.compile_and_link();
  textureQuadReinhardProgram.addAttributes(["vertex"]);
  textureQuadReinhardProgram.addUniforms(["texture_", "brightness"]);

  // draw a textured quad
  //console.log("textureQuadFilmicProgram");
  export var textureQuadFilmicProgram : ShaderProgram = new ShaderProgram();
  textureQuadFilmicProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadFilmicProgram.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'uniform float brightness;\n' +
    'out vec4 fragColor;\n' +
    'void main() {\n' +
    // based on notes in http://filmicgames.com/archives/75
    '  vec3 color = texture( texture_, texCoord ).rgb * pow( abs( brightness ), 2.2 );\n' +
    '  color = max(vec3(0.), color - vec3(0.004));\n' +
    '  color = (color * (6.2 * color + .5)) / (color * (6.2 * color + 1.7) + 0.06);\n' +
    '  fragColor = vec4( color, 1.0 );\n' +
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadFilmicProgram.compile_and_link();
  textureQuadFilmicProgram.addAttributes(["vertex"]);
  textureQuadFilmicProgram.addUniforms(["texture_", "brightness"]);

  // draw a textured quad
  //console.log("textureQuadsRGBProgram");
  export var textureQuadsRGBProgram : ShaderProgram = new ShaderProgram();
  textureQuadsRGBProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadsRGBProgram.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'out vec4 fragColor;\n' +
    'float sRGB_gamma_correct(float c) {\n' +
    " const float a = 0.055;\n" +
    " if(c < 0.0031308) return 12.92*c;\n" +
    " else return (1.0+a)*pow(c, 1.0/2.4) - a;\n" +
    "}\n"+
    'void main() {\n' +
    '  fragColor = texture( texture_, texCoord );\n' +
    '  fragColor.r = sRGB_gamma_correct(fragColor.r);\n' +
    '  fragColor.g = sRGB_gamma_correct(fragColor.g);\n' +
    '  fragColor.b = sRGB_gamma_correct(fragColor.b);\n' +
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadsRGBProgram.compile_and_link();
  textureQuadsRGBProgram.addAttributes(["vertex"]);
  textureQuadsRGBProgram.addUniforms(["texture_", "brightness"]);

  // draw a textured quad
  //console.log("textureQuadUncharted2Program");
  export var textureQuadUncharted2Program : ShaderProgram = new ShaderProgram();
  textureQuadUncharted2Program.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
  textureQuadUncharted2Program.addShader('#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 texCoord;\n' +
    'uniform sampler2D texture_;\n' +
    'uniform float brightness;\n' +
    'out vec4 fragColor;\n' +
    'void main() {\n' +
    '  fragColor = texture( texture_, texCoord );\n' +
    '  float A = 0.15;\n' +
    '  float B = 0.50;\n' +
    '  float C = 0.10;\n' +
    '  float D = 0.20;\n' +
    '  float E = 0.02;\n' +
    '  float F = 0.30;\n' +
    '  float W = 11.2;\n' +
    '  float exposure = brightness;//2.;\n' +
    '  fragColor.rgb *= exposure;\n' +
    '  fragColor.rgb = ((fragColor.rgb * (A * fragColor.rgb + C * B) + D * E) / (fragColor.rgb * (A * fragColor.rgb + B) + D * F)) - E / F;\n' +
    '  float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;\n' +
    '  fragColor.rgb /= white;\n' +
    '  fragColor.rgb = pow(fragColor.rgb, vec3(1. / 2.2));\n' +
    '}', gl.FRAGMENT_SHADER, mode.read_text);
  textureQuadUncharted2Program.compile_and_link();
  textureQuadUncharted2Program.addAttributes(["vertex"]);
  textureQuadUncharted2Program.addUniforms(["texture_", "brightness"]);
}
