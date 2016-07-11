module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            options: {
                port: 3030,
                livereload: 35729,
                hostname: "localhost"
            },
            livereload: {
                options: {
                    open: true
                }
            }
        },
        concat: {
            js: {
                src: "dest/**/*.js",        
                dest: 'build/combined.js',
                options: {
                    separator: ';'
                }
            }
        },
        uglify: {
            my_target: {
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: '**/*.js',
                    dest: 'dest'
                }]
            },
        },
        ts: {
            base: {
                src: ["!**/*.d.ts", 'lib/**/*.ts'],
                outDir: "dist",
                options: {
                    compile: true,
                    module: 'commonjs',
                    target: 'es5',
                    sourceMap: true,
                    declaration: false,     // Generate .d.ts
                    keepDirectoryHierarchy: true
                }
            }
        },
        watch: {
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: ["!**/*.d.ts", 'lib/**/*.ts'],
                tasks: ['ts']//, 'uglify']
            }
        },
        open: {
            dev: {
                path: 'http://localhost:3030/index.html'
            }
        }, 
        objjson: {
            src: "objs/",
            dest: "json_objs/"
        }
    });

    grunt.registerTask('objjson', 'OBJ to JSON parse', function() {
        //var path = grunt.config.get('objjson.src');
        var done = this.async();
        var fs = require("fs");
        var path = grunt.config.get('objjson.src');
        function getExtension(filename) {
            var i = filename.lastIndexOf('.');
            return (i < 0) ? '' : filename.substr(i);
        }
        if (!fs.existsSync(grunt.config.get('objjson.dest'))){
            fs.mkdirSync(grunt.config.get('objjson.dest'));
        }
        var parseWFObj = require('./wavefront-obj-parser');
        fs.readdir(path, function(err, items) {
            for (var i = 0; i < items.length; i++) {
                var file = path + '/' + items[i];

                if(getExtension(file) != ".obj") continue;
                console.log("Start: " + file);

                var wavefrontString = fs.readFileSync(file).toString('utf8')
                var parsedJSON = parseWFObj(wavefrontString);

                var outputfile = grunt.config.get('objjson.dest') + items[i].substr(0, items[i].lastIndexOf(".")) + ".json";

                fs.writeFile(outputfile, JSON.stringify(parsedJSON, null, 4), function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("JSON saved to " + outputfile);
                    }
                    if(i+1 == items.length) { 
                        done();
                    }
                });
            }
        });
    });
 
    grunt.registerTask("ugly", ["uglify", "concat"]);
    grunt.registerTask("genobjs", ["objjson"]);
    grunt.registerTask('default', ['connect:livereload', "ts", 'open', 'watch']);

};
