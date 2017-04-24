var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Box = (function (_super) {
    __extends(Box, _super);
    function Box(minPoint, maxPoint, isDynamic, material, isTwoSided) {
        _super.call(this, "box", isDynamic, material);
        this.isTwoSided = isTwoSided;
        this.min = minPoint;
        this.max = maxPoint;
        this.minName = this.prefix + 'min';
        this.maxName = this.prefix + 'max';
        this.centerName = this.prefix + 'center';
        this.halfSizeName = this.prefix + 'halfSize';
        this.requiredSourceFrag = [sourceFrags.rayIntersectBox,
            sourceFrags.normalForBox];
        this.uniforms = isDynamic ? [this.minName, this.maxName] : [];
    }
    Box.prototype.update = function (program) {
        if (this.isDynamic) {
            gl.uniform3fv(program.uniformLocations[this.minName], vec3.fromValues(this.min[0], this.min[1], this.min[2]));
            gl.uniform3fv(program.uniformLocations[this.maxName], vec3.fromValues(this.max[0], this.max[1], this.max[2]));
        }
    };
    Box.prototype.getUniformsDeclaration = function () {
        if (this.isDynamic) {
            return 'uniform vec3 ' + this.minName + ';\n' +
                'uniform vec3 ' + this.maxName + ';\n' +
                'vec3 ' + this.centerName + ' = ( ' + this.maxName + ' + ' + this.minName + ' ) / 2.0;\n' +
                'vec3 ' + this.halfSizeName + ' = ( ' + this.maxName + ' - ' + this.minName + ' ) / 2.0;\n';
        }
        else {
            return '';
        }
    };
    Box.prototype.getIntersectionExprType = function () {
        return 'vec2';
    };
    Box.prototype.getIntersectionExpr = function (rayPosName, rayDirName) {
        var min = this.isDynamic ? this.minName : globals.toVec3(this.min);
        var max = this.isDynamic ? this.maxName : globals.toVec3(this.max);
        return 'rayIntersectBox( ' + min + ', ' + max + ', ' + rayPosName + ', ' + rayDirName + ' );';
    };
    Box.prototype.getValidIntersectionCheck = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.y > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
        }
        else {
            return '(' + hitName + '.x > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
        }
    };
    Box.prototype.getT = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.x > ' + globals.smallEpsilon + ' ? ' + hitName + '.x : ' + hitName + '.y)';
        }
        else {
            return hitName + '.x';
        }
    };
    Box.prototype.getInsideExpression = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.x < 0.0)';
        }
        else {
            return 'false';
        }
    };
    Box.prototype.getNormal = function (hitName, hitPositionName, rayPosName, rayDirName) {
        var aux = vec3.create();
        aux = vec3.add(aux, this.max, this.min);
        aux = vec3.fromValues(aux[0] / 2, aux[1] / 2, aux[2] / 2);
        var aux2 = vec3.create();
        aux2 = vec3.sub(aux2, this.max, this.min);
        aux2 = vec3.fromValues(aux2[0] / 2, aux2[1] / 2, aux2[2] / 2);
        var center = globals.toVec3(aux);
        var halfSize = globals.toVec3(aux2);
        if (this.isTwoSided) {
            return '( sign( ' + hitName + '.x ) * normalForBox( ' + center + ', ' + halfSize + ', ' + hitPositionName + ' ) )';
        }
        else {
            return 'normalForBox( ' + center + ', ' + halfSize + ', ' + hitPositionName + ' )';
        }
    };
    Box.prototype.hitRay = function (ray) {
        var tBack = vec3.fromValues((this.min[0] - ray.origin()[0]) / ray.direction()[0], (this.min[1] - ray.origin()[1]) / ray.direction()[1], (this.min[2] - ray.origin()[2]) / ray.direction()[2]);
        var tFront = vec3.fromValues((this.max[0] - ray.origin()[0]) / ray.direction()[0], (this.max[1] - ray.origin()[1]) / ray.direction()[1], (this.max[2] - ray.origin()[2]) / ray.direction()[2]);
        var tMin = vec3.fromValues(Math.min(tBack[0], tFront[0]), Math.min(tBack[1], tFront[1]), Math.min(tBack[2], tFront[2]));
        var tMax = vec3.fromValues(Math.max(tBack[0], tFront[0]), Math.max(tBack[1], tFront[1]), Math.max(tBack[2], tFront[2]));
        var tNear = Math.max(Math.max(tMin[0], tMin[1]), tMin[2]);
        var tFar = Math.min(Math.min(tMax[0], tMax[1]), tMax[2]);
        if (tNear >= tFar || tNear < 0.00001) {
            return Number.POSITIVE_INFINITY;
        }
        else {
            return tNear;
        }
    };
    return Box;
}(Renderable));
;
//# sourceMappingURL=Box.js.map