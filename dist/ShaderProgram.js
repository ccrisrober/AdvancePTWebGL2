"use strict";
var mode;
(function (mode) {
    mode[mode["read_file"] = 0] = "read_file";
    mode[mode["read_script"] = 1] = "read_script";
    mode[mode["read_text"] = 2] = "read_text";
})(mode || (mode = {}));
;
var ShaderProgram = (function () {
    function ShaderProgram() {
        this.uniformLocations = {};
        this.attribLocations = {};
        this.shaders = [];
    }
    ShaderProgram.prototype.addAttributes = function (attrs) {
        for (var attr in attrs) {
            attr = attrs[attr];
            this.attribLocations[attr] = gl.getAttribLocation(this.mCompiledShader, attr);
        }
    };
    ShaderProgram.prototype.addUniforms = function (unifs) {
        for (var unif in unifs) {
            unif = unifs[unif];
            this.uniformLocations[unif] = gl.getUniformLocation(this.mCompiledShader, unif);
        }
    };
    ShaderProgram.prototype.program = function () {
        return this.mCompiledShader;
    };
    ShaderProgram.prototype.addShader = function (shader_, type, _mode) {
        var shader;
        if (_mode == mode.read_file) {
            shader = this.loadAndCompileWithFile(shader_, type);
        }
        else if (_mode == mode.read_script) {
            shader = this.loadAndCompile(shader_, type);
        }
        else if (_mode == mode.read_text) {
            shader = this.loadAndCompileFromText(shader_, type);
        }
        this.shaders.push(shader);
    };
    ShaderProgram.prototype.compile_and_link = function () {
        this.mCompiledShader = gl.createProgram();
        for (var i = 0; i < this.shaders.length; i++) {
            gl.attachShader(this.mCompiledShader, this.shaders[i]);
        }
        gl.linkProgram(this.mCompiledShader);
        if (!gl.getProgramParameter(this.mCompiledShader, gl.LINK_STATUS)) {
            alert("ERROR");
            console.warn("Error in program linking:" + gl.getProgramInfoLog(this.mCompiledShader));
            console.log(this.fragmentSource);
            throw "SHADER ERROR";
        }
        return true;
    };
    ShaderProgram.prototype.loadAndCompileWithFile = function (filePath, shaderType) {
        var request = new XMLHttpRequest();
        request.open("GET", filePath, false);
        try {
            request.send();
        }
        catch (err) {
            alert("ERROR: " + filePath);
            console.log("ERROR: " + filePath);
            return null;
        }
        var shaderSource = request.responseText;
        if (shaderSource === null) {
            alert("WARNING: " + filePath + " failed");
            console.log(this.fragmentSource);
            throw "SHADER ERROR";
        }
        "SHADER ERROR";
        return this.compileShader(shaderSource, shaderType);
    };
    ShaderProgram.prototype.loadAndCompileFromText = function (shaderSource, shaderType) {
        if (shaderSource === null) {
            alert("WARNING: " + shaderSource + " failed");
            console.log(this.fragmentSource);
            throw "SHADER ERROR";
        }
        return this.compileShader(shaderSource, shaderType);
    };
    ShaderProgram.prototype.loadAndCompile = function (id, shaderType) {
        var shaderText, shaderSource;
        shaderText = document.getElementById(id);
        shaderSource = shaderText.firstChild.textContent;
        if (shaderSource === null) {
            alert("WARNING: " + id + " failed");
            console.log(this.fragmentSource);
            throw "SHADER ERROR";
        }
        return this.compileShader(shaderSource, shaderType);
    };
    ShaderProgram.prototype.compileShader = function (shaderSource, shaderType) {
        var compiledShader;
        if (shaderType == gl.VERTEX_SHADER) {
            this.vertexSource = shaderSource;
        }
        else if (shaderType == gl.FRAGMENT_SHADER) {
            this.fragmentSource = shaderSource;
        }
        compiledShader = gl.createShader(shaderType);
        gl.shaderSource(compiledShader, shaderSource);
        gl.compileShader(compiledShader);
        if (!gl.getShaderParameter(compiledShader, gl.COMPILE_STATUS)) {
            alert("ERROR: " + gl.getShaderInfoLog(compiledShader));
            console.log("ERROR: " + gl.getShaderInfoLog(compiledShader));
            console.log(this.fragmentSource);
            throw "SHADER ERROR";
        }
        return compiledShader;
    };
    ShaderProgram.prototype.use = function () {
        gl.useProgram(this.mCompiledShader);
    };
    ShaderProgram.prototype.dispose = function () {
    };
    return ShaderProgram;
}());
//# sourceMappingURL=ShaderProgram.js.map