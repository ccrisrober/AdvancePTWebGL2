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

/// <reference path="gl-matrix.d.ts" />
/// <reference path="dat-gui.d.ts" />
/// <reference path="HDRLoaders.ts" />

/// <reference path="integrators/RenderMode.ts" />
/// <reference path="integrators/RayTracer.ts" />
/// <reference path="integrators/PathTracer.ts" />
/// <reference path="integrators/SphericalHarmonics.ts" />

/// <reference path="globals.ts" />
/// <reference path="quadsToneMap.ts" />

/// <reference path="renderable/Renderable.ts" />
/// <reference path="renderable/Box.ts" />
/// <reference path="renderable/Sphere.ts" />
/// <reference path="renderable/Light.ts" />
/// <reference path="renderable/Plane.ts" />
/// <reference path="renderable/Triangle.ts" />
/// <reference path="renderable/Mesh.ts" />

/// <reference path="materials.ts" />
/// <reference path="scene.ts" />
/// <reference path="environments.ts" />
/// <reference path="utility.ts" />

/// <reference path="camera.ts" />
/// <reference path="SceneLoader.ts" />

/// <reference path="input.ts" />

//(function() {

  var sl : SceneLoader;

  var loading = true;
  var lightSphere : Light;


  var Config = function() {
    this.Bounces = 5;
    this.NumSamples = 5;
    this.IOR = 1.000277; // TODO: globals.defaultIOR
    this.Update = function() {
      setStatus("Updating ...");
      globals.defaultIOR = parseFloat(this.IOR);
      bounces = parseInt(this.Bounces);
      tracerIntegrator.MAX_SAMPLES = parseInt(this.NumSamples);
      updateStepProgram();
    }
    this.lightPositionX = 0.0;
    this.lightPositionY = 0.0;
    this.lightPositionZ = 0.0;
    this.lightColor = "#ffae23"; //[0, 255, 255];
    this.lightIntensity = 1.0;
    this.enviroments = 0;
    this.RenderMode = 1;  // Path Tracer
    this.SceneSelector = "scene0";
    this.fog = false;
    this.MaximumTime = 0.0;
    this.ShutterAppertureTime = 0.0;
    this.BlurAmount = 0.0;
    this.FocalLength = 50.0;
    this.ToneMapping = 0;
    this.Exposure = 100.0;
    this.Rotation = 150.0;
    this.Intensity = 0.5;
    this.DownloadShader = function() {
      console.log("Download");
      var text = tracerIntegrator.stepProgram.fragmentSource;
      var data = new Blob([text], { type: "text/plain"});
      var textFile = window.URL.createObjectURL(data);
      var link : HTMLAnchorElement = <HTMLAnchorElement>document.createElement("a");
      link["download"] = "shader.frag";
      link.href = textFile;
      link.click();
    };
    this.Reset = function() {
      console.log("Reset");
      initializeTracer();
      updateStepProgram();
    };
  }
  var config = new Config();

  function updateXML(scene) {
    Renderable.resetStaticID();

    if(sl) {
      delete sl.spheres
      delete sl.boxes
      delete sl.triangles
      delete sl.meshes
      delete sl.planes
    }

    loading = true;
    sl = new SceneLoader(`scenes/${scene}.xml`);
    lightSphere = sl.light;

    config.lightPositionX = lightSphere.center[0];
    config.lightPositionY = lightSphere.center[1];
    config.lightPositionZ = lightSphere.center[2];

    camera = sl.cam;

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(rgb) {
      return "#" + componentToHex(rgb[0]*255) + componentToHex(rgb[1]*255) + componentToHex(rgb[2]*255);
    }
    /*(<HTMLInputElement>document.getElementById("lightColor")).value = rgbToHex(lightSphere.getColor()) + "";
    console.log(rgbToHex(lightSphere.getColor()));*/


    currentSceneObjects = [lightSphere];  // LightSphere need to be the first object to create custom shadow
    currentSceneObjects = currentSceneObjects.concat(sl.spheres);
    currentSceneObjects = currentSceneObjects.concat(sl.boxes);
    currentSceneObjects = currentSceneObjects.concat(sl.planes);
    currentSceneObjects = currentSceneObjects.concat(sl.triangles);
    currentSceneObjects = currentSceneObjects.concat(sl.meshes);
    currentSceneObjects = currentSceneObjects.concat(sl.lights);
    
    //currentSceneObjects.push( new Mesh("json_objs/cube.json", false, new mat.Attenuate(new mat.Diffuse(true), vec3.fromValues(1, 0, 0), false)) );

  }

  updateXML("scene0");

  module fps {
    var dom_counter = document.getElementById("fps");
    var lastCalledTime;
    var counter = 0;
    var fpsArray = [];
    var fps;
    export function update() {
      if (!lastCalledTime) {
        lastCalledTime = new Date().getTime();
        fps = 0;
      }
      var delta = (new Date().getTime() - lastCalledTime) / 1000;
      lastCalledTime = new Date().getTime();
      fps = Math.ceil((1/delta));

      if (counter >= 60) {
        var sum = fpsArray.reduce(function(a,b) { return a + b });
        var average = Math.ceil(sum / fpsArray.length);
        counter = 0;
        dom_counter.innerHTML = Math.round(average) + " FPS";
      } else {
        if (fps !== Infinity) {
          fpsArray.push(fps);
        }

        counter++;
      }
    }
  }

  var tracerIntegrator : RenderMode = null;
  var currentSceneObjects : Array<Renderable>;
  var environment : environments.AbsEnviroment;
  var projection : scene.PerspectiveRays;


  var bounces = 8;
  var samples = 1;

  var camera : Camera;

  var environmentRotation;
  var envTexture;

  var startTime : number;
  var shutterOpenTime : number;

  var v : Float32Array;

  var normalizedGlossiness: number = 0.3; 

  var integratorCallBack = (program) => {
    program.use();
    v = camera.GetViewMatrix();

    gl.uniformMatrix3fv( program.uniformLocations["rotationMatrix"], false, 
           new Float32Array([v[10], v[9], v[8],
                             v[6], v[5], v[4],
                             v[2], v[1], v[0]]));
    gl.uniform3fv( program.uniformLocations["cameraPosition"], camera.position);
    gl.uniform2f( program.uniformLocations["times"], startTime, startTime + shutterOpenTime );
    for ( var i = 0; i < currentSceneObjects.length; i++ ) {
      currentSceneObjects[i].update( program );
      currentSceneObjects[i].material.update( program );
    }
    projection.update( program );
    environment.update( program );
  }

  function initializeTracer() {
    tracerIntegrator = new PathTracer( integratorCallBack , size );
  }

  function updateStepProgram() {
    loading = true;
    setStatus( 'Compiling shader...' );

    if ( !tracerIntegrator ) {
      console.log("INIT INTEGRATOR");
      initializeTracer();
    }

    try {
      console.log("Compilando");
      tracerIntegrator.resetShader( currentSceneObjects, projection, environment, bounces);
      console.log("Oki");
      loading = false;
    } catch ( e ) {
      setStatus( e );
      console.log(tracerIntegrator.stepProgram.fragmentSource);
      throw e;
    }
    tracerIntegrator.reset();
  }
  
  function loadEnvironmentTexture( url, width, height, multiplier ) {
    loading = true;
    gl.deleteTexture( envTexture );

    setStatus( 'Loading Texture...' );
    HDRLoader.asyncLoadHDRTexture( gl, url, width, height, gl.RGB, function( texture ) {
      envTexture = texture;
      setStatus();

      environment = new environments.TextureEnvironment( envTexture, multiplier, environmentRotation );
      updateStepProgram();
    } );
  }

  // Deprecated
  function initUI() {

    /*var glossinessSlider: HTMLInputElement = <HTMLInputElement>document.getElementById('glossiness');
    glossinessSlider.addEventListener('input', function() {
      alert(parseFloat(glossinessSlider.value));
      normalizedGlossiness = parseFloat(glossinessSlider.value) * 0.01;
      tracerIntegrator.reset();
    });*/

  }

  function setStatus( message? : string ) {
    var statusSpan = document.getElementById( 'status' );
    statusSpan.innerHTML = message;
    (<HTMLElement>statusSpan.parentNode).style.display = message ? 'block' : 'none';
  }

  function initialize() {

    startTime = 0;
    shutterOpenTime = 0;

    environmentRotation = config.Rotation;//parseFloat((<HTMLInputElement>document.getElementById( 'environmentRotationSlider' )).value) / 360;

    environment = new environments.SimpleEnvironment( 'accumulation += + attenuation * 1.5;', []);
    projection = new scene.PerspectiveRays( 50, 0 );

    document.addEventListener("keydown", function(ev) {
      if ( ev.keyCode === 40 || ev.keyCode === 38 ) {
        ev.preventDefault();
      }
      var key = String.fromCharCode(ev.keyCode);
      var speed = 0.5;
      switch (key) {
        case "W":
          camera.processKeyboard(4, speed);
          tracerIntegrator.reset();
          break;

        case "S":
          camera.processKeyboard(5, speed);
          tracerIntegrator.reset();
          break;

        case "A":
          camera.processKeyboard(2, speed);
          tracerIntegrator.reset();
          break;

        case "D":
          camera.processKeyboard(3, speed);
          tracerIntegrator.reset();
          break;

        case "E":
          // - .
          camera.processKeyboard(0, speed);
          tracerIntegrator.reset();
          break;

        case "Q":
          // + .
          camera.processKeyboard(1, speed);
          tracerIntegrator.reset();
          break;
      }

      switch(ev.keyCode) {
        case 38:
          camera.processMouseMovement(0.0, 2.5);
          tracerIntegrator.reset();
          break;
        case 40:
          camera.processMouseMovement(0.0, -2.5);
          tracerIntegrator.reset();
          break;
        case 37:
          camera.processMouseMovement(2.5, 0.0);
          tracerIntegrator.reset();
          break;
        case 39:
          camera.processMouseMovement(-2.5, 0.0);
          tracerIntegrator.reset();
          break;
      }
    });

    updateStepProgram();

    var lastTime = Date.now();

    (function runLoop() {
      window.requestAnimationFrame(() => runLoop());

      textures.reset();

      var currentTime = Date.now();
      var timeElapsed = currentTime - lastTime;
      lastTime = currentTime;

      camera.timeElapsed = timeElapsed;
      fps.update();

      if ( !loading ) {
        setStatus();

        tracerIntegrator.step();
        tracerIntegrator.render();

        Input.getInstance().update();
      }

    })();
  }  

  window.addEventListener( 'load', function() {
    if ( !gl ) {
      setStatus( 'Error: ' + failureMessage );
    } else {
      setStatus( 'Loading Texture...' );
      Input.getInstance().initialize();

      var gui = new dat.GUI({width: 400});
      var sceneConfig = gui.addFolder("Scene Configuration");
      sceneConfig.add(config, "RenderMode", {
        "Ray Tracer": 0,
        "Path Tracer": 1,
        "S. Harmonics (Grace)": 2,
        "S. Harmonics (Galileo)": 3,
        "S. Harmonics (Beach)": 4,
        "S. Harmonics (Neighbor)": 5,
      }).onChange(function(idx) {
        setStatus("Loading shader");
        if(idx == 0) {
          console.log("Ray tracer");
          console.log("Nothing to do here...");
          console.log(`
              ........
             . o   o  .
            .  ______  .
             .        .
              ........
              .........
             .    .  .
            . ..  . . ###
             .. ....   #####
             .  .       #######
            .  . 
          `)
          //tracerIntegrator = new RayTracer(integratorCallBack, size);
        } else if(idx == 1) {
          console.log("Path tracer");
          setStatus("Loading integrator ...");
          tracerIntegrator = new PathTracer(integratorCallBack, size);
        } else if(idx == 2) {
          console.log("Spherical Armonics");
          console.log("SHCoeffsGrace");
          setStatus("Loading integrator ...");
          tracerIntegrator = new SphericalHarmonics(integratorCallBack, size, "SHCoeffsGrace");
        } else if(idx == 3) {
          console.log("Spherical Armonics");
          console.log("SHCoeffsGalileo");
          setStatus("Loading integrator ...");
          tracerIntegrator = new SphericalHarmonics(integratorCallBack, size, "SHCoeffsGalileo");
        } else if(idx == 4) {
          console.log("Spherical Armonics");
          console.log("SHCoeffsBeach");
          setStatus("Loading integrator ...");
          tracerIntegrator = new SphericalHarmonics(integratorCallBack, size, "SHCoeffsBeach");
        } else if(idx == 5) {
          console.log("Spherical Armonics");
          console.log("SHCoeffsNeighbor");
          setStatus("Loading integrator ...");
          tracerIntegrator = new SphericalHarmonics(integratorCallBack, size, "SHCoeffsNeighbor");
        }
        updateStepProgram();
      });

      function getJSONfile(path, callback) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
              var data = JSON.parse(httpRequest.responseText);
              if (callback) callback(data);
            }
          }
        };
        httpRequest.open('GET', path);
        httpRequest.send(); 
      }

      getJSONfile('scenes.json', function(data) {
        data = data.scenes;
        console.log(data);
        var obj = {};
        for(var i = 0; i < data.length; i++) {
          obj[data[i].name] = data[i].file;
        }
        console.log(obj);
        sceneConfig.add(config, "SceneSelector", obj)
          .onChange(function(scene) {
            setStatus("Loading scene...");
            updateXML(scene);
            updateStepProgram();
          });
         loadOthers();
      });

      function loadOthers() {

        sceneConfig.add(config, "Bounces", 1, 10).step(1);
        sceneConfig.add(config, "NumSamples", 0, 100).step(1);
        sceneConfig.add(config, "IOR", 0, 5.00).step(0.0001);
        sceneConfig.add(config, "Update");

        sceneConfig.open();

        var lightFolder = gui.addFolder("Light");
        lightFolder.add(config, "lightPositionX", -150, 70).onChange(updateLightPos);
        lightFolder.add(config, "lightPositionY", -70, 170).onChange(updateLightPos);
        lightFolder.add(config, "lightPositionZ", -150, 70).onChange(updateLightPos);

        lightFolder.addColor(config, "lightColor").onChange(updateLightPos);
        lightFolder.add(config, "lightIntensity", 0, 300).onChange(updateLightPos);

        function hexToRgb(hex) {
          // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
          var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          hex = hex.replace(shorthandRegex, function(m, r, g, b) {
              return r + r + g + g + b + b;
          });

          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
              r: parseInt(result[1], 16)/255,
              g: parseInt(result[2], 16)/255,
              b: parseInt(result[3], 16)/255
          } : null;
        }

        function updateLightPos() {
          lightSphere.center[0] = config.lightPositionX;
          lightSphere.center[1] = config.lightPositionY;
          lightSphere.center[2] = config.lightPositionZ;
          var color : string = config.lightColor;
          console.log(color);
          //color = color.replace( '#','0x' );
          //console.log(color);
          console.log(hexToRgb(color));
          lightSphere.setColor(hexToRgb(color)); // TODO
          lightSphere.setIntensity(parseFloat(config.lightIntensity));
          lightSphere.refresh();
          tracerIntegrator.reset();
        }

        var participateMedia = gui.addFolder("Participative Media");
        participateMedia.add(config, "fog", false).onChange(function() {
          loading = true;
          fog = !fog;
          console.log(fog);
          updateStepProgram();
        });

        var motionBlur = gui.addFolder("Motion Blur");
        motionBlur.add(config, "MaximumTime", -50, 50).onChange(function(v) {
          startTime = v;
          tracerIntegrator.reset();
        });
        motionBlur.add(config, "ShutterAppertureTime", -50, 50).onChange(function(v) {
          shutterOpenTime = v;
          tracerIntegrator.reset();
        });

        var toneMapping = gui.addFolder("Tone Mapping");
        toneMapping.add(config, "ToneMapping", {
          None: 0,
          Linear: 1,
          Reinhard: 2,
          Filmic: 3,
          sRGB: 4,
          Uncharted2: 5
        }).onChange(function() {
          if(config.ToneMapping == 0) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadSimpleProgram);
          } else if(config.ToneMapping == 1) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadGammaProgram);
          } else if(config.ToneMapping == 2) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadReinhardProgram);
          } else if(config.ToneMapping == 3) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadFilmicProgram);
          } else if(config.ToneMapping == 4) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadsRGBProgram);
          } else if(config.ToneMapping == 5) {
            tracerIntegrator.resetRenderProgram(toneMap.textureQuadUncharted2Program);
          }
        });
        toneMapping.add(config, "Exposure", 0, 500).onChange(function(v) {
          tracerIntegrator.brightness = v / 100;
        });
  // TODO: FALTAN LOS STEP EN TODOS LOS CAMPOS .min(0).max(0).step(0.5);
        var depthField = gui.addFolder("Depth of Field");
        depthField.add(config, "BlurAmount", 0, 50).onChange(function(v) {
          projection.dofSpread = v / 25;
          tracerIntegrator.reset();
        });
        depthField.add(config, "FocalLength", 0, 50).onChange(function(v) {
          projection.focalLength = v;
          tracerIntegrator.reset();
        });

        var env = gui.addFolder("Environment");
        env.add(config, "enviroments", {
          Constant: 0,
          Morning: 1,
          Afternoon: 2,
          Night: 3
        }).onChange(function() {
          if(config.enviroments == 0) {
            environment = new environments.SimpleEnvironment( 
                'accumulation += attenuation * 1.5;\n', [] );
            updateStepProgram();
          } else if(config.enviroments == 1) {
            loadEnvironmentTexture( '../../images/hdrTest1.hdr', 2048, 512, 2.0 );
            config.Intensity = 2.0;
          } else if(config.enviroments == 2) {
            loadEnvironmentTexture( '../../images/hdrTest2.hdr', 2048, 512, 0.5 );
            config.Intensity = 0.5;
          } else if(config.enviroments == 3) {
            loadEnvironmentTexture( '../../images/hdrTest3.hdr', 2048, 512, 1.2 );
            config.Intensity = 1.2;
          }
        });
        env.add(config, "Rotation", 0, 720).onChange(function(v) {
          (<environments.TextureEnvironment>environment).rotation = environmentRotation = v / 100;
          tracerIntegrator.reset(); // TODO
        });
        env.add(config, "Intensity", 0, 5).onChange(function(v) {
          (<environments.TextureEnvironment>environment).mult = v;
          tracerIntegrator.reset(); // TODO
        });

        gui.add(config, "DownloadShader");
        gui.add(config, "Reset");

        initialize();
      }
    }
  } );