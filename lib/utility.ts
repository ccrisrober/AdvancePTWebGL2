// Path tracer in WebGL2
// Copyright (C) <2016> 
//	- Cristian Rodríguez Bernal (maldicion069)
//	- Juan Guerrero Martín (hire33)
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

/// <reference path="SourceFrag.ts" />
/// <reference path="globals.ts" />
/// <reference path="ShaderProgram.ts" />
/// <reference path="scene.ts" />
/// <reference path="renderable/Renderable.ts" />

module utility {
	export function loadMesh( src ) : Object {
		var mesh;
		var xmlReq = new XMLHttpRequest();
		xmlReq.open("GET", src, false);
		try {
			xmlReq.send();
		} catch( err ) {
			alert("FAILED TO LOAD MESH " + src);
			return null;
		}
		mesh = JSON.parse(xmlReq.responseText);
		delete(xmlReq);

		return mesh;
	}
	export function loadTexture( src ) {
		//console.log("Load texture " + src)
		var texture = gl.createTexture();
		// Create a DOM image object.
		var image = new Image();
		// Set up the onload handler for the image, which will be called by
		// the browser at some point in the future once the image has
		// finished downloading.
		image.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);

			gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
			// TODO: FALLA EL REPEAT!
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
			gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );

			gl.bindTexture( gl.TEXTURE_2D, null );
			//console.log("Finalize texture loading (" + src + ")");
			};
			image.onerror = function(e) {
			console.log(e);
		}
		// Start downloading the image by setting its source.
		image.src = src;
		// Return the WebGLTexture object immediately.
		return texture;
	}
	export function createSphericalHarmonicShader( objects : Array<Renderable>, projection, environment: environments.AbsEnviroment, bounces : number, sf: SourceFrag ) : ShaderProgram {
		// get a list of all of the material types that we need to process with bounceType
		var materials = [];
		var matProps = [];
		var matPropsPassed = {};

		function recordMaterial( mat ) {
			if ( !matPropsPassed[mat.processId] ) {
				matPropsPassed[mat.processId] = true;
				matProps.push( mat );
			}
			// check for required extra materials (used for composite materials, etc.)
			mat.requiredMaterials.forEach((m) => {
				recordMaterial(m);
			});
			materials.push( mat );
		}

		objects.forEach((obj: Renderable) => {
			recordMaterial(obj.material);
		});

		var src = '' +
			`uniform mat3 rotationMatrix;
			uniform vec3 cameraPosition;
			uniform vec2 times;
			`;
		
		if(environment)
			src += environment.getUniformsDeclaration();

		objects.forEach((obj: Renderable) => {
			src += obj.getUniformsDeclaration();
		});
		materials.forEach((mat) => {
			src += mat.getUniformsDeclaration();
		});

		src += projection.getUniforms();

		src +=
			sourceFrags.pseudorandom.toString() + '\n' +
			'vec4 calculateColor( vec2 p ) {\n' +
			'  vec3 rayPos = cameraPosition;\n' +
			'  rayPos = rayPos + rotationMatrix * vec3( 0, 0, 1.0 ) * (- 4.0 + 8.0 * ( 2.0 * floor( p.y ) ) );\n';

			if(fog) {
				// Bloom-like jitter
				src += '  vec2 jittered = ( p + ( 1.0 + pow( pseudorandom(seed * 134.16 + 12.6), 6.0 ) * 20.0 ) * ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
			} else {
				src += '  vec2 jittered = ( p + ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
			}
			src += projection.computeRayDir() +
			'  vec3 attenuation = vec3( 1.0);\n' +
			'  vec3 accumulation = vec3( 0.0 );\n' +
			'  float ior = ' + globals.toFloat(globals.defaultIOR) + ';\n' + // index of refraction
			'  float iorNext;\n' +
			'  vec3 normal;\n' +
			'  vec3 hitPos;\n' +
			'  bool inside = false;\n' +
			'  int bounceType;\n';

		matProps.forEach((prop) => {
			src += prop.getMaterialShader();
		});

		src +=
			`  for( int bounce = 0; bounce < ${bounces}; bounce++ ) {
					int hitObject = 0;
					float t = INFINITY;
					inside = false;
			`;

		objects.forEach((obj: Renderable) => {
			src += obj.getIntersectionExprType() + ' ' + obj.prefix + 'hit = ' + obj.getIntersectionExpr( 'rayPos', 'rayDir' ) + ';\n';
		});

		objects.forEach((obj: Renderable) => {
			src +=
				'    if ( ' + obj.getValidIntersectionCheck( obj.prefix + 'hit' ) + ' && ' + obj.getT( obj.prefix + 'hit' ) + ' < t ) {\n' +
				'      t = ' + obj.getT( obj.prefix + 'hit' ) + ';\n' +
				'      hitObject = ' + obj.id + ';\n' +
				'    }\n';
		});

		src +=
			`   hitPos = rayT( rayPos, rayDir, t );
					if ( t == INFINITY ) {
						bounceType = 0;
			`;

		objects.forEach((obj: Renderable) => {
			src +=`    } else if ( hitObject == ${obj.id} ) {`;

			if ( obj.getInsideExpression ) {
				var insideExpression = obj.getInsideExpression( obj.prefix + 'hit' );
				if ( insideExpression !== 'false' ) {
					src += '      inside = ' + obj.getInsideExpression( obj.prefix + 'hit' ) + ';\n';
				}
			}

			src += '      normal = ' + obj.getNormal( obj.prefix + 'hit', 'hitPos', 'rayPos', 'rayDir' ) + ';\n' + obj.material.getHitStatements( 'hitPos', 'normal', 'rayPos', 'rayDir' );
		});

		src +=
			'    }\n' +

			// hit nothing, environment light
			'    if ( bounceType == 0 ) {\n' +
			environment.getEnvironmentExpression() +
			'      break;\n';

		matProps.forEach((prop) => {
			if ( prop.processId !== undefined ) {
				console.log(prop);
				src += '    } else if ( bounceType == ' + prop.processId + ' ) {\n' + prop.getProcessStatements();
			}
		});

		src +=
			`    }
				}
				vec3 col = calcIrradiance(normal);
				accumulation = mix(col*accumulation/${globals.toFloat(bounces)}, col, 0.0);
				return vec4(accumulation, 1.0);
			}
			`;

		// sourceFrags dependencies
		var dependencies = [sourceFrags.rayT, sf, sourceFrags.calcIrradiance];
		dependencies = dependencies.concat( environment.requiredSourceFrag );
		dependencies = dependencies.concat( projection.requiredSourceFrag );

		objects.forEach((obj: Renderable) => {
			dependencies = dependencies.concat(obj.requiredSourceFrag);
		});
		matProps.forEach((prop) => {
			dependencies = dependencies.concat( prop.requiredSourceFrag );
		});

		// uniforms
		var uniforms = ['rotationMatrix', 'cameraPosition', 'times'];
		uniforms = uniforms.concat( environment.uniforms );
		uniforms = uniforms.concat( projection.uniforms );

		objects.forEach((obj: Renderable) => {
			uniforms = uniforms.concat(obj.uniforms);
		});
		materials.forEach((mat) => {
			uniforms = uniforms.concat(mat.uniforms);
		});

		return createIntegratorProgram( new SourceFrag( src, dependencies ).toString(), 8, uniforms );
	};
	export function createSceneProgram( objects : Array<Renderable>, projection, environment: environments.AbsEnviroment, bounces ) : ShaderProgram {
		// get a list of all of the material types that we need to process with bounceType
		var materials = [];
		var matProps = [];
		var matPropsPassed = {};
		
		function recordMaterial( mat ) {
			if ( !matPropsPassed[mat.processId] ) {
				matPropsPassed[mat.processId] = true;
				matProps.push( mat );
			}
			// Check if material be a composite material
			mat.requiredMaterials.forEach((m) => {
				recordMaterial(m);
			});
			materials.push( mat );
		}

		objects.forEach((obj: Renderable) => {
			recordMaterial(obj.material);
		});

		var src = '' +
			`uniform mat3 rotationMatrix;
			uniform vec3 cameraPosition;
			uniform vec2 times;
			`;
		
		if(environment) {
			src += environment.getUniformsDeclaration();
		}

		objects.forEach((obj: Renderable) => {
			src += obj.getUniformsDeclaration();
		});
		materials.forEach((mat) => {
			src += mat.getUniformsDeclaration();
		});

		src += `
			${projection.getUniforms()}
			${sourceFrags.pseudorandom.toString()}
		`;

		src += "float shadow( vec3 rayPos, vec3 rayDir ) {\n";
	
		objects.forEach((obj: Renderable) => {
			src += obj.getIntersectionExprType() + ' ' + obj.prefix + 'hit = ' + obj.getIntersectionExpr( 'rayPos', 'rayDir' ) + ';\n';
		});

		objects.forEach((obj: Renderable) => {
			if(!(obj instanceof Plane)) {
				src += `    
							if ( ${obj.getT( obj.prefix + 'hit' )} < 1.0 ) {
								return 0.0;
							}`;
			}
		});
		src += "return 1.0;\n}";

		src += `
			vec4 calculateColor( vec2 p ) {
				vec3 rayPos = cameraPosition;
				rayPos = rayPos + rotationMatrix * vec3( 0, 0, 1.0 ) * (- 4.0 + 8.0 * ( 2.0 * floor( p.y ) ) );
			`
			if(fog) {
			// Bloom-like jitter
				src += '  vec2 jittered = ( p + ( 1.0 + pow( pseudorandom(seed * 134.16 + 12.6), 6.0 ) * 20.0 ) * ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
			} else {
				src += '  vec2 jittered = ( p + ( vec2( pseudorandom(seed * 34.16 + 2.6), pseudorandom(seed * 117.13 + 0.26) ) - 0.5 ) * 1.0 / size ) - 0.5;\n';
			}
			src += `
				${projection.computeRayDir()}
				vec3 attenuation = vec3( 1.0 );
				vec3 accumulation = vec3( 0.0 );
				float ior = ${globals.toFloat(globals.defaultIOR)};
				float iorNext;
				vec3 normal;
				vec3 hitPos;
				bool inside = false;
				int bounceType;`;

		matProps.forEach((prop) => {
			src += prop.getMaterialShader();
		});
		
		src +=
			`  
				int hitObject = 0;
				float t = INFINITY;
				for( int bounce = 0; bounce < ${bounces}; bounce++ ) {
					hitObject = 0;
					t = INFINITY;
					inside = false;
			`;

		objects.forEach((obj: Renderable) => {
			src += `${obj.getIntersectionExprType()} ${obj.prefix}hit = ${obj.getIntersectionExpr( 'rayPos', 'rayDir' )};`;
		});

		objects.forEach((obj: Renderable) => {
			src += `
						if ( ${obj.getValidIntersectionCheck( obj.prefix + 'hit' )} && ${obj.getT( obj.prefix + 'hit' )} < t ) {
							t = ${obj.getT( obj.prefix + 'hit' )};
							hitObject = ${obj.id};
						}`;
		});

		src +=
			`   hitPos = rayT( rayPos, rayDir, t );
					if ( t == INFINITY ) {
						bounceType = 0;
			`;

		objects.forEach((obj: Renderable) => {
			src += `    } else if ( hitObject == ${obj.id} ) {`;

			if ( obj.getInsideExpression ) {
				var insideExpr = obj.getInsideExpression( obj.prefix + 'hit' );
				if ( insideExpr !== 'false' ) {
					src += `      inside = ${obj.getInsideExpression( obj.prefix + 'hit' )};`;
				}
			}

			src += `      normal = ${obj.getNormal( obj.prefix + 'hit', 'hitPos', 'rayPos', 'rayDir' )};
										${obj.material.getHitStatements( 'hitPos', 'normal', 'rayPos', 'rayDir' )}`;
		});

		src +=`
					}
					// hit nothing, environment light
					if ( bounceType == 0 ) {
			${environment.getEnvironmentExpression()}
						break;`;

		matProps.forEach((prop) => {
			if ( prop.processId ) {
				src += `    } else if ( bounceType == ${prop.processId} ) {
					${prop.getProcessStatements()}`;
			}
		});

		src += `     
					}
					vec3 toLight = sphere1center - hitPos;     
					float diffuse = max(0.0, dot(normalize(toLight), normal));    
					float shadowIntensity = shadow(hitPos + normal * 0.0001, toLight);
					accumulation += attenuation * (diffuse * shadowIntensity);
				}
				return vec4( accumulation / ${globals.toFloat(bounces)}, 1 );
			}
			`;

		// sourceFrags dependencies
		var dependencies = [sourceFrags.rayT];
		dependencies = dependencies.concat( environment.requiredSourceFrag );
		dependencies = dependencies.concat( projection.requiredSourceFrag );

		objects.forEach((obj: Renderable) => {
			dependencies = dependencies.concat(obj.requiredSourceFrag);
		});
		matProps.forEach((prop) => {
			dependencies = dependencies.concat( prop.requiredSourceFrag );
		});

		// uniforms
		var uniforms = ['rotationMatrix', 'cameraPosition', 'times'];
		uniforms = uniforms.concat( environment.uniforms );
		uniforms = uniforms.concat( projection.uniforms );

		objects.forEach((obj: Renderable) => {
			uniforms = uniforms.concat(obj.uniforms);
		});
		materials.forEach((mat) => {
			uniforms = uniforms.concat(mat.uniforms);
		});

		return createIntegratorProgram( new SourceFrag( src, dependencies ).toString(), 8, uniforms );
	};

	var createIntegratorProgram = function( src, numSamples, uniforms ) {
		var integratorUniforms = ['time', 'weight', 'previousTexture','size'];
		if ( uniforms ) {
			integratorUniforms = integratorUniforms.concat( uniforms );
		}

		console.log(integratorUniforms);

		var shader : ShaderProgram = new ShaderProgram();
		shader.addShader(globals.vertexCode, gl.VERTEX_SHADER, mode.read_text);
		shader.addShader(`#version 300 es
		precision highp float;

		precision highp int;
		precision highp isampler2D;

		in vec2 texCoord;
		uniform float time;
		uniform float weight;
		uniform vec2 size;
		uniform sampler2D previousTexture;

		out vec4 fragColor;
		#define INFINITY 10000.0

		float seed;

		${src}
		
		void main( void ) {
			vec4 previous = vec4( texture( previousTexture, gl_FragCoord.xy / size ).rgb, 1 );
			vec4 sample_ = vec4(0);
			for( int i = 0; i < ${numSamples}; i++) {
				seed = time + float(i);
				sample_ = sample_ + calculateColor( texCoord );
			}
			fragColor = mix( sample_ / ${globals.toFloat( numSamples )}, previous, weight );
		}`, gl.FRAGMENT_SHADER, mode.read_text);

		shader.compile_and_link();

		shader.addAttributes(['vertex']);
		shader.addUniforms(integratorUniforms);

		return shader;
	}
}

/*normal = normalForBox( vec3(-25,65,-25), vec3(10,10,10), hitPos );
attenuation *= vec3(1,0.1,1);bounceType = 11;*/