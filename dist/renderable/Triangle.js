var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Triangle = (function (_super) {
    __extends(Triangle, _super);
    function Triangle(v0, v1, v2, isDynamic, material) {
        _super.call(this, "triangle", isDynamic, material);
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.requiredSourceFrag = [sourceFrags.rayIntersectTriangle, sourceFrags.triangleNormal];
    }
    Triangle.prototype.update = function (program) {
    };
    Triangle.prototype.getUniformsDeclaration = function () {
        return "";
    };
    Triangle.prototype.getIntersectionExprType = function () {
        return "float";
    };
    Triangle.prototype.getIntersectionExpr = function (rayPosName, rayDirName) {
        return "intersectTriangle(" + rayPosName + ", " + rayDirName + ", "
            + globals.toVec3(this.v0) + ", " + globals.toVec3(this.v1) + ", " + globals.toVec3(this.v2) + ");";
    };
    Triangle.prototype.getValidIntersectionCheck = function (hitName) {
        return '(' + hitName + ' > ' + globals.smallEpsilon + ')';
    };
    Triangle.prototype.getT = function (hitName) {
        return hitName;
    };
    Triangle.prototype.getInsideExpression = function (hitName) {
        return false;
    };
    Triangle.prototype.getNormal = function (hitName, hitPositionName, rayPosName, rayDirName) {
        return "normalForTriangle(" + globals.toVec3(this.v0) + ", " + globals.toVec3(this.v1) + ", " + globals.toVec3(this.v2) + ")";
    };
    Triangle.prototype.hitRay = function (ray) {
    };
    return Triangle;
}(Renderable));
;
//# sourceMappingURL=Triangle.js.map