/// <reference path="ShaderProgram.ts" />
/// <reference path="globals.ts" />


module environments {
	export abstract class AbsEnviroment {
    public update( program : ShaderProgram ) {}
    public abstract getUniformsDeclaration() : string;
    public abstract getEnvironmentExpression() : string;
    public uniforms;
    public requiredSourceFrag = [];
  }
  export class SimpleEnvironment extends AbsEnviroment {
    public src;
    public requiredSourceFrag;
    constructor( src, sfs ) {
      super();
      this.src = src;
      this.uniforms = [];
      this.requiredSourceFrag = sfs;
    }
    public update( program : ShaderProgram ) {}
    public getUniformsDeclaration() : string {
      return "";
    }
    public getEnvironmentExpression() : string { 
      return this.src;
    }
  }
  export class TextureEnvironment extends AbsEnviroment {
    protected envTexture;
    public mult : number;
    public rotation : number;
    public intensity : number;
    constructor( envTexture, mult, rot ) {
      super();
      this.envTexture = envTexture;
      this.mult = mult;
      this.rotation = rot;

      this.uniforms = ['envTexture','envRotation', 'envMult'];
      this.requiredSourceFrag = [ sourceFrags.PI, sourceFrags.TWO_PI ];
    }


    public update( program : ShaderProgram ) {
      gl.activeTexture( gl.TEXTURE1 );
      gl.bindTexture( gl.TEXTURE_2D, this.envTexture );

      gl.uniform1i( program.uniformLocations["envTexture"], 1 );
      gl.uniform1f( program.uniformLocations["envRotation"], this.rotation );
      gl.uniform1f( program.uniformLocations["envMult"], this.mult);
    }

    public getUniformsDeclaration() : string {
      return `
        uniform sampler2D envTexture;
        uniform float envRotation;
        uniform float envMult;`;
    }

    public getEnvironmentExpression() : string {
      /*var textureLookup;

      var coord = 'vec2( -atan( rayDir.z, rayDir.x ) / TWO_PI + 0.5 + envRotation, ( 0.5 - asin( rayDir.y ) / PI ) * 2.0)';
      textureLookup = 'texture( envTexture, ' + coord + ' ).rgb';
      
      return '      accumulation += attenuation * ' + textureLookup + ' * mult;\n';*/
      var textureLookup;

      var coord = 'vec2( -atan( rayDir.z, rayDir.x ) / TWO_PI + 0.5 + envRotation, ( 0.5 - asin( rayDir.y ) / PI ) * 2.0)';
      textureLookup = 'texture( envTexture, ' + coord + ' ).rgb';
      
      return '      accumulation += attenuation * ' + textureLookup + ' * envMult;\n';
    }
  }
}