var gulp          = require('gulp'),
	autoprefixer  = require('gulp-autoprefixer'),
	browserSync   = require('browser-sync'),
    postcss       = require('gulp-postcss'),
    sass          = require('gulp-sass'),
	concat        = require('gulp-concat'),
	gulpif        = require('gulp-if'),
	gutil         = require('gulp-util'),
	htmlhint      = require('gulp-htmlhint'),
	imagemin      = require('gulp-imagemin'),
	jshint        = require('gulp-jshint'),
	notify        = require('gulp-notify'),
	plumber       = require('gulp-plumber'),
	rename        = require('gulp-rename'),
	sourcemaps    = require('gulp-sourcemaps'),
	svgmin        = require('gulp-svgmin'),
	uglify        = require('gulp-uglify'),
	useref        = require('gulp-useref'),
  	lazypipe      = require('lazypipe'),

	reload        = browserSync.reload,
	config        = require('./config.json'),
  	dest          = ( config.dest.length )? config.dest : '.',
  	destAssets    = ( config.paths.destAssets.length )? '/'+config.paths.destAssets : '',
  	srcAssets     = ( config.paths.srcAssets.length )? '/'+config.paths.srcAssets : '',
  	bsOptions     = ( config.hostname.length )? { proxy : config.hostname, online: true } : { server: { baseDir: "./src/" } };


// Gulp plumber error handler
var onError = function(err) {
	//console.log(err); // Commenting out because it's mostly annoying. Enable as needed.
	//this.emit('end');
};



/*
	IMAGE/SVG TASKS
------------------------------------------------------*/

// Compresses images for production.
gulp.task('images', function() {
    return gulp.src( './src'+srcAssets+'/images/**/*.{jpg,jpeg,png,gif}' )
		.pipe(imagemin())
		.pipe(gulp.dest( dest+destAssets+'/images' ));
});

// Compresses SVG files for production.
gulp.task('svg', function() {
    return gulp.src('./src'+srcAssets+'/images/**/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(gulp.dest(dest+destAssets+'/images'));
});




/*
	HTML TASKS
------------------------------------------------------*/

// No more missing closed tags in large html files :-).
gulp.task('html', function() {
	return gulp.src("./src/*.html")
		.pipe(plumber({errorHandler: onError}))
    	.pipe(htmlhint())
		.pipe(htmlhint.failReporter())
		.on('error', notify.onError(function( err ){
				return { message: err.message, title : 'HTML Error', sound: "Frog"};
			})
		);
});




/*
	JAVASCRIPT TASKS
------------------------------------------------------*/

// Development JS creation.
// Checks for errors and concats. Does not minify.
gulp.task('js', function () {
    return gulp.src( ['./src'+srcAssets+'/js/*.js'] )
   		.pipe(plumber({errorHandler: onError}))
		.pipe(jshint())
		.pipe(jshint.reporter('fail'))
		.pipe(notify(function (file) {
		    if (file.jshint.success) {
		    	return { message : 'JS much excellent success!', title : file.relative, sound: false};
		    }

		    var errors = file.jshint.results.map(function (data) {
		       	if (data.error) {
		        	return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
		        }
		    }).join("\n");
		    return { message : file.relative + " (" + file.jshint.results.length + " errors)\n" + errors, sound: "Frog", emitError : true, title : 'JSHint Error' };
    	}))
    	.pipe(reload({stream: true}));
});

// This does one final error check and creates a map file for production.
gulp.task('build:js', function () {
    return gulp.src( ['./src'+srcAssets+'/js/*.js'] )
   		.pipe(plumber({errorHandler: onError}))
		.pipe(jshint())
		.pipe(jshint.reporter('fail'))
		.pipe(notify(function (file) {
		    if (file.jshint.success) {
		        return { message : 'JS much excellent success!', title : file.relative, sound: false };
		    }
			var errors = file.jshint.results.map(function (data) {
		       	if (data.error) {
					return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
		       	}
		    }).join("\n");
			return { message : file.relative + " (" + file.jshint.results.length + " errors)\n" + errors, sound: "Frog", emitError: true, title : 'JSHint Error' };
    	}));
});




/*
	CSS TASKS
------------------------------------------------------*/

// Development CSS creation.
// Checks for errors and concats. Does not minify.
gulp.task('scss', function() {
    return gulp.src('./src'+srcAssets+'/scss/**/*.scss')
		.pipe(plumber({errorHandler: onError}))
		.pipe(sass())
		.on('error', notify.onError(function( err ){
				return { message: err.message, title : 'CSS Error', sound: "Frog"};
			})
		)
		.pipe(autoprefixer({browsers: ['last 2 versions', 'ie >= 8', '> 1%']}))
		.pipe(gulp.dest('./src'+srcAssets+'/css'))
		.on('error', notify.onError(function( err ){
				return { message: err.message, title : 'CSS Error', sound: "Frog"};
			})
		)
		.pipe(notify({ message: 'Styles much compiled success!', title : 'style.css', sound: false }))
		.pipe(reload({stream: true}));
});

// This does one final error check, creates a map file and compresses the css for production.
gulp.task('build:scss', function() {
    return gulp.src('./src'+srcAssets+'/scss/**/*.scss')
		.pipe(plumber({errorHandler: onError}))
		.pipe(sourcemaps.init())
		  .pipe(sass({outputStyle: 'compressed'}))
		.pipe(sourcemaps.write('../maps/css'))
		.pipe(gulp.dest(dest+destAssets+'/css'))
		.on('error', notify.onError(function( err ){
				return { message: err.message, title : 'CSS Error', sound: "Frog"};
			})
		)
		.pipe(autoprefixer({browsers: ['last 2 versions', 'ie >= 8', '> 1%']}))
		.pipe(gulp.dest(dest+destAssets+'/css'))
		.on('error', notify.onError(function( err ){
				return { message: err.message, title : 'CSS Error', sound: "Frog"};
			})
		)
		.pipe(notify({ message: 'Styles much compiled success!', title : 'style.css', sound: false }));
});



/*
	MAIN HTML and JS/CSS BUILDS
------------------------------------------------------*/

// This runs all the tasks for production.
gulp.task('build:app', ['html', 'images', 'svg', 'build:js', 'build:scss'], function () {

    //var assets = useref.assets();

    // Copy over the .htaccess file to the app folder
    gulp.src("./src/.htaccess")
		.pipe(gulp.dest(dest+"/"));

	// Copy over the crossdomain.xml file to the app folder
    gulp.src("./src/crossdomain.xml")
		.pipe(gulp.dest(dest+"/"));

	// Copy over the humans.txt file to the app folder
    gulp.src("./src/humans.txt")
		.pipe(gulp.dest(dest+"/"));

	// Copy over the robots.txt file to the app folder
    gulp.src("./src/robots.txt")
		.pipe(gulp.dest(dest+"/"));

	// Copy over your fonts
	gulp.src('./src'+srcAssets+'/fonts/**/*.{ttf,woff,woff2,eof,eot,svg}')
		.pipe(gulp.dest(dest+destAssets+'/fonts'));

	// Copy over the favicons
	gulp.src('./src/favicon.ico')
		.pipe(gulp.dest(dest+'/'));
	gulp.src('./src/favicon.png')
		.pipe(gulp.dest(dest+'/'));

	// Copy over any videos
	gulp.src('./src'+srcAssets+'/videos/**/*.{mp4,ogv,ogg,webm}')
		.pipe(gulp.dest(dest+destAssets+'/videos'));


    // This reads your included scripts on your html page, concats them and minifies them into one file.
    return gulp.src(['./src/*.html'])
    	.pipe(plumber({errorHandler: onError}))
        .pipe(useref({ }, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
            .pipe( gulpif('*.js', uglify() ))
	    .pipe(sourcemaps.write('.'+destAssets+'/maps'))
	    .on('error', notify.onError(function( err ){
				return { message: err.message, title : 'Build Error', sound: "Frog"};
			})
		)
        .pipe(gulp.dest(dest+'/'));

});




/*
	BOWER ASSETS
------------------------------------------------------*/

// Pulls some of the bower assets to the src folders.
// Add/modify as needed.
gulp.task('bower-assets', function(){

	// This copies the bower normalize css file over to the scss components folder.
	// If you updated normalize it will get updated in your app src on next [gulp serve].
	gulp.src("./src/bower/normalize.css/normalize.css")
		.pipe(rename("_normalize.scss"))
		.pipe(gulp.dest("./src"+srcAssets+"/scss/components/"));

	// Copies over animate.css from bower to scss components folder.
	gulp.src("./src/bower/animate.css/animate.css")
		.pipe(rename("_animate.scss"))
		.pipe(gulp.dest("./src"+srcAssets+"/scss/components/"));

});




/*
	COMMANDS
------------------------------------------------------

[gulp dev] - Development task

[gulp build] - Production task

*/

// gulp serve
gulp.task('dev', ['bower-assets'], function() {

	// injectChange = false forces browser refresh.
	// bsOptions.injectChanges = false;
	// Enables the external URLs for browserSync
	// bsOptions.xip = true;

    browserSync( bsOptions );

	// This first watch causes [gulp serve] to start very slow. Omit if needed.
	// The rest... watch the files and run the task(s).
    gulp.watch(["**/*.php","**/*.html"]).on("change", reload);
    gulp.watch("src"+srcAssets+"/scss/**/*.scss", ['scss']);
    gulp.watch(["src"+srcAssets+"/js/**/*.js"], ['js']);
    gulp.watch("src/**/*.html", ['html']);
});


// gulp build
gulp.task('build', ['build:app'], function(){
    gulp.src('').pipe(notify({ message: 'Built in '+dest, title : "Much build success!", sound: false }));
});
