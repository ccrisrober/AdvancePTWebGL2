var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var mat;
(function (mat) {
    var Material = (function () {
        function Material() {
            this.id = Material.materialGlobalId++;
            this.uniforms = [];
            this.requiredMaterials = [];
            this.requiredSourceFrag = [];
        }
        Material.prototype.update = function (program) { };
        Material.prototype.getUniformsDeclaration = function () {
            return '';
        };
        Material.prototype.getMaterialShader = function () {
            return '';
        };
        Material.prototype.getProcessStatements = function () {
            return '';
        };
        Material.materialGlobalId = 1;
        Material.processGlobalId = 1;
        return Material;
    }());
    mat.Material = Material;
    ;
    var Absorb = (function (_super) {
        __extends(Absorb, _super);
        function Absorb() {
            _super.call(this);
            this.processId = Material.processGlobalId++;
        }
        Absorb.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "bounceType = " + this.processId + ";";
        };
        Absorb.prototype.getProcessStatements = function () {
            return "break;";
        };
        return Absorb;
    }(Material));
    mat.Absorb = Absorb;
    ;
    var Reflect = (function (_super) {
        __extends(Reflect, _super);
        function Reflect() {
            _super.call(this);
            this.processId = Material.processGlobalId++;
        }
        Reflect.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "bounceType = " + this.processId + ";";
        };
        Reflect.prototype.getProcessStatements = function () {
            return "\n        rayDir = reflect( rayDir, normal );\n        rayPos = hitPos + " + globals.epsilon + " * rayDir;";
        };
        return Reflect;
    }(Material));
    mat.Reflect = Reflect;
    ;
    var Transmit = (function (_super) {
        __extends(Transmit, _super);
        function Transmit(na, nb) {
            _super.call(this);
            this.processId = Material.processGlobalId++;
            this.na = na;
            this.nb = nb;
        }
        Transmit.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "\n        transmitIOR" + this.id + " = vec2( " + this.na + ", " + this.nb + " );\n        if ( inside ) {\n          transmitIOR" + this.id + " = transmitIOR" + this.id + ".yx;\n        }\n        bounceType = " + this.processId + ";";
        };
        Transmit.prototype.getMaterialShader = function () {
            return "vec2 transmitIOR" + this.id + ";";
        };
        Transmit.prototype.getProcessStatements = function () {
            return "      \n        rayDir = refract( rayDir, normal, transmitIOR" + this.id + ".x / transmitIOR" + this.id + ".y );\n        // Total internal reflection case not handled.\n        if ( dot( rayDir, rayDir ) == 0.0 ) { break; }\n        rayPos = hitPos + " + globals.epsilon + " * rayDir;";
        };
        return Transmit;
    }(Material));
    mat.Transmit = Transmit;
    ;
    var FormulaTextured = (function (_super) {
        __extends(FormulaTextured, _super);
        function FormulaTextured(form) {
            _super.call(this);
            this.formula = form;
            this.processId = Material.processGlobalId++;
            this.requiredSourceFrag = [
                sourceFrags.sampleDotWeightOnHemiphere,
                sourceFrags.sampleTowardsNormal,
                sourceFrags.TWO_PI];
        }
        FormulaTextured.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "bounceType = " + this.processId + ";";
        };
        FormulaTextured.prototype.getProcessStatements = function () {
            return this.formula + "\n        rayDir = sampleTowardsNormal( normal, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) ) );\n        rayPos = hitPos + 0.0001 * rayDir;\n      ";
        };
        return FormulaTextured;
    }(Material));
    mat.FormulaTextured = FormulaTextured;
    ;
    var FormulaPowTexture = (function (_super) {
        __extends(FormulaPowTexture, _super);
        function FormulaPowTexture() {
            _super.call(this, "attenuation *= pow( abs( 1.0 + sin( 10.0 * sin( hitPos.x ) ) + sin( 10.0 *sin( hitPos.z ) ) ), 7.0 ) * 0.15;");
        }
        return FormulaPowTexture;
    }(FormulaTextured));
    mat.FormulaPowTexture = FormulaPowTexture;
    ;
    var ChessTextured = (function (_super) {
        __extends(ChessTextured, _super);
        function ChessTextured(color1, color2) {
            var str = "\n      // Chess texture based on Shirley books\n      float sines = sin(10.0*hitPos.x * 0.01) * sin(10.0*hitPos.y * 0.01) * sin(10.0*hitPos.z * 0.01);\n      if(sines < 0.0) {\n        attenuation = vec3(" + color1 + ");\n      } else {\n        attenuation = vec3(" + color2 + ");\n      }";
            _super.call(this, str);
        }
        return ChessTextured;
    }(FormulaTextured));
    mat.ChessTextured = ChessTextured;
    ;
    var PerlinTexture = (function (_super) {
        __extends(PerlinTexture, _super);
        function PerlinTexture() {
            var str = "\n        float phi = atan2(vec2(hitPos.z, hitPos.x));\n        float theta = asin(hitPos.y);\n        vec2 uv;\n        uv.x = 1.0-(phi + PI) / TWO_PI;\n        uv.y = (theta + PI/2.0) / PI;\n\n        float f = perlin(hitPos.xz*0.01);\n        f = 0.5 + 0.5*f;\n\n        attenuation = vec3(f);\n      ";
            _super.call(this, str);
            this.requiredSourceFrag = this.requiredSourceFrag.concat([sourceFrags.atan2, sourceFrags.perlin, sourceFrags.PI, sourceFrags.TWO_PI]);
        }
        return PerlinTexture;
    }(FormulaTextured));
    mat.PerlinTexture = PerlinTexture;
    ;
    var WorleyTexture = (function (_super) {
        __extends(WorleyTexture, _super);
        function WorleyTexture(color1, color2, mixBG) {
            if (color1 === void 0) { color1 = vec3.fromValues(0, 0, 0); }
            if (color2 === void 0) { color2 = vec3.fromValues(1, 1, 1); }
            if (mixBG === void 0) { mixBG = 0.4; }
            if (mixBG < 0 || mixBG > 1.0)
                mixBG = 0.4;
            var str = "\n        float phi = atan2(vec2(hitPos.z, hitPos.x));\n        float theta = asin(hitPos.y);\n        vec2 uv;\n        uv.x = 1.0-(phi + PI) / TWO_PI;\n        uv.y = (theta + PI/2.0) / PI;\n\n        float f = create_cells3D(vec3(hitPos.xz*0.004, 1.0));\n        attenuation = vec3(1.0)*f*f;\n        attenuation = mix(attenuation, " + globals.toVec3(color1) + ", " + globals.toFloat(mixBG) + ");    // Background\n        attenuation = mix(attenuation, " + globals.toVec3(color2) + ", f);  \n      ";
            _super.call(this, str);
            this.requiredSourceFrag = this.requiredSourceFrag.concat([sourceFrags.atan2, sourceFrags.worley, sourceFrags.PI, sourceFrags.TWO_PI]);
        }
        return WorleyTexture;
    }(FormulaTextured));
    mat.WorleyTexture = WorleyTexture;
    ;
    var Textured = (function (_super) {
        __extends(Textured, _super);
        function Textured(diffuseTexture, specularTexture, normalTexture) {
            _super.call(this);
            this.diffuseTexture = diffuseTexture;
            this.specularTexture = specularTexture;
            this.normalTexture = normalTexture;
            this.uniforms = ['albedoTex', 'specularTex', 'normalTex'];
            this.processId = Material.processGlobalId++;
            this.requiredSourceFrag = [
                sourceFrags.fresnelDielectric,
                sourceFrags.sampleDotWeightOnHemiphere,
                sourceFrags.sampleTowardsNormal,
                sourceFrags.TWO_PI
            ];
        }
        Textured.prototype.update = function (program) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.diffuseTexture);
            gl.uniform1i(program.uniformLocations.albedoTex, 2);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.specularTexture);
            gl.uniform1i(program.uniformLocations.specularTex, 3);
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
            gl.uniform1i(program.uniformLocations.normalTex, 4);
        };
        Textured.prototype.getUniformsDeclaration = function () {
            return "uniform sampler2D albedoTex;\n        uniform sampler2D specularTex;\n        uniform sampler2D normalTex;";
        };
        Textured.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "bounceType = " + this.processId + ";";
        };
        Textured.prototype.getProcessStatements = function () {
            return "\n        bool inside = abs( hitPos.x ) <= 350.0 && abs( hitPos.z ) <= 350.0;\n        if ( inside ) {\n          vec3 normal2 = normalize( texture( normalTex, hitPos.xz * 0.003937007874015748 ).rbg * 2.0 - 1.0 );\n          vec3 diffuse = pow( abs( texture( albedoTex, hitPos.xz * 0.003937007874015748 ).rgb ), vec3( 2.2 ) );\n          if ( dot( normal2, rayDir ) > 0.0 ) { normal2 = normal; }\n          vec3 transmitDir = refract( rayDir, normal, 1.0 / 1.5 );\n          vec2 reflectance = fresnelDielectric( rayDir, normal, transmitDir, 1.0, 1.5 );\n          bool didReflect = false;\n          if ( pseudorandom(float(bounce) + seed*1.17243 - 2.3 ) < ( reflectance.x + reflectance.y ) / 2.0 ) {\n            vec3 dirtTex = pow( abs( texture( specularTex, hitPos.xz * 0.003937007874015748 ).rgb ), vec3( 2.2 ) ) * 0.4 + 0.6;\n            attenuation *= dirtTex * ( pow( abs( diffuse.y ), 1.0 / 2.2 ) );\n            vec3 reflectDir = reflect( rayDir, normal2 );\n            rayDir = sampleTowardsNormal( reflectDir, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*1642.32+2.52 - 2.3), pseudorandom(float(bounce) + 72.233 * seed + 1.32 - 2.3) ) );\n            if ( rayDir.y > 0.0 ) {\n              didReflect = true;\n              float reflectDot = dot( reflectDir, rayDir );\n              if ( reflectDot < 0.0 ) { break; }\n              // compute contribution based on normal cosine falloff (not included in sampled direction)\n              float contribution = pow( abs( reflectDot ), 50.0 ) * ( 50.0 + 2.0 ) / ( 2.0 );\n              // if the contribution is negative, we sampled behind the surface (just ignore it, that part of the integral is 0)\n              // weight this sample by its contribution\n              attenuation *= contribution;\n            }\n          }\n          if ( !didReflect ) {\n            attenuation *= diffuse;\n            rayDir = sampleTowardsNormal( normal2, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5) - 2.3, pseudorandom(float(bounce) + 7.233 * seed + 1.3 - 2.3) ) );\n            if ( rayDir.y < 0.0 ) { rayDir.y = -rayDir.y; };\n          }\n        } else {\n          attenuation *= pow( vec3( 74.0, 112.0, 25.0 ) / 255.0, vec3( 1.0 / 2.2 ) ) * 0.5;\n          rayDir = sampleTowardsNormal( normal, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5) - 2.3, pseudorandom(float(bounce) + 7.233 * seed + 1.3 - 2.3) ) );\n        }\n        rayPos = hitPos + " + globals.epsilon + " * rayDir;\n      ";
        };
        return Textured;
    }(Material));
    mat.Textured = Textured;
    ;
    var SmoothDielectric = (function (_super) {
        __extends(SmoothDielectric, _super);
        function SmoothDielectric(indexOfRefraction, color) {
            if (color === void 0) { color = vec3.fromValues(1, 1, 1); }
            _super.call(this);
            this.processId = Material.processGlobalId++;
            this.ior = indexOfRefraction;
            this.color = color;
            this.requiredSourceFrag = [sourceFrags.fresnelDielectric, sourceFrags.totalInternalReflectionCutoff, sourceFrags.sellmeier];
        }
        SmoothDielectric.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "iorNext = inside ? " + globals.toFloat(globals.defaultIOR) + " : " + this.ior + ";\n        bounceType = " + this.processId + ";";
        };
        SmoothDielectric.prototype.getProcessStatements = function () {
            return "\n        if ( abs( dot( normal, rayDir ) ) < totalInternalReflectionCutoff( ior, iorNext ) + " + globals.smallEpsilon + " ) {\n          rayDir = reflect( rayDir, normal );\n        } else {\n          vec3 transmitDir = refract( rayDir, normal, ior / iorNext );\n          vec2 reflectance = fresnelDielectric( rayDir, normal, transmitDir, ior, iorNext );\n          if ( pseudorandom(float(bounce) + seed*1.7243 - 15.34) > ( reflectance.x + reflectance.y ) / 2.0 ) {\n            rayDir = transmitDir;      \n            attenuation *= " + globals.toVec3(this.color) + ";\n            ior = iorNext;\n          } else {                     \n            rayDir = reflect( rayDir, normal );\n          }\n        }\n        rayPos = hitPos + " + globals.epsilon + " * rayDir;";
        };
        return SmoothDielectric;
    }(Material));
    mat.SmoothDielectric = SmoothDielectric;
    ;
    var PhongSpecular = (function (_super) {
        __extends(PhongSpecular, _super);
        function PhongSpecular(n, isDynamic) {
            _super.call(this);
            this.n = n;
            this.nName = "phongN" + this.id;
            this.processId = Material.processGlobalId++;
            this.uniforms = isDynamic ? [this.nName] : [];
            this.isDynamic = isDynamic;
            this.requiredSourceFrag = [sourceFrags.TWO_PI, sourceFrags.sampleTowardsNormal, sourceFrags.sampleDotWeightOnHemiphere];
        }
        PhongSpecular.prototype.update = function (program) {
            if (this.isDynamic) {
                gl.uniform1f(program.uniformLocations[this.nName], this.n);
            }
        };
        PhongSpecular.prototype.getUniformsDeclaration = function () {
            if (this.isDynamic) {
                return "uniform float " + this.nName + ";";
            }
            else {
                return "const float " + this.nName + " = " + globals.toFloat(this.n) + ";";
            }
        };
        PhongSpecular.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "\n        phongSpecularN" + this.id + " = " + this.nName + ";\n        bounceType = " + this.processId + ";";
        };
        PhongSpecular.prototype.getMaterialShader = function () {
            return "float phongSpecularN" + this.id + ";";
        };
        PhongSpecular.prototype.getProcessStatements = function () {
            var result = "\n              vec3 reflectDir = reflect( rayDir, normal );\n              rayDir = sampleTowardsNormal( reflectDir, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*1642.32+2.52), pseudorandom(float(bounce) + 72.233 * seed + 1.32) ) );\n              float dotReflectDirWithRay = dot( reflectDir, rayDir );\n              float contribution = pow( abs( dotReflectDirWithRay ), phongSpecularN" + this.id + " ) * ( phongSpecularN" + this.id + " + 2.0 ) / ( 2.0 );\n              if ( dotReflectDirWithRay < 0.0 ) { break; }\n              attenuation *= contribution;\n              rayPos = hitPos + " + globals.epsilon + " * rayDir;";
            return result;
        };
        return PhongSpecular;
    }(Material));
    mat.PhongSpecular = PhongSpecular;
    ;
    var Metal = (function (_super) {
        __extends(Metal, _super);
        function Metal(ior, glossiness, dotWeighted, color) {
            if (color === void 0) { color = vec3.fromValues(1, 1, 1); }
            _super.call(this);
            this.ior = ior;
            this.processId = Material.processGlobalId++;
            this.color = color;
            this.glossiness = (glossiness == undefined) ? 0.8 : glossiness;
            this.sampleMethod = (dotWeighted) ? "sampleDotWeightOnHemiphere" : "sampleUniformOnHemisphere";
            this.requiredSourceFrag = [sourceFrags.fresnel, sourceFrags[this.sampleMethod]];
        }
        Metal.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return " iorComplex" + this.id + " = " + globals.toVec2(this.ior) + ";\n        bounceType = " + this.processId + ";\n        glossiness" + this.id + " = " + globals.toFloat(this.glossiness) + ";";
        };
        Metal.prototype.getMaterialShader = function () {
            return "\n        vec2 iorComplex" + this.id + ";\n        float glossiness" + this.id + ";\n      ";
        };
        Metal.prototype.getProcessStatements = function () {
            return " vec2 reflectance = fresnel( rayDir, normal, ior, iorComplex" + this.id + ".x, iorComplex" + this.id + ".y );\n      attenuation *= " + globals.toVec3(this.color) + " * ( reflectance.x + reflectance.y ) / 2.0;\n      rayDir = reflect( rayDir, normal ) + glossiness" + this.id + " * " + this.sampleMethod + "( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) );\n      // sampleUniformOnHemisphere: Uniform pseudorandom samples.\n      // sampleDotWeightOnHemiphere: Dot-weighted pseudorandom samples calculated using a Monte Carlo method.\n      rayPos = hitPos + " + globals.epsilon + " * rayDir;";
        };
        ;
        return Metal;
    }(Material));
    mat.Metal = Metal;
    ;
    var SwitchedMaterial = (function (_super) {
        __extends(SwitchedMaterial, _super);
        function SwitchedMaterial(materialA, materialB, sourceFrags) {
            _super.call(this);
            this.processId = Material.processGlobalId++;
            this.materialA = materialA;
            this.materialB = materialB;
            this.requiredMaterials = [materialA, materialB];
            this.requiredSourceFrag = sourceFrags;
        }
        SwitchedMaterial.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return 'float ratio' + this.id + ';\n' + this.ratioStatements +
                'if ( pseudorandom(float(bounce) + seed*1.7243 - float(' + this.id + ') ) < ratio' + this.id + ' ) {\n' +
                this.materialA.getHitStatements(hisPosName, normalName, rayPosName, rayDirName) +
                '} else {\n' +
                this.materialB.getHitStatements(hisPosName, normalName, rayPosName, rayDirName) +
                '}\n';
        };
        return SwitchedMaterial;
    }(Material));
    mat.SwitchedMaterial = SwitchedMaterial;
    ;
    var FresnelComposite = (function (_super) {
        __extends(FresnelComposite, _super);
        function FresnelComposite(reflectMat, transmitMat, na, nb) {
            _super.call(this, reflectMat, transmitMat, [sourceFrags.totalInternalReflectionCutoff, sourceFrags.fresnelDielectric]);
            this.ratioStatements = "\n        vec2 fresnelIors = vec2( " + globals.toFloat(na) + ", " + globals.toFloat(nb) + ");\n        if ( inside ) { fresnelIors = fresnelIors.yx; }\n        if ( abs( dot( normal, rayDir ) ) < totalInternalReflectionCutoff( fresnelIors.x, fresnelIors.y ) + " + globals.smallEpsilon + " ) {\n          ratio" + this.id + " = 1.0;\n        } else {;\n          vec2 reflectance = fresnelDielectric( rayDir, normal, refract( rayDir, normal, fresnelIors.x / fresnelIors.y ), fresnelIors.x, fresnelIors.y );\n          ratio" + this.id + " = ( reflectance.x + reflectance.y ) / 2.0;\n        }";
        }
        return FresnelComposite;
    }(SwitchedMaterial));
    mat.FresnelComposite = FresnelComposite;
    ;
    var WrapperMaterial = (function (_super) {
        __extends(WrapperMaterial, _super);
        function WrapperMaterial(material, statements, sourceFrags) {
            if (sourceFrags === void 0) { sourceFrags = []; }
            _super.call(this);
            this.material = material;
            this.statements = statements;
            this.requiredMaterials = [material];
            this.requiredSourceFrag = sourceFrags;
        }
        WrapperMaterial.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return '' +
                this.statements(hisPosName, normalName, rayPosName, rayDirName) +
                this.material.getHitStatements(hisPosName, normalName, rayPosName, rayDirName);
        };
        return WrapperMaterial;
    }(Material));
    mat.WrapperMaterial = WrapperMaterial;
    ;
    var Attenuate = (function (_super) {
        __extends(Attenuate, _super);
        function Attenuate(material, attenuation, isDynamic) {
            _super.call(this, material, function (hisPosName, normalName, rayPosName, rayDirName) {
                if (this.isDynamic) {
                    return "attenuation *= " + this.attenuationName + ";";
                }
                else {
                    return "attenuation *= " + globals.toVec3(this.attenuation) + ";";
                }
            });
            this.isDynamic = isDynamic;
            this.attenuation = attenuation;
            this.attenuationName = 'attenuation' + this.id;
            this.uniforms = isDynamic ? [this.attenuationName] : [];
        }
        Attenuate.prototype.update = function (program) {
            if (this.isDynamic) {
                gl.uniform3f(program.uniformLocations[this.attenuationName], this.attenuation.x, this.attenuation.y, this.attenuation.z);
            }
        };
        ;
        Attenuate.prototype.getUniformsDeclaration = function () {
            if (this.isDynamic) {
                return "uniform vec3 " + this.attenuationName + ";";
            }
            else {
                return "const vec3 " + this.attenuationName + " = " + globals.toVec3(this.attenuation) + ";";
            }
        };
        ;
        return Attenuate;
    }(WrapperMaterial));
    mat.Attenuate = Attenuate;
    ;
    var Emit = (function (_super) {
        __extends(Emit, _super);
        function Emit(material, emission, isDynamic, color) {
            _super.call(this, material, function (hisPosName, normalName, rayPosName, rayDirName) {
                return "accumulation += attenuation * " + this.emissionName + " * " + this.emissionName + "color;";
            });
            this.color = color;
            this.isDynamic = isDynamic;
            this.emission = emission;
            this.emissionName = 'emission' + this.id;
            this.uniforms = isDynamic ? [this.emissionName, this.emissionName + "color", this.emissionName + "intensity"] : [];
        }
        Emit.prototype.setColor = function (color) {
            this.color = color;
        };
        Emit.prototype.update = function (program) {
            if (this.isDynamic) {
                gl.uniform3fv(program.uniformLocations[this.emissionName], this.emission);
                gl.uniform3fv(program.uniformLocations[this.emissionName + "color"], this.color);
            }
        };
        Emit.prototype.getUniformsDeclaration = function () {
            if (this.isDynamic) {
                return "\n          uniform vec3 " + this.emissionName + ";\n          uniform vec3 " + this.emissionName + "color;";
            }
            else {
                return "\n          const vec3 " + this.emissionName + " = " + globals.toVec3(this.emission) + ";\n          const vec3 " + this.emissionName + "color = " + globals.toVec3(this.color) + ";";
            }
        };
        return Emit;
    }(WrapperMaterial));
    mat.Emit = Emit;
    ;
    var Diffuse = (function (_super) {
        __extends(Diffuse, _super);
        function Diffuse(dotWeighted) {
            _super.call(this);
            this.processId = Material.processGlobalId++;
            this.sampleMethod = (dotWeighted) ? "sampleDotWeightOnHemiphere" : "sampleUniformOnHemisphere";
            this.requiredSourceFrag = [sourceFrags.sampleTowardsNormal, sourceFrags.sampleDotWeightOnHemiphere, sourceFrags.sampleUniformOnHemisphere, sourceFrags.sampleUniformOnSphere];
        }
        Diffuse.prototype.getHitStatements = function (hisPosName, normalName, rayPosName, rayDirName) {
            return "bounceType = " + this.processId + ";";
        };
        Diffuse.prototype.getProcessStatements = function () {
            return "\n        rayDir = sampleTowardsNormal( normal, " + this.sampleMethod + "( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) ) );\n        rayPos = hitPos + " + globals.epsilon + " * rayDir;";
        };
        ;
        return Diffuse;
    }(Material));
    mat.Diffuse = Diffuse;
    ;
})(mat || (mat = {}));
;
//# sourceMappingURL=materials.js.map