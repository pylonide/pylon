module.exports = (grunt) ->
  grunt.initConfig
    pkg: '<json:package.json>'

    coffee:
      lib:
        files:[
          expand: true
          cwd: './'
          src: ['touch.coffee']
          dest: './'
          ext: '.js'
        ]
    watch:
      files: [
        '*.coffee'
      ]
      tasks: ['default']
  grunt.loadNpmTasks 'grunt-contrib-coffee';
  grunt.loadNpmTasks 'grunt-contrib-watch';
  grunt.registerTask 'default', ['coffee'];
  