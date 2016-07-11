// Path tracer in WebGL2
// Copyright (C) <2016> 
//  - Cristian Rodríguez Bernal (maldicion069)
//  - Juan Guerrero Martín (hire33)
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/// <reference path="globals.ts" />
/// <reference path="ShaderProgram.ts" />
/// <reference path="SourceFrag.ts" />
/// <reference path="gl-matrix.d.ts" />

module mat {

  /** 
   * Abstract class.
   */

  export abstract class Material {

    public id;
    public uniforms;

    // Id. for materials.
    protected static materialGlobalId = 1;
    // Id. for types of materials.
    protected static processGlobalId = 1;

    // Code frags that have to be called from materials code in GLSL.   
    public requiredSourceFrag : Array<SourceFrag>;
    // Materials accesible by the render loop. For compositing materials.
    public requiredMaterials : Array<Material>;

    constructor() {
      this.id = Material.materialGlobalId++;
      this.uniforms = [];

      this.requiredMaterials = [];
      this.requiredSourceFrag = [];
    }

    // Update uniforms on the shader.
    public update( program: ShaderProgram ) {}

    // Required functions or uniforms.
    public getUniformsDeclaration() : string {
      return ''; // default
    }

    // Code called when the object is hit. Needs to set bounceType.
    abstract getHitStatements( hisPosName, normalName, rayPosName, rayDirName );

    // Local variable declarations that can be shared between hit statements and process statements.
    public getMaterialShader() : string {
      return '';
    }

    // Calculation of the ray next bounce.
    public getProcessStatements() : string {
      return '';
    }

  };

  /** 
   * Child classes.
   */

  // This material absorbs all the ray energy and stops it.
  export class Absorb extends Material {
    
    public processId;
    
    constructor() {
      super();
      this.processId = Material.processGlobalId++;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return `break;`;
    }
  
  };

  // Pure reflective material.
  export class Reflect extends Material {
    
    public processId;
    
    constructor() {
      super();
      this.processId = Material.processGlobalId++;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return `
        rayDir = reflect( rayDir, normal );
        rayPos = hitPos + ${globals.epsilon} * rayDir;`;
    }
  
  };

  // Pure refractive material.
  export class Transmit extends Material {
    
    public processId;
    public na : number;
    public nb : number;
    
    constructor( na, nb ) {
      super();
      this.processId = Material.processGlobalId++;
      this.na = na;
      this.nb = nb;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `
        transmitIOR${this.id} = vec2( ${this.na}, ${this.nb} );
        if ( inside ) {
          transmitIOR${this.id} = transmitIOR${this.id}.yx;
        }
        bounceType = ${this.processId};`;
    }

    public getMaterialShader() : string {
      return `vec2 transmitIOR${this.id};`;
    }

    public getProcessStatements() : string {
      return `      
        rayDir = refract( rayDir, normal, transmitIOR${this.id}.x / transmitIOR${this.id}.y );
        // Total internal reflection case not handled.
        if ( dot( rayDir, rayDir ) == 0.0 ) { break; }
        rayPos = hitPos + ${globals.epsilon} * rayDir;`;
    }
  
  };

  export class FormulaTextured extends Material {
    
    public processId;
    public formula : string;
    
    constructor( form : string ) {
      super();
      this.formula = form;

      this.processId = Material.processGlobalId++;

      this.requiredSourceFrag = [
        sourceFrags.sampleDotWeightOnHemiphere,
        sourceFrags.sampleTowardsNormal,
        sourceFrags.TWO_PI];
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return this.formula + `
        rayDir = sampleTowardsNormal( normal, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) ) );
        rayPos = hitPos + 0.0001 * rayDir;
      `;
    }

  };

  export class FormulaPowTexture extends FormulaTextured {
    
    constructor() {
      super("attenuation *= pow( abs( 1.0 + sin( 10.0 * sin( hitPos.x ) ) + sin( 10.0 *sin( hitPos.z ) ) ), 7.0 ) * 0.15;");
    }
  
  };
  
  export class ChessTextured extends FormulaTextured {
    
    constructor(color1: Float32Array, color2: Float32Array) {
      var str : string = `
      // Chess texture based on Shirley books
      float sines = sin(10.0*hitPos.x * 0.01) * sin(10.0*hitPos.y * 0.01) * sin(10.0*hitPos.z * 0.01);
      if(sines < 0.0) {
        attenuation = vec3(${color1});
      } else {
        attenuation = vec3(${color2});
      }`;
      super(str);
    }
  
  };

  export class PerlinTexture extends FormulaTextured {
    
    constructor() {
      var str : string = `
        float phi = atan2(vec2(hitPos.z, hitPos.x));
        float theta = asin(hitPos.y);
        vec2 uv;
        uv.x = 1.0-(phi + PI) / TWO_PI;
        uv.y = (theta + PI/2.0) / PI;

        float f = perlin(hitPos.xz*0.01);
        f = 0.5 + 0.5*f;

        attenuation = vec3(f);
      `;
      super(str);

      this.requiredSourceFrag = this.requiredSourceFrag.concat([sourceFrags.atan2, sourceFrags.perlin, sourceFrags.PI, sourceFrags.TWO_PI]);
    }
  
  };

  export class WorleyTexture extends FormulaTextured {
    
    constructor(color1 = vec3.fromValues(0, 0, 0), color2 = vec3.fromValues(1, 1, 1), mixBG : number = 0.4) {
      if(mixBG < 0 || mixBG > 1.0) mixBG = 0.4;
      var str : string = `
        float phi = atan2(vec2(hitPos.z, hitPos.x));
        float theta = asin(hitPos.y);
        vec2 uv;
        uv.x = 1.0-(phi + PI) / TWO_PI;
        uv.y = (theta + PI/2.0) / PI;

        float f = create_cells3D(vec3(hitPos.xz*0.004, 1.0));
        attenuation = vec3(1.0)*f*f;
        attenuation = mix(attenuation, ${globals.toVec3(color1)}, ${globals.toFloat(mixBG)});    // Background
        attenuation = mix(attenuation, ${globals.toVec3(color2)}, f);  
      `;
      super(str);

      this.requiredSourceFrag = this.requiredSourceFrag.concat([sourceFrags.atan2, sourceFrags.worley, sourceFrags.PI, sourceFrags.TWO_PI]);
    }
  
  };

  // Texture with normal mapping && specular texture
  export class Textured extends Material {
    
    public processId;
    public uniforms;
    public diffuseTexture : WebGLTexture;
    public specularTexture : WebGLTexture;
    public normalTexture : WebGLTexture;
    
    constructor( diffuseTexture : WebGLTexture, specularTexture : WebGLTexture, normalTexture : WebGLTexture ) {
      super();
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

    public update( program: ShaderProgram ) {
        gl.activeTexture( gl.TEXTURE2 );
        gl.bindTexture( gl.TEXTURE_2D, this.diffuseTexture );
        gl.uniform1i( program.uniformLocations.albedoTex, 2 );

        gl.activeTexture( gl.TEXTURE3 );
        gl.bindTexture( gl.TEXTURE_2D, this.specularTexture );
        gl.uniform1i( program.uniformLocations.specularTex, 3 );

        gl.activeTexture( gl.TEXTURE4 );
        gl.bindTexture( gl.TEXTURE_2D, this.normalTexture );
        gl.uniform1i( program.uniformLocations.normalTex, 4 );
    }

    public getUniformsDeclaration() : string {
      return `uniform sampler2D albedoTex;
        uniform sampler2D specularTex;
        uniform sampler2D normalTex;`;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return `
        bool inside = abs( hitPos.x ) <= 350.0 && abs( hitPos.z ) <= 350.0;
        if ( inside ) {
          vec3 normal2 = normalize( texture( normalTex, hitPos.xz * 0.003937007874015748 ).rbg * 2.0 - 1.0 );
          vec3 diffuse = pow( abs( texture( albedoTex, hitPos.xz * 0.003937007874015748 ).rgb ), vec3( 2.2 ) );
          if ( dot( normal2, rayDir ) > 0.0 ) { normal2 = normal; }
          vec3 transmitDir = refract( rayDir, normal, 1.0 / 1.5 );
          vec2 reflectance = fresnelDielectric( rayDir, normal, transmitDir, 1.0, 1.5 );
          bool didReflect = false;
          if ( pseudorandom(float(bounce) + seed*1.17243 - 2.3 ) < ( reflectance.x + reflectance.y ) / 2.0 ) {
            vec3 dirtTex = pow( abs( texture( specularTex, hitPos.xz * 0.003937007874015748 ).rgb ), vec3( 2.2 ) ) * 0.4 + 0.6;
            attenuation *= dirtTex * ( pow( abs( diffuse.y ), 1.0 / 2.2 ) );
            vec3 reflectDir = reflect( rayDir, normal2 );
            rayDir = sampleTowardsNormal( reflectDir, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*1642.32+2.52 - 2.3), pseudorandom(float(bounce) + 72.233 * seed + 1.32 - 2.3) ) );
            if ( rayDir.y > 0.0 ) {
              didReflect = true;
              float reflectDot = dot( reflectDir, rayDir );
              if ( reflectDot < 0.0 ) { break; }
              // compute contribution based on normal cosine falloff (not included in sampled direction)
              float contribution = pow( abs( reflectDot ), 50.0 ) * ( 50.0 + 2.0 ) / ( 2.0 );
              // if the contribution is negative, we sampled behind the surface (just ignore it, that part of the integral is 0)
              // weight this sample by its contribution
              attenuation *= contribution;
            }
          }
          if ( !didReflect ) {
            attenuation *= diffuse;
            rayDir = sampleTowardsNormal( normal2, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5) - 2.3, pseudorandom(float(bounce) + 7.233 * seed + 1.3 - 2.3) ) );
            if ( rayDir.y < 0.0 ) { rayDir.y = -rayDir.y; };
          }
        } else {
          attenuation *= pow( vec3( 74.0, 112.0, 25.0 ) / 255.0, vec3( 1.0 / 2.2 ) ) * 0.5;
          rayDir = sampleTowardsNormal( normal, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*164.32+2.5) - 2.3, pseudorandom(float(bounce) + 7.233 * seed + 1.3 - 2.3) ) );
        }
        rayPos = hitPos + ${globals.epsilon} * rayDir;
      `;
    }
  };

  // Dielectric material affected by Fresnel effect.
  export class SmoothDielectric extends Material {
    
    public processId;
    public ior : number;
    public iorIsConstant : boolean;
    public color : Float32Array;
    
    constructor( indexOfRefraction, color : Float32Array = vec3.fromValues(1, 1, 1) ) {
      super();
      this.processId = Material.processGlobalId++;
      this.ior = indexOfRefraction;
      this.color = color;
      this.requiredSourceFrag = [sourceFrags.fresnelDielectric, sourceFrags.totalInternalReflectionCutoff, sourceFrags.sellmeier];
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `iorNext = inside ? ${globals.toFloat(globals.defaultIOR)} : ${this.ior};
        bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return `
        if ( abs( dot( normal, rayDir ) ) < totalInternalReflectionCutoff( ior, iorNext ) + ${globals.smallEpsilon} ) {
          rayDir = reflect( rayDir, normal );
        } else {
          vec3 transmitDir = refract( rayDir, normal, ior / iorNext );
          vec2 reflectance = fresnelDielectric( rayDir, normal, transmitDir, ior, iorNext );
          if ( pseudorandom(float(bounce) + seed*1.7243 - 15.34) > ( reflectance.x + reflectance.y ) / 2.0 ) {
            rayDir = transmitDir;      
            attenuation *= ${globals.toVec3(this.color)};
            ior = iorNext;
          } else {                     
            rayDir = reflect( rayDir, normal );
          }
        }
        rayPos = hitPos + ${globals.epsilon} * rayDir;`;
    }

  };
  
  // Material shaded using Phong reflection model.
  export class PhongSpecular extends Material {
    
    public processId;
    public uniforms;
    public n : number;
    public nName : string;
    public isDynamic;
    
    constructor( n, isDynamic ) {
      super();
      this.n = n;
      this.nName = `phongN${this.id}`;

      this.processId = Material.processGlobalId++;
      this.uniforms = isDynamic ? [this.nName] : [];
   
      this.isDynamic = isDynamic;

      this.requiredSourceFrag = [sourceFrags.TWO_PI, sourceFrags.sampleTowardsNormal, sourceFrags.sampleDotWeightOnHemiphere];
    }

    public update( program: ShaderProgram ) {
      if ( this.isDynamic ) {
        gl.uniform1f( program.uniformLocations[this.nName], this.n );
      }
    }

    public getUniformsDeclaration() : string {
      if ( this.isDynamic ) {
        return `uniform float ${this.nName};`
      } else {
        return `const float ${this.nName} = ${globals.toFloat( this.n )};`;
      }
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `
        phongSpecularN${this.id} = ${this.nName};
        bounceType = ${this.processId};`
    }

    public getMaterialShader() : string {
      return `float phongSpecularN${this.id};`;
    }

    public getProcessStatements() : string {
      var result = `
              vec3 reflectDir = reflect( rayDir, normal );
              rayDir = sampleTowardsNormal( reflectDir, sampleDotWeightOnHemiphere( pseudorandom(float(bounce) + seed*1642.32+2.52), pseudorandom(float(bounce) + 72.233 * seed + 1.32) ) );
              float dotReflectDirWithRay = dot( reflectDir, rayDir );
              float contribution = pow( abs( dotReflectDirWithRay ), phongSpecularN${this.id} ) * ( phongSpecularN${this.id} + 2.0 ) / ( 2.0 );
              if ( dotReflectDirWithRay < 0.0 ) { break; }
              attenuation *= contribution;
              rayPos = hitPos + ${globals.epsilon} * rayDir;`;
      return result;
    }

  };

  // Metal-like material. It reflects rays partially depending on glossiness.
  export class Metal extends Material {

    public processId;
    public ior;
    public glossiness;
    public sampleMethod;
    public color;

    constructor( ior, glossiness, dotWeighted : boolean, color = vec3.fromValues(1, 1, 1) ) {
      super();
      this.ior = ior;
      this.processId = Material.processGlobalId++;
      this.color = color;

      // If not defined, we just set a value.
      this.glossiness = (glossiness == undefined) ? 0.8 : glossiness;
      this.sampleMethod = (dotWeighted) ? "sampleDotWeightOnHemiphere" : "sampleUniformOnHemisphere";

      this.requiredSourceFrag = [sourceFrags.fresnel, sourceFrags[this.sampleMethod]];
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) {
      return ` iorComplex${this.id} = ${globals.toVec2( this.ior )};
        bounceType = ${this.processId};
        glossiness${this.id} = ${globals.toFloat(this.glossiness)};`;
    }

    public getMaterialShader() {
      return `
        vec2 iorComplex${this.id};
        float glossiness${this.id};
      `;
    }

    // has normal, bounce, etc. available
    public getProcessStatements() {
      return ` vec2 reflectance = fresnel( rayDir, normal, ior, iorComplex${this.id}.x, iorComplex${this.id}.y );
      attenuation *= ${globals.toVec3(this.color)} * ( reflectance.x + reflectance.y ) / 2.0;
      rayDir = reflect( rayDir, normal ) + glossiness${this.id} * ${this.sampleMethod}( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) );
      // sampleUniformOnHemisphere: Uniform pseudorandom samples.
      // sampleDotWeightOnHemiphere: Dot-weighted pseudorandom samples calculated using a Monte Carlo method.
      rayPos = hitPos + ${globals.epsilon} * rayDir;`;
    };

  };

  export class SwitchedMaterial extends Material {
    
    public processId;
    public materialA;
    public materialB;
    public ratioStatements;
    
    constructor( materialA, materialB, sourceFrags ) {
      super();

      this.processId = Material.processGlobalId++;
      this.materialA = materialA;
      this.materialB = materialB;
      this.requiredMaterials = [materialA, materialB];
      this.requiredSourceFrag = sourceFrags;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return 'float ratio' + this.id + ';\n' + this.ratioStatements +
        'if ( pseudorandom(float(bounce) + seed*1.7243 - float(' + this.id + ') ) < ratio' + this.id + ' ) {\n' +
          this.materialA.getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) +
        '} else {\n' +
          this.materialB.getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) +
        '}\n';
    }

  };

  // Material who use two materials
  export class FresnelComposite extends SwitchedMaterial {
    
    constructor(reflectMat, transmitMat, na, nb) {
      super(reflectMat, transmitMat, [sourceFrags.totalInternalReflectionCutoff, sourceFrags.fresnelDielectric]);
      this.ratioStatements = `
        vec2 fresnelIors = vec2( ${globals.toFloat(na)}, ${globals.toFloat(nb)});
        if ( inside ) { fresnelIors = fresnelIors.yx; }
        if ( abs( dot( normal, rayDir ) ) < totalInternalReflectionCutoff( fresnelIors.x, fresnelIors.y ) + ${globals.smallEpsilon} ) {
          ratio${this.id} = 1.0;
        } else {;
          vec2 reflectance = fresnelDielectric( rayDir, normal, refract( rayDir, normal, fresnelIors.x / fresnelIors.y ), fresnelIors.x, fresnelIors.y );
          ratio${this.id} = ( reflectance.x + reflectance.y ) / 2.0;
        }`;
    }

  };

  // Materials can be nested (one within another).
  export class WrapperMaterial extends Material {
    
    public material;
    public statements;
    
    constructor( material, statements, sourceFrags : Array<SourceFrag> = [] ) {
      super();

      this.material = material;
      this.statements = statements;
      this.requiredMaterials = [material];
      this.requiredSourceFrag = sourceFrags;
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return '' +
        this.statements( hisPosName, normalName, rayPosName, rayDirName ) +
        this.material.getHitStatements( hisPosName, normalName, rayPosName, rayDirName );
    }

  };

  // This material adds color to another material.
  export class Attenuate extends WrapperMaterial {
   
    public isDynamic;
    public attenuation;
    public attenuationName;
    
    constructor( material, attenuation, isDynamic ) {
      super( material, function(hisPosName, normalName, rayPosName, rayDirName) {
        if ( this.isDynamic ) {
          return `attenuation *= ${this.attenuationName};`;
        } else {
          return `attenuation *= ${globals.toVec3( this.attenuation )};`;
        }
      });
      this.isDynamic = isDynamic;
      this.attenuation = attenuation;
      this.attenuationName = 'attenuation' + this.id;
      this.uniforms = isDynamic ? [this.attenuationName] : [];
    }

    public update( program: ShaderProgram ) {
      if ( this.isDynamic ) {
        gl.uniform3f( program.uniformLocations[this.attenuationName], this.attenuation.x, this.attenuation.y, this.attenuation.z );
      }
    };

    public getUniformsDeclaration() : string {
      if ( this.isDynamic ) {
        return `uniform vec3 ${this.attenuationName};`;
      } else {
        return `const vec3 ${this.attenuationName} = ${globals.toVec3( this.attenuation )};`;
      }
    };

  };

  // This material transforms another material into a light source (emissive).
  export class Emit extends WrapperMaterial {
    
    public isDynamic;
    public emission;
    public emissionName;
    public color;
    
    public setColor(color) {
      this.color = color;
    }
    
    constructor( material, emission, isDynamic, color ) {
      super( material, function(hisPosName, normalName, rayPosName, rayDirName) {
        return `accumulation += attenuation * ${this.emissionName} * ${this.emissionName}color;`;
      });
      this.color = color;
      this.isDynamic = isDynamic;
      this.emission = emission;
      this.emissionName = 'emission' + this.id;
      this.uniforms = isDynamic ? [this.emissionName, this.emissionName+"color", this.emissionName+"intensity"] : [];
    }
    
    public update( program: ShaderProgram ) {
      if ( this.isDynamic ) {
        gl.uniform3fv( program.uniformLocations[this.emissionName], this.emission );
        gl.uniform3fv( program.uniformLocations[this.emissionName+"color"], this.color);
      }
    }

    public getUniformsDeclaration() : string {
      if ( this.isDynamic ) {
        return `
          uniform vec3 ${this.emissionName};
          uniform vec3 ${this.emissionName}color;`;
      } else {
        return `
          const vec3 ${this.emissionName} = ${globals.toVec3( this.emission )};
          const vec3 ${this.emissionName}color = ${globals.toVec3(this.color)};`;
      }
    }

  };

  // Pure diffusive material.
  export class Diffuse extends Material {
    
    public processId : number;
    public sampleMethod : string;
    
    constructor(dotWeighted: boolean) {
      super();
      this.processId = Material.processGlobalId++;
      this.sampleMethod = (dotWeighted) ? "sampleDotWeightOnHemiphere" : "sampleUniformOnHemisphere";
      this.requiredSourceFrag = [sourceFrags.sampleTowardsNormal, sourceFrags.sampleDotWeightOnHemiphere, sourceFrags.sampleUniformOnHemisphere, sourceFrags.sampleUniformOnSphere];
    }

    public getHitStatements( hisPosName, normalName, rayPosName, rayDirName ) : string {
      return `bounceType = ${this.processId};`;
    }

    public getProcessStatements() : string {
      return `
        rayDir = sampleTowardsNormal( normal, ${this.sampleMethod}( pseudorandom(float(bounce) + seed*164.32+2.5), pseudorandom(float(bounce) + 7.233 * seed + 1.3) ) );
        rayPos = hitPos + ${globals.epsilon} * rayDir;`;
    };

  };

}; // END module mat