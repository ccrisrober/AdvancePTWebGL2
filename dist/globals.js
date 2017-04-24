function getContext() {
    var contexts = "webgl2,experimental-webgl2,webgl,experimental-webgl".split(",");
    var currentCtx;
    var ctx;
    for (var i = 0; i < contexts.length; i++) {
        ctx = contexts[i];
        gl = canvas.getContext(ctx);
        if (gl) {
            currentCtx = ctx;
            break;
        }
    }
    return currentCtx;
}
function getVendors() {
    var vendors = "ms,moz,webkit,o".split(",");
    if (!window.requestAnimationFrame) {
        var vendor;
        for (var i = 0; i < vendors.length; i++) {
            vendor = vendors[i];
            window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
            if (window.requestAnimationFrame) {
                break;
            }
        }
    }
}
var textures;
(function (textures) {
    var _textureID = 0;
    function nextTextureID() {
        return _textureID++;
    }
    textures.nextTextureID = nextTextureID;
    function reset() {
        _textureID = 0;
    }
    textures.reset = reset;
})(textures || (textures = {}));
var canvas = document.getElementById('canvas');
var size = [canvas.width, canvas.height];
var fog = false;
var gl;
var failureMessage = '';
document.getElementById("webgl-impl").innerHTML = getContext();
console.log(gl);
if (!gl) {
    failureMessage = 'Could not load WebGL Context';
    alert("WEBGL not supported");
    throw "ERROR";
}
if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system.";
    throw "EXT_color_buffer_float undefined";
}
getVendors();
if (!window.requestAnimationFrame) {
    alert("Please, update your navegator ...");
}
var globals;
(function (globals) {
    globals.defaultIOR = 1.000277;
    globals.epsilon = 0.0001;
    globals.smallEpsilon = 0.0000001;
    globals.montecarloActive = true;
    globals.vertexCode = "#version 300 es\nin vec3 vertex;\nout vec2 texCoord;\nvoid main() {\n  texCoord = vertex.xy * 0.5 + 0.5;\n  gl_Position = vec4( vertex, 1 );\n}";
    function toFloat(n) {
        var s = n.toString();
        return (s.indexOf('.') < 0 && s.indexOf('e') < 0 && s.indexOf('E') < 0) ? (s + '.0') : s;
    }
    globals.toFloat = toFloat;
    ;
    function toVec2(vector2) {
        return 'vec2(' + vector2[0] + ',' + vector2[1] + ')';
    }
    globals.toVec2 = toVec2;
    ;
    function toVec3(vector3) {
        return 'vec3(' + vector3[0] + ',' + vector3[1] + ',' + vector3[2] + ')';
    }
    globals.toVec3 = toVec3;
    ;
})(globals || (globals = {}));
;
//# sourceMappingURL=globals.js.map