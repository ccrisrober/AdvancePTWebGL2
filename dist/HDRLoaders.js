var HDRLoader;
(function (HDRLoader) {
    function createHDRTexture(gl, rawData, width, height, format) {
        var floatTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, floatTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, width, height, 0, format, gl.FLOAT, rawData);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return floatTex;
    }
    HDRLoader.createHDRTexture = createHDRTexture;
    function asyncLoadHDRTexture(gl, url, width, height, format, callback) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'arraybuffer';
        req.onload = function (evt) {
            var arrayBuffer = req.response;
            if (arrayBuffer) {
                var bytes = new Uint8Array(arrayBuffer);
                var data = new Float32Array(width * height * 3);
                var byteIdx = 0;
                for (; byteIdx < bytes.length; byteIdx++) {
                    if (bytes[byteIdx] === 0x0A && bytes[byteIdx + 1] === 0x0A) {
                        byteIdx = byteIdx + 2;
                        break;
                    }
                }
                for (; byteIdx < bytes.length; byteIdx++) {
                    if (bytes[byteIdx] === 0x0A) {
                        byteIdx = byteIdx + 1;
                        break;
                    }
                }
                var idx = 0;
                for (var row = 0; row < height; row++) {
                    for (var col = 0; col < width; col++) {
                        var r = bytes[byteIdx++];
                        var g = bytes[byteIdx++];
                        var b = bytes[byteIdx++];
                        var e = bytes[byteIdx++];
                        var expFactor = Math.pow(2, e - 128);
                        data[idx++] = (r / 256) * expFactor;
                        data[idx++] = (g / 256) * expFactor;
                        data[idx++] = (b / 256) * expFactor;
                    }
                }
                var floatTex = createHDRTexture(gl, data, width, height, format);
                callback(floatTex);
            }
            else {
                callback(null);
            }
        };
        req.send(null);
    }
    HDRLoader.asyncLoadHDRTexture = asyncLoadHDRTexture;
})(HDRLoader || (HDRLoader = {}));
//# sourceMappingURL=HDRLoaders.js.map