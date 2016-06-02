module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: [
          'public/js/third-party/jquery.min.js',
          'public/js/third-party/bootstrap.js',
          'public/js/third-party/underscore.min.js',
          'public/js/third-party/backbone.min.js',
          'public/bower_components/momentjs/moment.js',
          'public/js/third-party/jquery.colorbox-min.js',
          'public/js/third-party/handlebars.js',
          'public/js/models.js',
          'public/js/templates.js',
          'public/js/views/common_views.js',
          'public/js/views/index.js',
          'public/js/views/ModalView.js',
          'public/js/controllers/controller.js'
        ],
        dest: 'public/js/build/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'public/css/build/<%= pkg.name %>.min.css': [
            'public/css/third-party/bootstrap.min.css',
            'public/css/style.css',
            'public/css/third-party/font-awesome/css/font-awesome.min.css',
            'public/css/index.css'
          ]
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['uglify']);

};