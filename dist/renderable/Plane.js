var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Plane = (function (_super) {
    __extends(Plane, _super);
    function Plane(normal, d, isDynamic, material) {
        _super.call(this, "plane", isDynamic, material);
        this.normal = normal;
        this.d = d;
        this.normalName = this.prefix + 'normal';
        this.dName = this.prefix + 'd';
        this.requiredSourceFrag = [sourceFrags.rayIntersectPlane];
        this.uniforms = isDynamic ? [this.normalName, this.dName] : [];
    }
    Plane.prototype.getInsideExpression = function (hitName) {
        return false;
    };
    Plane.prototype.update = function (program) {
        if (this.isDynamic) {
            gl.uniform3fv(program.uniformLocations[this.normalName], this.normal);
            gl.uniform1f(program.uniformLocations[this.dName], this.d);
        }
    };
    Plane.prototype.getUniformsDeclaration = function () {
        if (this.isDynamic) {
            return 'uniform vec3 ' + this.normalName + ';\n' +
                'uniform float ' + this.dName + ';\n';
        }
        else {
            return 'const vec3 ' + this.normalName + ' = ' + globals.toVec3(this.normal) + ';\n' +
                'const float ' + this.dName + ' = ' + globals.toFloat(this.d) + ';\n';
        }
    };
    Plane.prototype.getIntersectionExprType = function () {
        return 'float';
    };
    Plane.prototype.getIntersectionExpr = function (rayPosName, rayDirName) {
        return 'rayIntersectPlane( ' + this.normalName + ', ' + this.dName + ', ' + rayPosName + ', ' + rayDirName + ' );';
    };
    Plane.prototype.getValidIntersectionCheck = function (hitName) {
        return '(' + hitName + ' > ' + globals.smallEpsilon + ')';
    };
    Plane.prototype.getT = function (hitName) {
        return hitName;
    };
    Plane.prototype.getNormal = function (hitName, hitPositionName, rayPosName, rayDirName) {
        return this.normalName;
    };
    Plane.prototype.hitRay = function (ray) {
        var t = (this.d - vec3.dot(this.normal, ray.origin())) / vec3.dot(this.normal, ray.direction());
        return t > globals.smallEpsilon ? t : Number.POSITIVE_INFINITY;
    };
    return Plane;
}(Renderable));
//# sourceMappingURL=Plane.js.map