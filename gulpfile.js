'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');

// var gls = require('gulp-live-server');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var nunjucks = require('gulp-nunjucks-html');
var sass = require('gulp-sass');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var assign = require('lodash').assign;

var fs = require('fs');
var data = require('gulp-data');
var frontMatter = require('gulp-front-matter');

// add custom browserify options here
var customOpts = {
  entries: ['./src/js/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts)); 

gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('./bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
       .pipe(ngAnnotate())
       .pipe(uglify())
       .on('error', gutil.log)
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./www/js'));
}

gulp.task('sass',function(){
    return gulp.src(['./src/scss/*.scss'])
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./www/css'));
});
gulp.watch('./src/scss/**/*.scss', ['sass']);


var scriptTemplateFiles = function(file){
  var dir = fs.readdirSync('./src/templates/scripts');
  return {'files':dir};
}

gulp.task('html',function (){
    return gulp.src(['./src/templates/*.html'])
        .pipe(data( scriptTemplateFiles ))
        .pipe(frontMatter())
        .pipe(nunjucks({
            searchPaths: ['./src/templates'],
            tags: {
                variableStart: '{{=',
                variableEnd: '}}'
            }
        }))
        .on('error', gutil.log)
        .pipe(gulp.dest('./www'));
});
gulp.watch(['src/templates/**/*.html'],['html']);

gulp.task('default',['html','sass','js']);

// gulp.task('server',function (){
//     var server = gls.static('./www',3000,false);
//     server.start();
//     gulp.watch(['./www/*.html','./www/css/*.css','./www/js/*.js']);
// });

gulp.task('server', function() {
  browserSync({
    server: {
      baseDir: './www'
    }
  });
  gulp.watch(['*.html', 'css/**/*.css', 'js/**/*.js'], {cwd: './www'}, reload);
});