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

/// <reference path="ShaderProgram.ts" />
/// <reference path="renderable/Renderable.ts" />
/// <reference path="renderable/Sphere.ts" />
/// <reference path="renderable/Box.ts" />
/// <reference path="renderable/Triangle.ts" />
/// <reference path="renderable/Mesh.ts" />
/// <reference path="renderable/Plane.ts" />
/// <reference path="renderable/Light.ts" />
/// <reference path="materials.ts" />
/// <reference path="camera.ts" />

class SceneLoader {
	private mSceneXML:XMLDocument;
	public light : Light;

	public cam : Camera;

	protected str2FloatArr(str: string, token: string = " ") : Array<number> {
		var splt = str.split(token);
		var len : number = splt.length;
		var arr : Array<number> = new Array(len);
		for(var i = 0; i < len; i++) {
			arr[i] = parseFloat(splt[i]);
		}
		return arr;
	}

	protected createMaterial(material_: Element) {
		var material: mat.Material;
		switch (material_.tagName) {
			case "Textured": 
				// 3 WebGLTexture!
				var diffuse = material_.getAttribute("diffuse");
				var specular = material_.getAttribute("specular");
				var normal = material_.getAttribute("normal");
				material = new mat.Textured(utility.loadTexture(diffuse), utility.loadTexture(specular), utility.loadTexture(normal));
				break;
			case "Emit": 
				if(material_.firstElementChild.tagName == "Absorb") {
					var absorb = material_.getElementsByTagName("Absorb").item(0);
					var insensity = this.string2Float(absorb.getAttribute("intensity"));
					var color = this.str2FloatArr(absorb.getAttribute("color"));
					material = new mat.Emit(new mat.Absorb(), vec3.fromValues(insensity, insensity, insensity), false, color);	
				}
				break;
			case "Diffuse":
				material = new mat.Diffuse(globals.montecarloActive);	
				break;	
			case "Attenuate":
				material = new mat.Attenuate(this.createMaterial(material_.firstElementChild), 	
				this.str2FloatArr(material_.getAttribute("color")), false);
				break;
			case "FresnelComposite":
				if(material_.childElementCount == 2) {
					var material1 : mat.Material = this.createMaterial(<Element>material_.childNodes.item(1));
					console.log(material1);
					var material2 : mat.Material = this.createMaterial(<Element>material_.childNodes.item(3));
					console.log(material2);
					var na : number = this.string2Float(material_.getAttribute("na"));
					var nb : number = this.string2Float(material_.getAttribute("nb"));
					material = new mat.FresnelComposite(material1, material2, na, nb);
				}
				break;
			case "Metal":
				if ( material_.getAttribute("ior") && 
					 material_.getAttribute("glossiness") &&
					 material_.getAttribute("montecarlo") ) 
				{

					// Cristian: globals.montecarloActive
					var montecarloActive : boolean = ( this.string2Float(material_.getAttribute("montecarlo")) == 1.0 );
					var ior = this.string2Float(material_.getAttribute("ior"));
					material = new mat.Metal([ior, ior],
						this.string2Float(material_.getAttribute("glossiness")), montecarloActive);
				} else 
				if ( material_.getAttribute("iorComplex") &&
					 material_.getAttribute("glossiness") &&
					 material_.getAttribute("montecarlo") ) 
				{
					// Cristian: globals.montecarloActive
					var montecarloActive: boolean = ( this.string2Float(material_.getAttribute("montecarlo")) == 1.0 );
					material = new mat.Metal(this.str2FloatArr(material_.getAttribute("iorComplex")), 
						this.string2Float(material_.getAttribute("glossiness")), montecarloActive);
				}
				if(material_.getAttribute("color")) {
					material["color"] = this.str2FloatArr(material_.getAttribute("color"));
				}
				break;
			case "SmoothDielectric":
				if(material_.attributes.getNamedItem("color")) {
					material = new mat.SmoothDielectric(this.string2Float(material_.getAttribute("ior"))), 
						this.str2FloatArr(material_.getAttribute("color"));
				} else {
					material = new mat.SmoothDielectric(this.string2Float(material_.getAttribute("ior")));
				}
				if(material_.getAttribute("color")) {
					material["color"] = this.str2FloatArr(material_.getAttribute("color"));
				}
				break;
			case "PhongSpecular":
				material = new mat.PhongSpecular(this.string2Float(material_.getAttribute("n")), false);
				break;
			case "ChessTexture":
				var color1 = this.str2FloatArr(material_.getAttribute("color1"));
				var color2 = this.str2FloatArr(material_.getAttribute("color2"));
				material = new mat.ChessTextured(new Float32Array(color1), new Float32Array(color2));
				break;
			case "PerlinTexture":
				material = new mat.PerlinTexture();
				break;
			case "FormulaPowTexture":
				material = new mat.FormulaPowTexture();
				break;
			case "WorleyTexture": 
				var color1 = this.str2FloatArr(material_.getAttribute("color1"));
				var color2 = this.str2FloatArr(material_.getAttribute("color2"));
				if(color1) {
					if(color2) {
						material = new mat.WorleyTexture(new Float32Array(color1), new Float32Array(color2));
					} else {
						material = new mat.WorleyTexture(new Float32Array(color1));
					}
				} else {
					material = new mat.WorleyTexture();
				}
				break;
			case "Transmit":
				if (material_.getAttribute("outerIor") && material_.getAttribute("innerIor")) {
					material = new mat.Transmit(
						this.string2Float(material_.getAttribute("outerIor")),
						this.string2Float(material_.getAttribute("innerIor"))
					 )
				}
				break;
			case "Reflect":
				material = new mat.Reflect();
				break;
			default:
				console.log(material_.tagName);
				break;
		}
		/*if(!material) {
			throw material_;
		}*/
		return material;
	}

	protected string2Float(str: string) : number {
		return parseFloat(str);
	}

	public SceneLevel : Element;

	public parseCamera() {
		var cm = this.SceneLevel.getElementsByTagName("Camera").item(0);
		var cameraPos = new Float32Array(this.str2FloatArr(cm.attributes.getNamedItem("position").value));
		var up = new Float32Array(this.str2FloatArr(cm.attributes.getNamedItem("up").value));
		var yaw = this.string2Float(cm.attributes.getNamedItem("yaw").value);
		var pitch = this.string2Float(cm.attributes.getNamedItem("pitch").value);

		this.cam = new Camera(
			cameraPos, 	// position
			up, 		// up
			yaw, 		// yaw
			pitch		// pitch
		);
	}

	public parseSceneLight() {
		var lg_xml : Element = this.SceneLevel.getElementsByTagName("Light").item(0);
		this.light = new Light(
			this.str2FloatArr(lg_xml.attributes.getNamedItem("position").value), // center
			this.string2Float(lg_xml.attributes.getNamedItem("radius").value),// radius
			this.str2FloatArr(lg_xml.attributes.getNamedItem("color").value)// color
		);
		var intensity = parseInt(lg_xml.getAttribute("intensity"));
		this.light.setIntensity(intensity);
	}

	public parseSpheres(objects : Element) {
		var spheres_aux = objects.getElementsByTagName("Sphere");
		for(var i = 0, len = spheres_aux.length; i < len; i++) {
			var center = this.str2FloatArr(spheres_aux[i].attributes.getNamedItem("center").value);
			var radius = this.string2Float(spheres_aux[i].attributes.getNamedItem("radius").value);
			var material = this.createMaterial(spheres_aux[i].firstElementChild);
			var s = new Sphere(center, radius, false, material, true);
			if (material) this.spheres.push(s);
		}
		//console.log(this.spheres);
	}

	public parseBoxes(objects : Element) {
		var cubes_aux = objects.getElementsByTagName("Box");
		for(var i = 0, len = cubes_aux.length; i < len; i++) {
			var min = this.str2FloatArr(cubes_aux[i].getAttribute("min"));
			var max = this.str2FloatArr(cubes_aux[i].getAttribute("max"));
			var material = this.createMaterial(cubes_aux[i].firstElementChild);
			var b = new Box(min, max, false, material, true);
			if (material) this.boxes.push(b);
		}
		//console.log(this.boxes);
	}

	public parseTriangles(objects: Element) {
		var triangles_aux = objects.getElementsByTagName("Triangle");
		for(var i = 0, len = triangles_aux.length; i < len; i++) {
			var v0 = this.str2FloatArr(triangles_aux[i].getAttribute("v0"));
			var v1 = this.str2FloatArr(triangles_aux[i].getAttribute("v1"));
			var v2 = this.str2FloatArr(triangles_aux[i].getAttribute("v2"));
			var material = this.createMaterial(triangles_aux[i].firstElementChild);
			var t = new Triangle(v0, v1, v2, false, material);
			if(material) this.triangles.push(t);
		}
		//console.log(triangles_aux);
	}

	public parseMeshes(objects : Element) {
		var meshes_aux = objects.getElementsByTagName("Mesh");
		for(var i = 0, len = meshes_aux.length; i < len; i++) {
			var src = meshes_aux[i].getAttribute("src");
			var material = this.createMaterial(meshes_aux[i].firstElementChild);
			var m = new Mesh(src, false, material);
			if (material) this.meshes.push(m);
		}
		//console.log(this.meshes);
	}

	public parsePlanes(objects: Element) {
		var planes_aux = objects.getElementsByTagName("Plane");
		for(var i = 0, len = planes_aux.length; i < len; i++) {
			var normal = this.str2FloatArr(planes_aux[i].getAttribute("normal"));
			var d = this.str2FloatArr(planes_aux[i].getAttribute("d"));
			var material = this.createMaterial(planes_aux[i].firstElementChild);
			var p = new Plane(normal, d, false, material);
			if (material) this.planes.push(p);
		}
		//console.log(planes_aux);
	}

	public parseLights(objects: Element) {
		var lights_aux = objects.getElementsByTagName("Light");
		for(var i = 0, len = lights_aux.length; i < len; i++) {
			var lg_xml : Element = lights_aux[i];
			var light = new Light(
				this.str2FloatArr(lg_xml.attributes.getNamedItem("position").value), // center
				this.string2Float(lg_xml.attributes.getNamedItem("radius").value),// radius
				this.str2FloatArr(lg_xml.attributes.getNamedItem("color").value)// color
			);
			var intensity = parseInt(lg_xml.getAttribute("intensity"));
			light.setIntensity(intensity);
			this.lights.push(light);
		}
		//console.log(lights_aux);
	}

	public spheres : Array<Sphere> = [];
	public boxes : Array<Box> = [];
	public triangles : Array<Triangle> = [];
	public meshes : Array<Mesh> = [];
	public planes : Array<Plane> = [];
	public lights : Array<Light> = [];

	constructor(filePath) {
		var request  : XMLHttpRequest = new XMLHttpRequest();
		request.open("GET", filePath, false);
		try {
			request.send();
		} catch(err) {
			alert("ERROR: " + filePath);
			return null;
		}
		var xmlParser = new DOMParser();
		this.mSceneXML = xmlParser.parseFromString(request.responseText, "text/xml");

		this.SceneLevel = this.mSceneXML.getElementsByTagName("SceneLevel").item(0);

		//console.log(this.SceneLevel);

		this.parseCamera();
		this.parseSceneLight();

		var objects : Element = this.SceneLevel.getElementsByTagName("Objects").item(0);
		this.parseSpheres(objects);
		this.parseBoxes(objects);
		this.parseTriangles(objects);
		this.parseMeshes(objects);
		this.parsePlanes(objects);
		this.parseLights(objects);
		
	}
}
