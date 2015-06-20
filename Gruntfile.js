module.exports = function(grunt){
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-compress");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint : {
			files : ['src/ctd3.js'],
			options : {}
		},
		uglify : {
			dist : {
				src : ["src/ctd3.js"],
				dest : "dist/ctd3.min.js"
			}
		},
		cssmin : {
			compress : {
				files : {
					"dist/ctd3.min.css" : ["src/ctd3.css"]
				}
			}
		},
		copy : {
			main : {
				files : [{
					expand: true,
					cwd: 'src/',
					src: ['ctd3.js','ctd3.css','dataset_sample.js'],
					dest: 'dist/',
				}]
			}
		},
		compress : {
			main : {
				options : {
					archive: 'dist.zip',
					mode: "zip",
					pretty: true
				},
				files : {
					"ctd3_v<%= pkg.version %>" : ["dist/**","LICENSE.txt"]
				}
			}
		}
	});

	grunt.registerTask("test", ["jshint"]);
	grunt.registerTask("default", ["jshint","uglify","cssmin","copy","compress"]);
	
};

