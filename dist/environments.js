var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var environments;
(function (environments) {
    var AbsEnviroment = (function () {
        function AbsEnviroment() {
            this.requiredSourceFrag = [];
        }
        AbsEnviroment.prototype.update = function (program) { };
        return AbsEnviroment;
    }());
    environments.AbsEnviroment = AbsEnviroment;
    var SimpleEnvironment = (function (_super) {
        __extends(SimpleEnvironment, _super);
        function SimpleEnvironment(src, sfs) {
            _super.call(this);
            this.src = src;
            this.uniforms = [];
            this.requiredSourceFrag = sfs;
        }
        SimpleEnvironment.prototype.update = function (program) { };
        SimpleEnvironment.prototype.getUniformsDeclaration = function () {
            return "";
        };
        SimpleEnvironment.prototype.getEnvironmentExpression = function () {
            return this.src;
        };
        return SimpleEnvironment;
    }(AbsEnviroment));
    environments.SimpleEnvironment = SimpleEnvironment;
    var TextureEnvironment = (function (_super) {
        __extends(TextureEnvironment, _super);
        function TextureEnvironment(envTexture, mult, rot) {
            _super.call(this);
            this.envTexture = envTexture;
            this.mult = mult;
            this.rotation = rot;
            this.uniforms = ['envTexture', 'envRotation', 'envMult'];
            this.requiredSourceFrag = [sourceFrags.PI, sourceFrags.TWO_PI];
        }
        TextureEnvironment.prototype.update = function (program) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.envTexture);
            gl.uniform1i(program.uniformLocations["envTexture"], 1);
            gl.uniform1f(program.uniformLocations["envRotation"], this.rotation);
            gl.uniform1f(program.uniformLocations["envMult"], this.mult);
        };
        TextureEnvironment.prototype.getUniformsDeclaration = function () {
            return "\n        uniform sampler2D envTexture;\n        uniform float envRotation;\n        uniform float envMult;";
        };
        TextureEnvironment.prototype.getEnvironmentExpression = function () {
            var textureLookup;
            var coord = 'vec2( -atan( rayDir.z, rayDir.x ) / TWO_PI + 0.5 + envRotation, ( 0.5 - asin( rayDir.y ) / PI ) * 2.0)';
            textureLookup = 'texture( envTexture, ' + coord + ' ).rgb';
            return '      accumulation += attenuation * ' + textureLookup + ' * envMult;\n';
        };
        return TextureEnvironment;
    }(AbsEnviroment));
    environments.TextureEnvironment = TextureEnvironment;
})(environments || (environments = {}));
//# sourceMappingURL=environments.js.map