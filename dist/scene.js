var scene;
(function (scene) {
    var PerspectiveRays = (function () {
        function PerspectiveRays(focalLength, dofSpread) {
            this.requiredSourceFrag = [sourceFrags.uniformInsideDisk];
            this.uniforms = ['focalLength', 'depthField'];
            this.focalLength = focalLength;
            this.dofSpread = dofSpread;
        }
        PerspectiveRays.prototype.getUniforms = function () {
            return "uniform float focalLength;\n      uniform float depthField;\n      ";
        };
        PerspectiveRays.prototype.computeRayDir = function () {
            return "\n        vec2 dofOffset = depthField * uniformInsideDisk( pseudorandom(seed * 92.72 + 2.9), pseudorandom(seed * 192.72 + 12.9) );\n        vec3 rayDir = rotationMatrix * normalize( vec3( jittered - dofOffset / focalLength, 1.0 ) );\n        rayPos += rotationMatrix * vec3( dofOffset, 0.0 );\n      ";
        };
        PerspectiveRays.prototype.update = function (program) {
            gl.uniform1f(program.uniformLocations["focalLength"], this.focalLength);
            gl.uniform1f(program.uniformLocations["depthField"], this.dofSpread);
        };
        PerspectiveRays.prototype.getRayDir = function (rotationMatrix, p) {
            var aux = vec3.fromValues(p[0], p[1], 1.0);
            var timesVector3 = function (v, p) {
                return new Float32Array([
                    v[0] * p[0], v[1] * p[1], v[2],
                    v[3] * p[0], v[4] * p[1], v[5],
                    v[6] * p[0], v[7] * p[1], v[8]
                ]);
            };
            return timesVector3(rotationMatrix, p);
        };
        return PerspectiveRays;
    }());
    scene.PerspectiveRays = PerspectiveRays;
    var Ray = (function () {
        function Ray(pos, dir) {
            this.A = pos;
            this.B = dir;
        }
        Ray.prototype.origin = function () {
            return this.A;
        };
        Ray.prototype.direction = function () {
            return this.B;
        };
        Ray.prototype.point_at_parameter = function (t) {
            return this.A + t * this.B;
        };
        return Ray;
    }());
    scene.Ray = Ray;
})(scene || (scene = {}));
//# sourceMappingURL=scene.js.map