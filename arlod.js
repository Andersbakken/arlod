#!/usr/bin/env node

const phantomjs = require('phantomjs-prebuilt');
var fs = require('fs');
var request = require('request');
let argv = require('minimist')(process.argv.slice(2));

if (!argv.output) {
    if (!argv.dir) {
        argv.dir = ".";
    }
    argv.output = argv.dir + `/${new Date().toString()}.jpg`;

    try {
        var files = [];
        var size = 0;
        fs.readdirSync(argv.dir).forEach((file) => {
            if (file.substr(-4) === '.jpg') {
                // files.push({time: new Date(file.substr(0, file.length - 4)).valueOf(), file: file});
                files.push({file: file, stat: fs.statSync(argv.dir + "/" + file)});
                size += files[files.length - 1].stat.size;
                // var stat =
                // console.log("GOT STAT", stat);
            }
        });
        // console.log("GOT SIZE", size);
        if (size > 1024 * 1024 * 512) {
            files.sort(function(a, b) {
                return a.stat.ctimeMs - b.stat.ctimeMs;
            });
            var i = 0;
            while (i < files.length && size > 1024 * 1024 * 512) {
                // console.log("WOULD UNLINK", files[i].file);
                fs.unlinkSync(argv.dir + "/" + files[i].file);
                size -= files[i].stat.size;
                ++i;
            }
        }
        // console.log(files);
        // files.sort(

        // process.exit();
    } catch (err) {
        console.error("GOT AN ERROR");
    }
}

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function(response) {
        // console.log("GOT RESPONSE", response.statusCode);
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
        return undefined;
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlinkSync(dest);
        return cb(err.message);
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        // console.log("BALLS FINISHED");
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function(err) { // Handle errors
        fs.unlinkSync(dest);
        return cb(err.message);
    });
};

// download("https://arlos3-prod-z2.s3.amazonaws.com/5103011d_6ec6_4e8d_96c9_14b0050dcbf6/5RW2N-300-8866650/52M1817EB7562/fullFrameSnapshot.jpg?AWSAccessKeyId=AKIAICS2UAC4WFSD6C2A&Expires=1525754614&Signature=Pi6IybHaioeCRvA5WZ5llsLYCoc%3D", argv.output, function(err) {
//     console.log("GOT HERE", err);
// });

const program = phantomjs.exec(`${__dirname}/phantomjs-arlo.js`, argv.username, argv.password);
program.stdout.on('data', (data) => {
    // if (data[data.length - 1] == '\n') {
    //     data = data.substr(0, data.length - 1);
    // }
    // console.log(`stdout: ${data}`);
    if (data[0] == 123) {
        try {
            var msg = JSON.parse(data);
            if (msg.success && typeof msg.url === 'string') {
                // console.log("GOTS IT", msg);
                download(msg.url, argv.output, (err) => {
                    // console.log("WE HERE", err);
                    if (err) {
                        console.error("Failed to download image", err);
                        process.exit(1);
                    } else {
                        process.exit();
                    }
                });
            }
        } catch (err) {
            console.log("BAD", err.toString());
        }
    }
});

program.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

// program.stdout.pipe(program.stdout);
// program.stderr.pipe(process.stderr);
program.on('exit', code => {
    // console.log("Got exit", code);
    // process.exit();
    // do something on end
})
