var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SphericalHarmonics = (function (_super) {
    __extends(SphericalHarmonics, _super);
    function SphericalHarmonics(uniformCallback, size, sf) {
        _super.call(this, uniformCallback, size);
        this.sf = sourceFrags[sf];
        if (!this.sf) {
            throw "SourceFrag not found";
        }
    }
    SphericalHarmonics.prototype.recreateShader = function (objects, projection, enviroments, bounces) {
        this.stepProgram = utility.createSphericalHarmonicShader(objects, projection, environment, bounces, this.sf);
    };
    return SphericalHarmonics;
}(RenderMode));
//# sourceMappingURL=SphericalHarmonics.js.map