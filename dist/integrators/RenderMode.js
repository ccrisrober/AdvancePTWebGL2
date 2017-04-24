var RenderMode = (function () {
    function RenderMode(uniformCallback, size) {
        this.MAX_SAMPLES = 32;
        this.uniformCallback = uniformCallback;
        this.size = size;
        this.renderProgram = toneMap.textureQuadGammaProgram;
        this.startTime = Date.now();
        this.initialize();
    }
    RenderMode.prototype.resetShader = function (objects, projection, environment, bounces) {
        if (bounces === void 0) { bounces = 1; }
        if (this.stepProgram) {
            this.stepProgram.dispose();
        }
        this.recreateShader(objects, projection, environment, bounces);
    };
    RenderMode.prototype.makeTexture = function () {
        var type = gl.FLOAT;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA32F"], this.size[0], this.size[1], 0, gl.RGBA, type, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    };
    RenderMode.prototype.initialize = function () {
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            -1, +1,
            +1, -1,
            +1, +1
        ]), gl.STATIC_DRAW);
        this.frameBuffer = gl.createFramebuffer();
        this.textures = new Array(2);
        this.textures[0] = this.makeTexture();
        this.textures[1] = this.makeTexture();
        this.samples = 0;
        this.brightness = 1;
    };
    RenderMode.prototype.dispose = function () {
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteFramebuffer(this.frameBuffer);
        gl.deleteTexture(this.textures[0]);
        gl.deleteTexture(this.textures[1]);
    };
    RenderMode.prototype.reset = function () {
        this.samples = 0;
    };
    RenderMode.prototype.step = function () {
        if (!this.stepProgram || ((this.samples > this.MAX_SAMPLES) && (this.MAX_SAMPLES > 0))) {
            return;
        }
        this.stepProgram.use();
        this.uniformCallback(this.stepProgram);
        var state0 = 1;
        var state1 = 2;
        var mwc1616 = function () {
            this.state0 = 18030 * (this.state0 & 0xffff) + (this.state0 << 16);
            this.state1 = 30903 * (this.state1 & 0xffff) + (this.state1 << 16);
            return this.state0 << 16 + (this.state1 & 0xffff);
        };
        gl.uniform1f(this.stepProgram.uniformLocations["time"], (Date.now() - this.startTime + mwc1616()));
        gl.uniform1f(this.stepProgram.uniformLocations["weight"], this.samples / (this.samples + 1));
        gl.uniform2fv(this.stepProgram.uniformLocations["size"], this.size);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
        gl.uniform1i(this.stepProgram.uniformLocations["previousTexture"], 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[0], 0);
        gl.enableVertexAttribArray(this.stepProgram.attribLocations["vertex"]);
        gl.vertexAttribPointer(this.stepProgram.attribLocations["vertex"], 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.samples++;
    };
    RenderMode.prototype.resetRenderProgram = function (prog) {
        this.renderProgram = prog;
    };
    RenderMode.prototype.render = function () {
        this.renderProgram.use();
        gl.uniform1f(this.renderProgram.uniformLocations["brightness"], this.brightness);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.renderProgram.attribLocations["vertex"]);
        gl.vertexAttribPointer(this.renderProgram.attribLocations["vertex"], 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.textures.reverse();
    };
    return RenderMode;
}());
//# sourceMappingURL=RenderMode.js.map