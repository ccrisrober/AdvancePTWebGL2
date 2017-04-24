var utility;
(function (utility) {
    function loadMesh(src) {
        var mesh;
        var xmlReq = new XMLHttpRequest();
        xmlReq.open("GET", src, false);
        try {
            xmlReq.send();
        }
        catch (err) {
            alert("FAILED TO LOAD MESH " + src);
            return null;
        }
        mesh = JSON.parse(xmlReq.responseText);
        delete (xmlReq);
        return mesh;
    }
    utility.loadMesh = loadMesh;
    function loadTexture(src) {
        var texture = gl.createTexture();
        var image = new Image();
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        image.onerror = function (e) {
            console.log(e);
        };
        image.src = src;
        return texture;
    }
    utility.loadTexture = loadTexture;
    function createSphericalHarmonicShader(objects, projection, environment, bounces, sf) {
        var materials = [];
        var matProps = [];
        var matPropsPassed = {};
        function recordMaterial(mat) {
            if (!matPropsPassed[mat.processId]) {
                matPropsPassed[mat.processId] = true;
                matProps.push(mat);
            }
            mat.requiredMaterials.forEach(function (m) {
                recordMaterial(m);
            });
            materials.push(mat);
        }
        objects.forEach(function (obj) {
            recordMaterial(obj.material);
        });
        var src = '' +
            "uniform mat3 rotationMatrix;\n\t\t\tuniform vec3 cameraPosition;\n\t\t\tuniform vec2 times;\n\t\t\t";
        if (environment)
            src += environment.getUniformsDeclaration();
        objects.forEach(function (obj) {
            src += obj.getUniformsDeclaration();
        });
        materials.forEach(function (mat) {
            src += mat.getUniformsDeclaration();
        });
        src += projection.getUniforms();
        src +=
            sourceFrags.pseudorandom.toString() + '\n' +
                'vec4 calculateColor( vec2 p ) {\n' +
                '  vec3 rayPos = cameraPosition;\n' +
                '  rayPos = rayPos + rotationMatrix * vec3( 0, 0, 1.0 ) * (- 4.0 + 8.0 * ( 2.0 * floor( p.y ) ) );\n';
        if (fog) {
            src += '  vec2 jittered = ( p + ( 1.0 + pow( pseudorandom(seed * 134.16 + 12.6), 6.0 ) * 20.0 ) * ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
        }
        else {
            src += '  vec2 jittered = ( p + ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
        }
        src += projection.computeRayDir() +
            '  vec3 attenuation = vec3( 1.0);\n' +
            '  vec3 accumulation = vec3( 0.0 );\n' +
            '  float ior = ' + globals.toFloat(globals.defaultIOR) + ';\n' +
            '  float iorNext;\n' +
            '  vec3 normal;\n' +
            '  vec3 hitPos;\n' +
            '  bool inside = false;\n' +
            '  int bounceType;\n';
        matProps.forEach(function (prop) {
            src += prop.getMaterialShader();
        });
        src +=
            "  for( int bounce = 0; bounce < " + bounces + "; bounce++ ) {\n\t\t\t\t\tint hitObject = 0;\n\t\t\t\t\tfloat t = INFINITY;\n\t\t\t\t\tinside = false;\n\t\t\t";
        objects.forEach(function (obj) {
            src += obj.getIntersectionExprType() + ' ' + obj.prefix + 'hit = ' + obj.getIntersectionExpr('rayPos', 'rayDir') + ';\n';
        });
        objects.forEach(function (obj) {
            src +=
                '    if ( ' + obj.getValidIntersectionCheck(obj.prefix + 'hit') + ' && ' + obj.getT(obj.prefix + 'hit') + ' < t ) {\n' +
                    '      t = ' + obj.getT(obj.prefix + 'hit') + ';\n' +
                    '      hitObject = ' + obj.id + ';\n' +
                    '    }\n';
        });
        src +=
            "   hitPos = rayT( rayPos, rayDir, t );\n\t\t\t\t\tif ( t == INFINITY ) {\n\t\t\t\t\t\tbounceType = 0;\n\t\t\t";
        objects.forEach(function (obj) {
            src += "    } else if ( hitObject == " + obj.id + " ) {";
            if (obj.getInsideExpression) {
                var insideExpression = obj.getInsideExpression(obj.prefix + 'hit');
                if (insideExpression !== 'false') {
                    src += '      inside = ' + obj.getInsideExpression(obj.prefix + 'hit') + ';\n';
                }
            }
            src += '      normal = ' + obj.getNormal(obj.prefix + 'hit', 'hitPos', 'rayPos', 'rayDir') + ';\n' + obj.material.getHitStatements('hitPos', 'normal', 'rayPos', 'rayDir');
        });
        src +=
            '    }\n' +
                '    if ( bounceType == 0 ) {\n' +
                environment.getEnvironmentExpression() +
                '      break;\n';
        matProps.forEach(function (prop) {
            if (prop.processId !== undefined) {
                console.log(prop);
                src += '    } else if ( bounceType == ' + prop.processId + ' ) {\n' + prop.getProcessStatements();
            }
        });
        src +=
            "    }\n\t\t\t\t}\n\t\t\t\tvec3 col = calcIrradiance(normal);\n\t\t\t\taccumulation = mix(col*accumulation/" + globals.toFloat(bounces) + ", col, 0.0);\n\t\t\t\treturn vec4(accumulation, 1.0);\n\t\t\t}\n\t\t\t";
        var dependencies = [sourceFrags.rayT, sf, sourceFrags.calcIrradiance];
        dependencies = dependencies.concat(environment.requiredSourceFrag);
        dependencies = dependencies.concat(projection.requiredSourceFrag);
        objects.forEach(function (obj) {
            dependencies = dependencies.concat(obj.requiredSourceFrag);
        });
        matProps.forEach(function (prop) {
            dependencies = dependencies.concat(prop.requiredSourceFrag);
        });
        var uniforms = ['rotationMatrix', 'cameraPosition', 'times'];
        uniforms = uniforms.concat(environment.uniforms);
        uniforms = uniforms.concat(projection.uniforms);
        objects.forEach(function (obj) {
            uniforms = uniforms.concat(obj.uniforms);
        });
        materials.forEach(function (mat) {
            uniforms = uniforms.concat(mat.uniforms);
        });
        return createIntegratorProgram(new SourceFrag(src, dependencies).toString(), 8, uniforms);
    }
    utility.createSphericalHarmonicShader = createSphericalHarmonicShader;
    ;
    function createSceneProgram(objects, projection, environment, bounces) {
        var materials = [];
        var matProps = [];
        var matPropsPassed = {};
        function recordMaterial(mat) {
            if (!matPropsPassed[mat.processId]) {
                matPropsPassed[mat.processId] = true;
                matProps.push(mat);
            }
            mat.requiredMaterials.forEach(function (m) {
                recordMaterial(m);
            });
            materials.push(mat);
        }
        objects.forEach(function (obj) {
            recordMaterial(obj.material);
        });
        var src = '' +
            "uniform mat3 rotationMatrix;\n\t\t\tuniform vec3 cameraPosition;\n\t\t\tuniform vec2 times;\n\t\t\t";
        if (environment) {
            src += environment.getUniformsDeclaration();
        }
        objects.forEach(function (obj) {
            src += obj.getUniformsDeclaration();
        });
        materials.forEach(function (mat) {
            src += mat.getUniformsDeclaration();
        });
        src += "\n\t\t\t" + projection.getUniforms() + "\n\t\t\t" + sourceFrags.pseudorandom.toString() + "\n\t\t";
        src += "float shadow( vec3 rayPos, vec3 rayDir ) {\n";
        objects.forEach(function (obj) {
            src += obj.getIntersectionExprType() + ' ' + obj.prefix + 'hit = ' + obj.getIntersectionExpr('rayPos', 'rayDir') + ';\n';
        });
        objects.forEach(function (obj) {
            if (!(obj instanceof Plane)) {
                src += "    \n\t\t\t\t\t\t\tif ( " + obj.getT(obj.prefix + 'hit') + " < 1.0 ) {\n\t\t\t\t\t\t\t\treturn 0.0;\n\t\t\t\t\t\t\t}";
            }
        });
        src += "return 1.0;\n}";
        src += "\n\t\t\tvec4 calculateColor( vec2 p ) {\n\t\t\t\tvec3 rayPos = cameraPosition;\n\t\t\t\trayPos = rayPos + rotationMatrix * vec3( 0, 0, 1.0 ) * (- 4.0 + 8.0 * ( 2.0 * floor( p.y ) ) );\n\t\t\t";
        if (fog) {
            src += '  vec2 jittered = ( p + ( 1.0 + pow( pseudorandom(seed * 134.16 + 12.6), 6.0 ) * 20.0 ) * ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
        }
        else {
            src += '  vec2 jittered = ( p + ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
        }
        src += "\n\t\t\t\t" + projection.computeRayDir() + "\n\t\t\t\tvec3 attenuation = vec3( 1.0 );\n\t\t\t\tvec3 accumulation = vec3( 0.0 );\n\t\t\t\tfloat ior = " + globals.toFloat(globals.defaultIOR) + ";\n\t\t\t\tfloat iorNext;\n\t\t\t\tvec3 normal;\n\t\t\t\tvec3 hitPos;\n\t\t\t\tbool inside = false;\n\t\t\t\tint bounceType;";
        matProps.forEach(function (prop) {
            src += prop.getMaterialShader();
        });
        src +=
            "  \n\t\t\t\tint hitObject = 0;\n\t\t\t\tfloat t = INFINITY;\n\t\t\t\tfor( int bounce = 0; bounce < " + bounces + "; bounce++ ) {\n\t\t\t\t\thitObject = 0;\n\t\t\t\t\tt = INFINITY;\n\t\t\t\t\tinside = false;\n\t\t\t";
        objects.forEach(function (obj) {
            src += obj.getIntersectionExprType() + " " + obj.prefix + "hit = " + obj.getIntersectionExpr('rayPos', 'rayDir') + ";";
        });
        objects.forEach(function (obj) {
            src += "\n\t\t\t\t\t\tif ( " + obj.getValidIntersectionCheck(obj.prefix + 'hit') + " && " + obj.getT(obj.prefix + 'hit') + " < t ) {\n\t\t\t\t\t\t\tt = " + obj.getT(obj.prefix + 'hit') + ";\n\t\t\t\t\t\t\thitObject = " + obj.id + ";\n\t\t\t\t\t\t}";
        });
        src +=
            "   hitPos = rayT( rayPos, rayDir, t );\n\t\t\t\t\tif ( t == INFINITY ) {\n\t\t\t\t\t\tbounceType = 0;\n\t\t\t";
        objects.forEach(function (obj) {
            src += "    } else if ( hitObject == " + obj.id + " ) {";
            if (obj.getInsideExpression) {
                var insideExpr = obj.getInsideExpression(obj.prefix + 'hit');
                if (insideExpr !== 'false') {
                    src += "      inside = " + obj.getInsideExpression(obj.prefix + 'hit') + ";";
                }
            }
            src += "      normal = " + obj.getNormal(obj.prefix + 'hit', 'hitPos', 'rayPos', 'rayDir') + ";\n\t\t\t\t\t\t\t\t\t\t" + obj.material.getHitStatements('hitPos', 'normal', 'rayPos', 'rayDir');
        });
        src += "\n\t\t\t\t\t}\n\t\t\t\t\t// hit nothing, environment light\n\t\t\t\t\tif ( bounceType == 0 ) {\n\t\t\t" + environment.getEnvironmentExpression() + "\n\t\t\t\t\t\tbreak;";
        matProps.forEach(function (prop) {
            if (prop.processId) {
                src += "    } else if ( bounceType == " + prop.processId + " ) {\n\t\t\t\t\t" + prop.getProcessStatements();
            }
        });
        src += "     \n\t\t\t\t\t}\n\t\t\t\t\tvec3 toLight = sphere1center - hitPos;     \n\t\t\t\t\tfloat diffuse = max(0.0, dot(normalize(toLight), normal));    \n\t\t\t\t\tfloat shadowIntensity = shadow(hitPos + normal * 0.0001, toLight);\n\t\t\t\t\taccumulation += attenuation * (diffuse * shadowIntensity);\n\t\t\t\t}\n\t\t\t\treturn vec4( accumulation / " + globals.toFloat(bounces) + ", 1 );\n\t\t\t}\n\t\t\t";
        var dependencies = [sourceFrags.rayT];
        dependencies = dependencies.concat(environment.requiredSourceFrag);
        dependencies = dependencies.concat(projection.requiredSourceFrag);
        objects.forEach(function (obj) {
            dependencies = dependencies.concat(obj.requiredSourceFrag);
        });
        matProps.forEach(function (prop) {
            dependencies = dependencies.concat(prop.requiredSourceFrag);
        });
        var uniforms = ['rotationMatrix', 'cameraPosition', 'times'];
        uniforms = uniforms.concat(environment.uniforms);
        uniforms = uniforms.concat(projection.uniforms);
        objects.forEach(function (obj) {
            uniforms = uniforms.concat(obj.uniforms);
        });
        materials.forEach(function (mat) {
            uniforms = uniforms.concat(mat.uniforms);
        });
        return createIntegratorProgram(new SourceFrag(src, dependencies).toString(), 8, uniforms);
    }
    utility.createSceneProgram = createSceneProgram;
    ;
    var createIntegratorProgram = function (src, numSamples, uniforms) {
        var integratorUniforms = ['time', 'weight', 'previousTexture', 'size'];
        if (uniforms) {
            integratorUniforms = integratorUniforms.concat(uniforms);
        }
        console.log(integratorUniforms);
        var shader = new ShaderProgram();
        shader.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
        shader.addShader("#version 300 es\n\t\tprecision highp float;\n\n\t\tprecision highp int;\n\t\tprecision highp isampler2D;\n\n\t\tin vec2 texCoord;\n\t\tuniform float time;\n\t\tuniform float weight;\n\t\tuniform vec2 size;\n\t\tuniform sampler2D previousTexture;\n\n\t\tout vec4 fragColor;\n\t\t#define INFINITY 10000.0\n\n\t\tfloat seed;\n\n\t\t" + src + "\n\t\t\n\t\tvoid main( void ) {\n\t\t\tvec4 previous = vec4( texture( previousTexture, gl_FragCoord.xy / size ).rgb, 1 );\n\t\t\tvec4 sample_ = vec4(0);\n\t\t\tfor( int i = 0; i < " + numSamples + "; i++) {\n\t\t\t\tseed = time + float(i);\n\t\t\t\tsample_ = sample_ + calculateColor( texCoord );\n\t\t\t}\n\t\t\tfragColor = mix( sample_ / " + globals.toFloat(numSamples) + ", previous, weight );\n\t\t}", gl.FRAGMENT_SHADER, mode.read_text);
        shader.compile_and_link();
        shader.addAttributes(['vertex']);
        shader.addUniforms(integratorUniforms);
        return shader;
    };
})(utility || (utility = {}));
//# sourceMappingURL=utility.js.map