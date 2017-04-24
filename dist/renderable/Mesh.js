var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Mesh = (function (_super) {
    __extends(Mesh, _super);
    function Mesh(src, isDynamic, material) {
        _super.call(this, "mesh", isDynamic, material);
        this.vertices = [
            -26.1086,
            40.2493,
            14.4406,
            -8.9987,
            9.0651,
            21.6143,
            17.9654,
            22.1507,
            14.8697,
            -26.1086,
            40.2493,
            14.4406,
            17.9654,
            22.1507,
            14.8697,
            8.9944,
            17.7971,
            -10,
            -26.1086,
            40.2493,
            14.4406,
            8.9944,
            17.7971,
            -10,
            -5.4071,
            10.8081,
            -2.7681,
            -26.1086,
            40.2493,
            14.4406,
            -5.4071,
            10.8081,
            -2.7681,
            -8.9987,
            9.0651,
            21.6143,
            -8.9987,
            9.0651,
            21.6143,
            -0.0022,
            13.4311,
            -0,
            17.9654,
            22.1507,
            14.8697,
            8.9944,
            17.7971,
            -10,
            -5.4071,
            10.8081,
            -2.7681
        ];
        this.indices = [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            16,
            13,
            12,
            14,
            13,
            15,
            15,
            13,
            16
        ];
        this.aabb();
        this.uniforms = ["vertex_positions", "triangles_list", "VERTEX_TEX_SIZE", "TRIANGLE_TEX_SIZE"];
        this.meshVerticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVerticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        this.meshIndicesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meshIndicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        this.texVertices = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texVertices);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        var verticesLength = this.vertices.length / 3;
        console.log(verticesLength);
        var pData = new Float32Array(verticesLength * 4);
        var count = 0;
        for (var i = 0; i < this.vertices.length; i += 3) {
            pData[count++] = this.vertices[i];
            pData[count++] = this.vertices[i + 1];
            pData[count++] = this.vertices[i + 2];
            pData[count++] = 0;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, verticesLength, 1, 0, gl.RGBA, gl.FLOAT, pData);
        delete (pData);
        this.texTriangles = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texTriangles);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        console.log(this.indices.length / 4);
        var pData2 = new Uint16Array(this.indices.length);
        count = 0;
        for (var i = 0; i < this.indices.length; i += 4) {
            pData2[count++] = this.indices[i];
            pData2[count++] = this.indices[i + 1];
            pData2[count++] = this.indices[i + 2];
            pData2[count++] = this.indices[i + 3];
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl["RGBA16UI"], this.indices.length / 4, 1, 0, gl["RGBA_INTEGER"], gl.UNSIGNED_SHORT, pData2);
        delete (pData2);
        var numIndices = this.indices.length / 4;
        var sourceCode = "\n\t\t\tuniform sampler2D vertex_positions;\n\t\t\tuniform isampler2D triangles_list;\n\t\t\t#define VERTEX_TEX_SIZE 17    //vertices\n\t\t\t#define TRIANGLE_TEX_SIZE 6  //indices\n\n\t\t\tconst ivec3 indices[" + this.indices.length / 3 + "] = ivec3[](";
        var indices_array = "";
        for (var i = 0; i < this.indices.length; i += 3) {
            indices_array += "ivec3(" + this.indices[i] + ", " + this.indices[i + 1] + ", " + this.indices[i + 2] + "),";
        }
        indices_array = indices_array.substring(0, indices_array.length - 1);
        sourceCode += " " + indices_array + ");\n\t\t\tvec2 intersectMesh1(vec3 origin, vec3 dir) {\n\n\t\t\t    float t = INFINITY;\n\t\t\t    int tri = -3;\n\t\t\t    ivec3 list_pos;\n\t\t\t    vec3 v0, v1, v2;\n\t\t\t    float hit;\n\t\t\t    int index = 0;\n\n\t\t\t    vec2 aabb_hit = rayIntersectBox(" + globals.toVec3(this.cubeMin) + ", \n\t\t\t    \t\t" + globals.toVec3(this.cubeMax) + ", origin, dir);\n\t\t\t    if ((aabb_hit.x > " + globals.smallEpsilon + " && aabb_hit.x < aabb_hit.y) && aabb_hit.x < t) {\n\t\t\t    \t";
        for (var i = 0; i < numIndices; i++) {
            sourceCode += "list_pos = indices[index++]; //texture(triangles_list, vec2((float(index++) + 0.5) / float(" + numIndices + "), 0.5)).xyz;\n\t\t\t        if ((index + 1) % 2 != 0) {\n\t\t\t            list_pos.xyz = list_pos.zxy;\n\t\t\t        }\n\t\t\t        v0 = (texture(vertex_positions, vec2((float(list_pos.z) + 0.5) / float(" + verticesLength + "), 0.5)).xyz);\n\t\t\t        v1 = (texture(vertex_positions, vec2((float(list_pos.y) + 0.5) / float(" + verticesLength + "), 0.5)).xyz);\n\t\t\t        v2 = (texture(vertex_positions, vec2((float(list_pos.x) + 0.5) / float(" + verticesLength + "), 0.5)).xyz);\n\n\t\t\t        hit = intersectTriangle(origin, dir, v0, v1, v2);\n\t\t\t        if (hit < t) {\n\t\t\t            t = hit;\n\t\t\t            tri = index;\n\t\t\t        }";
        }
        sourceCode += "\n\t\t\t\t}\n\t\t\t\treturn vec2(t, float(tri / 3));\n        \t}";
        sourceFrags["intersectObjMesh"] = new SourceFrag(sourceCode, [sourceFrags.rayIntersectBox, sourceFrags.rayIntersectTriangle]);
        this.requiredSourceFrag = [sourceFrags["intersectObjMesh"], sourceFrags.normalOnMesh];
    }
    Mesh.prototype.aabb = function () {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var minZ = Number.MAX_VALUE;
        var maxX = Number.MIN_VALUE;
        var maxY = Number.MIN_VALUE;
        var maxZ = Number.MIN_VALUE;
        for (var i = 0; i < this.vertices.length; i += 3) {
            var v = vec3.fromValues(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
            minX = minX < v[0] ? minX : v[0];
            minY = minY < v[1] ? minY : v[1];
            minZ = minZ < v[2] ? minZ : v[2];
            maxX = maxX > v[0] ? maxX : v[0];
            maxY = maxY > v[1] ? maxY : v[1];
            maxZ = maxZ > v[2] ? maxZ : v[2];
        }
        this.cubeMin = vec3.fromValues(minX, minY, minZ);
        this.cubeMax = vec3.fromValues(maxX, maxY, maxZ);
    };
    Mesh.prototype.getUniformsDeclaration = function () {
        return "";
    };
    Mesh.prototype.update = function (program) {
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this.texVertices);
        gl.uniform1i(program.uniformLocations.vertex_positions, 5);
        gl["uniform1ui"](program.uniformLocations.VERTEX_TEX_SIZE, this.vertices.length);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, this.texTriangles);
        gl.uniform1i(program.uniformLocations.triangles_list, 6);
        gl["uniform1ui"](program.uniformLocations.TRIANGLE_TEX_SIZE, this.indices.length);
    };
    Mesh.prototype.getInsideExpression = function (hitName) {
        return false;
    };
    Mesh.prototype.getIntersectionExprType = function () {
        return "vec2";
    };
    Mesh.prototype.getValidIntersectionCheck = function (hitName) {
        return '(' + hitName + '.x > ' + globals.smallEpsilon + ')';
    };
    Mesh.prototype.getT = function (hitName) {
        return hitName + '.x';
    };
    Mesh.prototype.getIntersectionExpr = function (rayPosName, rayDirName) {
        return "intersectMesh1(" + rayPosName + ", " + rayDirName + ");";
    };
    Mesh.prototype.getNormal = function (hitName, hitPositionName, rayPosName, rayDirName) {
        return "normalOnMesh( " + hitPositionName + ".y);";
    };
    Mesh.prototype.hitRay = function (ray) {
    };
    return Mesh;
}(Renderable));
//# sourceMappingURL=Mesh.js.map