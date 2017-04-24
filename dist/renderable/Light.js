var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Light = (function (_super) {
    __extends(Light, _super);
    function Light(center, radius, color) {
        _super.call(this, center, radius, true, new mat.Emit(new mat.Absorb(), vec3.fromValues(25, 25, 25), true, color), false);
    }
    Light.prototype.getColor = function () {
        return this.material.color;
    };
    Light.prototype.setColor = function (color) {
        this.material.setColor(vec3.fromValues(color.r, color.g, color.b));
    };
    Light.prototype.setIntensity = function (intensity) {
        this.material.emission = new Float32Array([intensity, intensity, intensity]);
    };
    Light.prototype.update = function (program) {
        gl.uniform3fv(program.uniformLocations[this.centerName], this.center);
        gl.uniform1f(program.uniformLocations[this.radiusName], this.radius);
    };
    Light.prototype.refresh = function () {
        this.radiusValue = this.radiusName;
        this.centerValue = this.centerName;
        this.uniforms = [this.radiusName, this.centerName];
    };
    return Light;
}(Sphere));
//# sourceMappingURL=Light.js.map