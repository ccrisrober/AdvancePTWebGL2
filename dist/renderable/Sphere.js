var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sphere = (function (_super) {
    __extends(Sphere, _super);
    function Sphere(center, radius, isDynamic, material, isTwoSided) {
        _super.call(this, "sphere", isDynamic, material);
        this.isTwoSided = isTwoSided;
        this.center = center;
        this.radius = radius;
        this.radiusName = this.prefix + 'radius';
        this.centerName = this.prefix + 'center';
        this.requiredSourceFrag = [sourceFrags.rayIntersectSphere, sourceFrags.normalForSphere];
        this.refresh();
    }
    Sphere.prototype.update = function (program) {
        if (this.isDynamic) {
            gl.uniform3fv(program.uniformLocations[this.centerName], this.center);
            gl.uniform1f(program.uniformLocations[this.radiusName], this.radius);
        }
    };
    Sphere.prototype.refresh = function () {
        if (this.isDynamic) {
            this.radiusValue = this.radiusName;
            this.centerValue = this.centerName;
        }
        else {
            this.centerValue = globals.toVec3(this.center);
            this.radiusValue = globals.toFloat(this.radius);
            this.centerValue = '( ' + this.centerValue + ' + vec3( -( times.x + ( times.y - times.x ) * ( pseudorandom(seed*14.53+1.6) ) ), 0.0, 0.0 ) )';
        }
        this.uniforms = this.isDynamic ? [this.radiusName, this.centerName] : [];
    };
    Sphere.prototype.getUniformsDeclaration = function () {
        if (this.isDynamic) {
            return 'uniform vec3 ' + this.centerName + ';\n' +
                'uniform float ' + this.radiusName + ';\n';
        }
        else {
            return '';
        }
    };
    Sphere.prototype.getIntersectionExprType = function () {
        return 'vec2';
    };
    Sphere.prototype.getIntersectionExpr = function (rayPosName, rayDirName) {
        return 'rayIntersectSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + rayPosName + ', ' + rayDirName + ' );';
    };
    Sphere.prototype.getValidIntersectionCheck = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.y > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
        }
        else {
            return '(' + hitName + '.x > ' + globals.smallEpsilon + ' && ' + hitName + '.x < ' + hitName + '.y)';
        }
    };
    Sphere.prototype.getT = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.x > ' + globals.smallEpsilon + ' ? ' + hitName + '.x : ' + hitName + '.y)';
        }
        else {
            return hitName + '.x';
        }
    };
    Sphere.prototype.getInsideExpression = function (hitName) {
        if (this.isTwoSided) {
            return '(' + hitName + '.x < 0.0)';
        }
        else {
            return 'false';
        }
    };
    Sphere.prototype.getNormal = function (hitName, hitPositionName, rayPosName, rayDirName) {
        if (this.isTwoSided) {
            return '( sign( ' + hitName + '.x ) * normalForSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + hitPositionName + ' ) )';
        }
        else {
            return 'normalForSphere( ' + this.centerValue + ', ' + this.radiusValue + ', ' + hitPositionName + ' )';
        }
    };
    Sphere.prototype.hitRay = function (ray) {
        var toSphere = vec3.subtract(ray.origin(), ray.origin(), this.center);
        var a = vec3.dot(ray.direction(), ray.direction());
        var b = 2 * vec3.dot(toSphere, ray.direction());
        var c = vec3.dot(toSphere, toSphere) - this.radius * this.radius;
        var discriminant = b * b - 4 * a * c;
        if (discriminant > 0.00001) {
            var sqt = Math.sqrt(discriminant);
            var ta = (-sqt - b) / (2 * a);
            if (ta > 0.00001) {
                return ta;
            }
            var tb = (sqt - b) / (2 * a);
            if (tb > 0.00001) {
                return tb;
            }
        }
        return Number.POSITIVE_INFINITY;
    };
    return Sphere;
}(Renderable));
//# sourceMappingURL=Sphere.js.map