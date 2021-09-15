const gulp = require('gulp'),
    browserSync = require('browser-sync'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    minify = require('gulp-minify'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    fs = require('fs'),
    crypto = require('crypto'),
    fileinclude = require('gulp-file-include');

// Title used for system notifications
var notifyInfo = {
    title: 'Gulp'
};

// Error notification settings for plumber
var plumberErrorHandler = {
    errorHandler: notify.onError({
        title: notifyInfo.title,
        icon: notifyInfo.icon,
        message: "Error: <%= error.message %>"
    })
};

var argv = require("yargs").argv; // Gets the arguments that you specifiy when you run gulp

if (argv.production !== undefined) {
    console.log('this script now runs in production mode by default. use --debug to switch out of production mode.');
}

var debug = argv.debug !== undefined;
var no_browser_sync = argv.no_browser_sync === undefined ? false : true;

var SCSS_dir = "./assets/scss";
var CSS_dir = "./";
var JS_dir = "./assets/js";
var host = "http://localhost:8888/jeffandony.com/"; // your site url goes here

/**
 *     Hash a set of files and return a manifest object
 * 
 *     @param  array    src_files    The files
 *     
 *     @return object   The manifest object
 */
function hash_files(src_files) {

    let manifest = {};

    for (let i = 0; i < src_files.length; i++) {
        let regex = /\\|\//g;
        let file_buffer = fs.readFileSync(__dirname + '/' + src_files[i]);
        let sum = crypto.createHash('sha256');
        let filename = src_files[i].split(regex).pop();

        sum.update(file_buffer);

        manifest[filename] = sum.digest('hex');
    }

    return manifest;
}

/**
 * Build a cache version manifest by 
 * hashing assets
 */
function cache_version_update() {
    let cache_version_filename = __dirname + '/asset_cache_manifest.json';

    manifest = hash_files([JS_dir + '/build/main.min.js', CSS_dir + '/style.css']);

    let asset_manifest_json = JSON.stringify(manifest);

    fs.writeFileSync(cache_version_filename, asset_manifest_json, function(err, data) {
        if (err) {
            console.log('error writing ' + cache_version_filename + ': ' + err);
        }
    });

    return gulp.src(cache_version_filename)
        .pipe(gulp.dest(__dirname));
}

/**
 **     Compile scss into minified css
 **
 **      @param  array   src_files   The source scss files - assumes starting dir is SCSS_dir
 **      @param  string  dest        The destination dir - empty defaults to CSS_dir
 **      @param  string  maps_dest   The sourcemap destination dir - empty defaults to ./ (relative to CSS_dir)
 **/
function scss_compile(src_files, dest, maps_dest) {
    dest = undefined === dest ? CSS_dir : dest;
    maps_dest = undefined === maps_dest ? './' : maps_dest;

    for (let i = 0; i < src_files.length; i++) {
        src_files[i] = SCSS_dir + src_files[i];
    }

    return debug ?
        gulp.src(src_files)
        .pipe(plumber(plumberErrorHandler))
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' })
            .on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write(maps_dest))
        .pipe(gulp.dest(dest)) :
        gulp.src(src_files)
        .pipe(plumber(plumberErrorHandler))
        .pipe(sass({ outputStyle: 'expanded' })
            .on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest(dest));
}

/**
 **      Compile js into minified js 
 **
 **      @param  array   src_files   The source js files - assumes starting dir is JS_dir
 **      @param  string  dest_file   The destination file - empty defaults to main.min.js
 **      @param  string  dest        The destination dir - empty defaults to JS_dir
 **/
function js_compile(src_files, dest_file, dest) {
    dest = undefined === dest ? JS_dir + '/build' : dest;
    dest_file = undefined === dest_file ? 'main.min.js' : dest_file;

    for (let i = 0; i < src_files.length; i++) {
        src_files[i] = JS_dir + src_files[i];
    }

    return gulp.src(src_files)
        .pipe(plumber())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(minify({
            ext: {
                src: '.js',
                min: '.min.js'
            },
            noSource: true,
            ignoreFiles: ['.min.js']
        }))
        .pipe(concat(dest_file))
        .pipe(gulp.dest(dest));
}

function all_styles() {
    return scss_compile(['/style.scss']);
}

function theme_js() {
    return js_compile(['/src/base/**/*.js', '/src/custom/**/*.js']);
}

function templatize_html() {
    return gulp
        .src(['./*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest('./dist/'));
}

function watch() {

    if (false === no_browser_sync && host != '') {
        /** 
         **   The browser-sync UI won't work with local sites
         **   served over https. Annoying, but not the end of the world.
         **   
         **   @link https://github.com/BrowserSync/browser-sync/issues/1152
         **/
        browserSync.init({
            files: ['template-parts/**/*.php', '*.php', 'inc/**/*.php'],
            proxy: host,
            useHttps: true,
            snippetOptions: {},
            socket: {
                // For local development only use the default Browsersync local URL.
                domain: 'localhost:3000'
                    // For external development (e.g on a mobile or tablet) use an external URL.
                    // You will need to update this to whatever BS tells you is the external URL when you run Gulp.
                    // domain: '10.0.1.20:3000'
            },
        });

        gulp.watch([SCSS_dir + '/**/*.scss'], gulp.series(all_styles, cache_version_update)).on('change', browserSync.reload);
        gulp.watch([JS_dir + '/src/**/*.js'], gulp.series(gulp.parallel(theme_js), cache_version_update)).on('change', browserSync.reload);
    } else {
        gulp.watch([SCSS_dir + '/**/*.scss'], gulp.series(all_styles, cache_version_update));
        gulp.watch([JS_dir + '/src/**/*.js'], gulp.series(gulp.parallel(theme_js), cache_version_update));
    }

    gulp.watch(['./includes/**/*.html', '*.html'], gulp.series(templatize_html, cache_version_update));

}

exports.default = gulp.series(gulp.parallel(all_styles, theme_js), cache_version_update, watch);
exports.build = gulp.series(gulp.parallel(all_styles, theme_js), cache_version_update);
exports.js = gulp.series(gulp.parallel(theme_js), cache_version_update);
exports.style = gulp.series(gulp.parallel(all_styles), cache_version_update);