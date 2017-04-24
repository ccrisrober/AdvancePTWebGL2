var Renderable = (function () {
    function Renderable(type, isDynamic, material) {
        this.requiredSourceFrag = [];
        this.id = Renderable.renderableGlobalID++;
        this.prefix = type + this.id;
        this.isDynamic = isDynamic;
        this.material = material;
    }
    Renderable.resetStaticID = function () {
        this.renderableGlobalID = 1;
    };
    Renderable.renderableGlobalID = 1;
    return Renderable;
}());
//# sourceMappingURL=Renderable.js.map