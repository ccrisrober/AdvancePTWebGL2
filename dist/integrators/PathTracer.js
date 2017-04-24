var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PathTracer = (function (_super) {
    __extends(PathTracer, _super);
    function PathTracer(uniformCallback, size) {
        _super.call(this, uniformCallback, size);
    }
    PathTracer.prototype.recreateShader = function (objects, projection, enviroments, bounces) {
        this.stepProgram = utility.createSceneProgram(objects, projection, environment, bounces);
    };
    return PathTracer;
}(RenderMode));
//# sourceMappingURL=PathTracer.js.map