#!/usr/bin/env node

const phantomjs = require('phantomjs-prebuilt');
var fs = require('fs');
var request = require('request');
const argv = require('minimist')(process.argv.slice(2));

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function(response) {
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
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function(err) { // Handle errors
        fs.unlinkSync(dest);
        return cb(err.message);
    });
};

const program = phantomjs.exec('phantomjs-arlo.js', argv.username, argv.password);
program.stdout.on('data', (data) => {
    // if (data[data.length - 1] == '\n') {
    //     data = data.substr(0, data.length - 1);
    // }
    console.log(`stdout: ${data}`);
    if (data[0] == 123) {
        try {
            var msg = JSON.parse(data);
            if (msg.success && typeof msg.url === 'string') {
                console.log("GOTS IT", msg);
                download(msg.url, argv.output, (err) => {
                    console.log("WE HERE", err);
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
    process.exit();
    // do something on end
})
