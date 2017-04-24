var toneMap;
(function (toneMap) {
    toneMap.textureQuadSimpleProgram = new ShaderProgram();
    toneMap.textureQuadSimpleProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadSimpleProgram.addShader('#version 300 es\n' +
        'precision highp float;\n' +
        'in vec2 texCoord;\n' +
        'uniform sampler2D texture_;\n' +
        'out vec4 fragColor;\n' +
        'void main() {\n' +
        '  fragColor = texture( texture_, texCoord );\n' +
        '}', gl.FRAGMENT_SHADER, mode.read_text);
    toneMap.textureQuadSimpleProgram.compile_and_link();
    toneMap.textureQuadSimpleProgram.addAttributes(["vertex"]);
    toneMap.textureQuadSimpleProgram.addUniforms(["texture_"]);
    toneMap.textureQuadGammaProgram = new ShaderProgram();
    toneMap.textureQuadGammaProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadGammaProgram.addShader('#version 300 es\n' +
        'precision highp float;\n' +
        'in vec2 texCoord;\n' +
        'uniform sampler2D texture_;\n' +
        'uniform float brightness;\n' +
        'out vec4 fragColor;\n' +
        'void main() {\n' +
        '  fragColor = texture( texture_, texCoord );\n' +
        '  fragColor.rgb = brightness * pow( abs( fragColor.rgb ), vec3( 1.0 / 2.2 ) );\n' +
        '}', gl.FRAGMENT_SHADER, mode.read_text);
    toneMap.textureQuadGammaProgram.compile_and_link();
    toneMap.textureQuadGammaProgram.addAttributes(["vertex"]);
    toneMap.textureQuadGammaProgram.addUniforms(["texture_", "brightness"]);
    toneMap.textureQuadReinhardProgram = new ShaderProgram();
    toneMap.textureQuadReinhardProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadReinhardProgram.addShader('#version 300 es\n' +
        'precision highp float;\n' +
        'in vec2 texCoord;\n' +
        'uniform sampler2D texture_;\n' +
        'uniform float brightness;\n' +
        'out vec4 fragColor;\n' +
        'void main() {\n' +
        '  fragColor = texture( texture_, texCoord );\n' +
        '  fragColor.rgb = fragColor.rgb / ( 1.0 + fragColor.rgb );\n' +
        '  fragColor.rgb = brightness * pow( abs( fragColor.rgb ), vec3( 1.0 / 2.2 ) );\n' +
        '}', gl.FRAGMENT_SHADER, mode.read_text);
    toneMap.textureQuadReinhardProgram.compile_and_link();
    toneMap.textureQuadReinhardProgram.addAttributes(["vertex"]);
    toneMap.textureQuadReinhardProgram.addUniforms(["texture_", "brightness"]);
    toneMap.textureQuadFilmicProgram = new ShaderProgram();
    toneMap.textureQuadFilmicProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadFilmicProgram.addShader('#version 300 es\n' +
        'precision highp float;\n' +
        'in vec2 texCoord;\n' +
        'uniform sampler2D texture_;\n' +
        'uniform float brightness;\n' +
        'out vec4 fragColor;\n' +
        'void main() {\n' +
        '  vec3 color = texture( texture_, texCoord ).rgb * pow( abs( brightness ), 2.2 );\n' +
        '  color = max(vec3(0.), color - vec3(0.004));\n' +
        '  color = (color * (6.2 * color + .5)) / (color * (6.2 * color + 1.7) + 0.06);\n' +
        '  fragColor = vec4( color, 1.0 );\n' +
        '}', gl.FRAGMENT_SHADER, mode.read_text);
    toneMap.textureQuadFilmicProgram.compile_and_link();
    toneMap.textureQuadFilmicProgram.addAttributes(["vertex"]);
    toneMap.textureQuadFilmicProgram.addUniforms(["texture_", "brightness"]);
    toneMap.textureQuadsRGBProgram = new ShaderProgram();
    toneMap.textureQuadsRGBProgram.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadsRGBProgram.addShader('#version 300 es\n' +
        'precision highp float;\n' +
        'in vec2 texCoord;\n' +
        'uniform sampler2D texture_;\n' +
        'out vec4 fragColor;\n' +
        'float sRGB_gamma_correct(float c) {\n' +
        " const float a = 0.055;\n" +
        " if(c < 0.0031308) return 12.92*c;\n" +
        " else return (1.0+a)*pow(c, 1.0/2.4) - a;\n" +
        "}\n" +
        'void main() {\n' +
        '  fragColor = texture( texture_, texCoord );\n' +
        '  fragColor.r = sRGB_gamma_correct(fragColor.r);\n' +
        '  fragColor.g = sRGB_gamma_correct(fragColor.g);\n' +
        '  fragColor.b = sRGB_gamma_correct(fragColor.b);\n' +
        '}', gl.FRAGMENT_SHADER, mode.read_text);
    toneMap.textureQuadsRGBProgram.compile_and_link();
    toneMap.textureQuadsRGBProgram.addAttributes(["vertex"]);
    toneMap.textureQuadsRGBProgram.addUniforms(["texture_", "brightness"]);
    toneMap.textureQuadUncharted2Program = new ShaderProgram();
    toneMap.textureQuadUncharted2Program.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
    toneMap.textureQuadUncharted2Program.addShader('#version 300 es\n' +
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
    toneMap.textureQuadUncharted2Program.compile_and_link();
    toneMap.textureQuadUncharted2Program.addAttributes(["vertex"]);
    toneMap.textureQuadUncharted2Program.addUniforms(["texture_", "brightness"]);
})(toneMap || (toneMap = {}));
//# sourceMappingURL=quadsToneMap.js.map