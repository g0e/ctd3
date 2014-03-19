module.exports = function(grunt){
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-compress");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint : {
			files : ['ctd3.js', 'dataset_sample.js'],
			options : {}
		},
		uglify : {
			dist : {
				src : ["ctd3.js"],
				dest : "ctd3.min.js"
			}
		},
		cssmin : {
			compress : {
				files : {
					"ctd3.min.css" : ["ctd3.css"]
				}
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
					"ctd3_v<%= pkg.version %>" : ["ctd3.*","dataset_sample.js","LICENSE.txt"]
				}
			}
		}
	});

	grunt.registerTask("test", ["jshint"]);
	grunt.registerTask("default", ["jshint","uglify","cssmin","compress"]);
	
};

