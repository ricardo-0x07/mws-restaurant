var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var browserSync = require('browser-sync').create();
var plugins = require('gulp-load-plugins')();
var autoprefixer = require('gulp-autoprefixer');
var gulpUtil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var eslint = require('gulp-eslint');
// var jasmine = require('gulp-jasmine');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var ghPages = require('gulp-gh-pages');
var mergeStream = require('merge-stream');
var del = require('del');
var runSequence = require('run-sequence');
var karma = require('karma');
var babelify = require('babelify');
var rename = require('gulp-rename');
var exit = require('gulp-exit');
var compress = require('compression');
var middleware = require('connect-gzip-static')('./dist');
var webp = require('gulp-webp');
var inlineCss = require('gulp-inline-css');
var gzip = require('gulp-gzip');


gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('copy', ['styles'], function() {
    return mergeStream(
        gulp.src('./*.html').pipe(gzip({ append: true })).pipe(gulp.dest('dist/')),
        gulp.src('*.xml').pipe(gulp.dest('dist/')),
        gulp.src('manifest.json').pipe(gulp.dest('dist/')),
        gulp.src('sw.js').pipe(gulp.dest('dist/')),
        gulp.src('img/*').pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
            .pipe(webp())
            .pipe(gulp.dest('dist/img')),
        gulp.src('idb/**/*').pipe(gulp.dest('dist/idb'))
    );
});

gulp.task('styles', function() {
    return sass('sass/**/*.scss', {
        style: 'compressed',
        sourcemap: true
    }).on('error', sass.logError)
        .pipe(plugins.sourcemaps.init())
        .pipe(autoprefixer({browsers: ['last 2 versions']
        }))
        .pipe(plugins.sourcemaps.write('./'))
        .pipe(gzip({ append: true }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream({match: '**/*.css'}));
});

function browserSyncInit() {
    browserSync.init({
        server: './dist',
        files: [
            './dist/js/*.js',
            './dist/js/*.js.map',
            './dist/**/*.js',
            './dist/**/*.js.map',
            './dist/css/*.css',
            './dist/css/*.css.map',
            './dist/**/*.css',
            './dist/**/*.css.map',
            './dist/*.html',
            './dist/**/*.html'
        ],
        port: 8000,
    }, function (err, bs) {
        bs.addMiddleware("*", middleware, {
            override: true
        });
    });
}

gulp.task('browserSync', browserSyncInit);

gulp.task('watch', ['browserSync'], function() {
    gulp.watch('sass/**/*.scss', ['styles']);
    gulp.watch('js/**/*.js', ['lint']);
    gulp.watch('sw.js', ['sw']);
    gulp.watch('*.html', ['copy-html']);
    gulp.watch('dist/index.html').on('change', browserSync.reload);
    gulp.watch('dist/restaurant.html').on('change', browserSync.reload);
});

gulp.task('sw', function() {
    gulp.src('sw.js').pipe(gulp.dest('dist/'));
});

gulp.task('copy-html', function() {
    gulp.src('./index.html').pipe(gzip({ append: true })).pipe(gulp.dest('./dist/'));
    gulp.src('./main.html').pipe(gulp.dest('./dist/'));
    gulp.src('./restaurant.html').pipe(gulp.dest('./dist/'));
    
});

gulp.task('lint', function() {
    return gulp.src(['js/**/*.js'])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
        .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
        .pipe(eslint.failOnError());
});


gulp.task('deploy', function() {
    return gulp.src('./dist/**/*')
        .pipe(ghPages());
});

// var b = browserify({
//     entries: ['./js/main.js'],
//     cache: {},
//     packageCache: {},
//     plugin: [watchify],
//     debug: true
// });

// gulp.task('js', bundle); // so you can run `gulp js` to build the file
// b.on('update', bundle); // on any dep update, runs the bundler
// b.on('log', gulpUtil.log); // output build logs to terminal

// function bundle() {
//     return b.bundle()
//     // log errors if they happen
//     // .on('error', gulpUtil.log.bind(gulpUtil, 'Browserify Error'))
//         .on('error', function(err) {
//             gulpUtil.log(err.message);
//             browserSync.notify("Browserify Error!");
//             this.emit("end");
//         })
//         .pipe(source('bundle.js'))
//     // optional, remove if you don't need to buffer file contents
//         .pipe(buffer())
//     // optional, remove if you dont want sourcemaps
//         .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
//     // Add transformation tasks to the pipeline here.
//         .pipe(uglify())
//         .on('error', function (err) {
//             console.log('err: ', err)
//             gulpUtil.log(gulpUtil.colors.red('[Error]'), err.toString());
//         })
//         .pipe(sourcemaps.write('./')) // writes .map file
//         // .pipe(gzip({ append: true }))
//         .pipe(gulp.dest('dist/'))
//         .pipe(browserSync.stream());
// }
function compile_main(watch) {
    var bundler = watchify(browserify('js/main.js', {debug: true}).transform(babelify, {
        // Use all of the ES2015 spec
        presets: ["es2015", 'es2017'],
        sourceMaps: true
    }));

    function rebundle() {
        return bundler
            .bundle()
            .on('error', function (err) {
                console.error(err);
                this.emit('end');
            })
            .pipe(source('bundle_main.js'))
            .pipe(buffer())
            .pipe(rename('index_main.min.js'))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gzip({ append: true }))
            .pipe(gulp.dest('./dist/js'));
    }

    if (watch) {
        bundler.on('update', function () {
            console.log('-> bundling...');
            rebundle();
        });

        rebundle();
    } else {
        rebundle().pipe(exit());
    }
}

function watch_main() {
    return compile_main(true);
}

gulp.task('build_main', function () {
    return compile_main();
});
gulp.task('watch_main', function () {
    return watch_main();
});

function compile_restaurant_info(watch) {
    var bundler = watchify(browserify('js/restaurant_info.js', {debug: true}).transform(babelify, {
        // Use all of the ES2015 spec
        presets: ["es2015"],
        sourceMaps: true
    }));

    function rebundle() {
        return bundler
            .bundle()
            .on('error', function (err) {
                console.error(err);
                this.emit('end');
            })
            .pipe(source('bundle_restaurant_info.js'))
            .pipe(buffer())
            .pipe(rename('index_restaurant_info.min.js'))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./dist/js'));
    }

    if (watch) {
        bundler.on('update', function () {
            console.log('-> bundling...');
            rebundle();
        });

        rebundle();
    } else {
        rebundle().pipe(exit());
    }
}

function watch_restaurant_info() {
    return compile_restaurant_info(true);
}

gulp.task('build_restaurant_info', function () {
    return compile_restaurant_info();
});
gulp.task('watch_restaurant_info', function () {
    return watch_restaurant_info();
});

// Build the "dist" folder by running all of the above tasks
gulp.task('build', function() {
    runSequence('clean', ['styles', 'lint', 'build_main', 'copy']);
});

gulp.task('serve', function(callback) {
    runSequence('clean', ['lint', 'watch_main', 'copy'], ['browserSync', 'watch'], callback);
});

// Build the site, serve files, and watch for file changes
gulp.task('default', ['serve']);

// starts to serve production files
// runs the build task before, 
// and serves the dist folder does not watch for file changes
gulp.task('serve:dist', function() {
    runSequence('clean', ['styles', 'lint', 'build_main', 'copy'], ['browserSync']);
});
