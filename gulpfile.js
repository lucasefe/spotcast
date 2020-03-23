var gulp = require("gulp"),
    gutil = require("gulp-util"),
    mocha = require("gulp-mocha"),
    sequence = require("run-sequence"),
    ts = require("gulp-typescript"),
    tslint = require("gulp-tslint");

var mochaRun = function () {
    return gulp.src("test/**/*.js", { read: false })
        .pipe(mocha({ timeout: 10000, reporter: "list" }))
        .on("error", gutil.log);
};

gulp.task("mocha", function () {
    return mochaRun();
});


var project = ts.createProject("./tsconfig.json");

gulp.task("ts", function () {
    return project
        .src()
        .pipe(tslint({ formatter: "stylish" }))
        .pipe(tslint.report({ summarizeFailureOutput: true }))
        .pipe(project())
        .js
        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
})

gulp.task("mocha:dev", gulp.series("ts", function (callback) {
    gulp.watch("src/server/**/*.ts", function () {
        sequence("ts", "mocha");
    });
    mochaRun();
}));

gulp.task("mocha:travis", gulp.series("ts", function (callback) {
    if (process.env.TRAVIS) {
        return mochaRun();
    }
    else {
        gutil.log(gutil.colors.bgRed("Fatal error. CI tests will run only in TRAVIS environment"));
    }
}));