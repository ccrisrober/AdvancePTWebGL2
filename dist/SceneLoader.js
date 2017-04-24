var SceneLoader = (function () {
    function SceneLoader(filePath) {
        this.spheres = [];
        this.boxes = [];
        this.triangles = [];
        this.meshes = [];
        this.planes = [];
        this.lights = [];
        var request = new XMLHttpRequest();
        request.open("GET", filePath, false);
        try {
            request.send();
        }
        catch (err) {
            alert("ERROR: " + filePath);
            return null;
        }
        var xmlParser = new DOMParser();
        this.mSceneXML = xmlParser.parseFromString(request.responseText, "text/xml");
        this.SceneLevel = this.mSceneXML.getElementsByTagName("SceneLevel").item(0);
        this.parseCamera();
        this.parseSceneLight();
        var objects = this.SceneLevel.getElementsByTagName("Objects").item(0);
        this.parseSpheres(objects);
        this.parseBoxes(objects);
        this.parseTriangles(objects);
        this.parseMeshes(objects);
        this.parsePlanes(objects);
        this.parseLights(objects);
    }
    SceneLoader.prototype.str2FloatArr = function (str, token) {
        if (token === void 0) { token = " "; }
        var splt = str.split(token);
        var len = splt.length;
        var arr = new Array(len);
        for (var i = 0; i < len; i++) {
            arr[i] = parseFloat(splt[i]);
        }
        return arr;
    };
    SceneLoader.prototype.createMaterial = function (material_) {
        var material;
        switch (material_.tagName) {
            case "Textured":
                var diffuse = material_.getAttribute("diffuse");
                var specular = material_.getAttribute("specular");
                var normal = material_.getAttribute("normal");
                material = new mat.Textured(utility.loadTexture(diffuse), utility.loadTexture(specular), utility.loadTexture(normal));
                break;
            case "Emit":
                if (material_.firstElementChild.tagName == "Absorb") {
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
                material = new mat.Attenuate(this.createMaterial(material_.firstElementChild), this.str2FloatArr(material_.getAttribute("color")), false);
                break;
            case "FresnelComposite":
                if (material_.childElementCount == 2) {
                    var material1 = this.createMaterial(material_.childNodes.item(1));
                    console.log(material1);
                    var material2 = this.createMaterial(material_.childNodes.item(3));
                    console.log(material2);
                    var na = this.string2Float(material_.getAttribute("na"));
                    var nb = this.string2Float(material_.getAttribute("nb"));
                    material = new mat.FresnelComposite(material1, material2, na, nb);
                }
                break;
            case "Metal":
                if (material_.getAttribute("ior") &&
                    material_.getAttribute("glossiness") &&
                    material_.getAttribute("montecarlo")) {
                    var montecarloActive = (this.string2Float(material_.getAttribute("montecarlo")) == 1.0);
                    var ior = this.string2Float(material_.getAttribute("ior"));
                    material = new mat.Metal([ior, ior], this.string2Float(material_.getAttribute("glossiness")), montecarloActive);
                }
                else if (material_.getAttribute("iorComplex") &&
                    material_.getAttribute("glossiness") &&
                    material_.getAttribute("montecarlo")) {
                    var montecarloActive = (this.string2Float(material_.getAttribute("montecarlo")) == 1.0);
                    material = new mat.Metal(this.str2FloatArr(material_.getAttribute("iorComplex")), this.string2Float(material_.getAttribute("glossiness")), montecarloActive);
                }
                if (material_.getAttribute("color")) {
                    material["color"] = this.str2FloatArr(material_.getAttribute("color"));
                }
                break;
            case "SmoothDielectric":
                if (material_.attributes.getNamedItem("color")) {
                    material = new mat.SmoothDielectric(this.string2Float(material_.getAttribute("ior"))),
                        this.str2FloatArr(material_.getAttribute("color"));
                }
                else {
                    material = new mat.SmoothDielectric(this.string2Float(material_.getAttribute("ior")));
                }
                if (material_.getAttribute("color")) {
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
                if (color1) {
                    if (color2) {
                        material = new mat.WorleyTexture(new Float32Array(color1), new Float32Array(color2));
                    }
                    else {
                        material = new mat.WorleyTexture(new Float32Array(color1));
                    }
                }
                else {
                    material = new mat.WorleyTexture();
                }
                break;
            case "Transmit":
                if (material_.getAttribute("outerIor") && material_.getAttribute("innerIor")) {
                    material = new mat.Transmit(this.string2Float(material_.getAttribute("outerIor")), this.string2Float(material_.getAttribute("innerIor")));
                }
                break;
            case "Reflect":
                material = new mat.Reflect();
                break;
            default:
                console.log(material_.tagName);
                break;
        }
        return material;
    };
    SceneLoader.prototype.string2Float = function (str) {
        return parseFloat(str);
    };
    SceneLoader.prototype.parseCamera = function () {
        var cm = this.SceneLevel.getElementsByTagName("Camera").item(0);
        var cameraPos = new Float32Array(this.str2FloatArr(cm.attributes.getNamedItem("position").value));
        var up = new Float32Array(this.str2FloatArr(cm.attributes.getNamedItem("up").value));
        var yaw = this.string2Float(cm.attributes.getNamedItem("yaw").value);
        var pitch = this.string2Float(cm.attributes.getNamedItem("pitch").value);
        this.cam = new Camera(cameraPos, up, yaw, pitch);
    };
    SceneLoader.prototype.parseSceneLight = function () {
        var lg_xml = this.SceneLevel.getElementsByTagName("Light").item(0);
        this.light = new Light(this.str2FloatArr(lg_xml.attributes.getNamedItem("position").value), this.string2Float(lg_xml.attributes.getNamedItem("radius").value), this.str2FloatArr(lg_xml.attributes.getNamedItem("color").value));
        var intensity = parseInt(lg_xml.getAttribute("intensity"));
        this.light.setIntensity(intensity);
    };
    SceneLoader.prototype.parseSpheres = function (objects) {
        var spheres_aux = objects.getElementsByTagName("Sphere");
        for (var i = 0, len = spheres_aux.length; i < len; i++) {
            var center = this.str2FloatArr(spheres_aux[i].attributes.getNamedItem("center").value);
            var radius = this.string2Float(spheres_aux[i].attributes.getNamedItem("radius").value);
            var material = this.createMaterial(spheres_aux[i].firstElementChild);
            var s = new Sphere(center, radius, false, material, true);
            if (material)
                this.spheres.push(s);
        }
    };
    SceneLoader.prototype.parseBoxes = function (objects) {
        var cubes_aux = objects.getElementsByTagName("Box");
        for (var i = 0, len = cubes_aux.length; i < len; i++) {
            var min = this.str2FloatArr(cubes_aux[i].getAttribute("min"));
            var max = this.str2FloatArr(cubes_aux[i].getAttribute("max"));
            var material = this.createMaterial(cubes_aux[i].firstElementChild);
            var b = new Box(min, max, false, material, true);
            if (material)
                this.boxes.push(b);
        }
    };
    SceneLoader.prototype.parseTriangles = function (objects) {
        var triangles_aux = objects.getElementsByTagName("Triangle");
        for (var i = 0, len = triangles_aux.length; i < len; i++) {
            var v0 = this.str2FloatArr(triangles_aux[i].getAttribute("v0"));
            var v1 = this.str2FloatArr(triangles_aux[i].getAttribute("v1"));
            var v2 = this.str2FloatArr(triangles_aux[i].getAttribute("v2"));
            var material = this.createMaterial(triangles_aux[i].firstElementChild);
            var t = new Triangle(v0, v1, v2, false, material);
            if (material)
                this.triangles.push(t);
        }
    };
    SceneLoader.prototype.parseMeshes = function (objects) {
        var meshes_aux = objects.getElementsByTagName("Mesh");
        for (var i = 0, len = meshes_aux.length; i < len; i++) {
            var src = meshes_aux[i].getAttribute("src");
            var material = this.createMaterial(meshes_aux[i].firstElementChild);
            var m = new Mesh(src, false, material);
            if (material)
                this.meshes.push(m);
        }
    };
    SceneLoader.prototype.parsePlanes = function (objects) {
        var planes_aux = objects.getElementsByTagName("Plane");
        for (var i = 0, len = planes_aux.length; i < len; i++) {
            var normal = this.str2FloatArr(planes_aux[i].getAttribute("normal"));
            var d = this.str2FloatArr(planes_aux[i].getAttribute("d"));
            var material = this.createMaterial(planes_aux[i].firstElementChild);
            var p = new Plane(normal, d, false, material);
            if (material)
                this.planes.push(p);
        }
    };
    SceneLoader.prototype.parseLights = function (objects) {
        var lights_aux = objects.getElementsByTagName("Light");
        for (var i = 0, len = lights_aux.length; i < len; i++) {
            var lg_xml = lights_aux[i];
            var light = new Light(this.str2FloatArr(lg_xml.attributes.getNamedItem("position").value), this.string2Float(lg_xml.attributes.getNamedItem("radius").value), this.str2FloatArr(lg_xml.attributes.getNamedItem("color").value));
            var intensity = parseInt(lg_xml.getAttribute("intensity"));
            light.setIntensity(intensity);
            this.lights.push(light);
        }
    };
    return SceneLoader;
}());
//# sourceMappingURL=SceneLoader.js.map