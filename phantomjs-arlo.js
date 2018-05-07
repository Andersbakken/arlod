/* global WebPage, phantom, waitFor */

var system = require('system');
var username = system.args[1];
var password = system.args[2];

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    // console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    // console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

var page = new WebPage();
page.onConsoleMessage = function(msg) {
    // console.log("BROWSER", msg);
};

page.viewportSize = {
    width: 1920,
    height: 1080
};

// var idx = 0;
// setInterval(function() {
//     console.log("Rendering image", idx);
//     page.render("/tmp/arlo_" + idx++ + ".png");
// }, 1000);

page.onResourceRequested = function(resource) {
    // console.log("GOT RESOURCE", resource.url);
};
page.open("https://arlo.netgear.com/#/login", function(status) {
    // console.log("Got login page");
    // console.log("GOT PAGE LOADED");
    page.evaluate(function(username, password) {
        // console.log("BALLS BALLS BALLS", username, password);
        document.getElementById('userId').value = username;
        document.getElementById('password').value = password;
        document.getElementById('loginButton').click();
    }, username, password);
    // console.log("FUCK FUCK FUCK", username, password);
    waitFor(function check() {
        return page.evaluate(function () {
            return !!document.getElementById("cameras_settings_52M1817EB7562");
        });

    }, function onReady() {
        // console.log("Logged in, waiting for settings");
        page.evaluate(function() { document.getElementById('cameras_settings_52M1817EB7562').click(); });
        waitFor(function check() {
            // console.log("DIVS", page.evaluate(function() { return document.getElementsByClassName('settings-link-row arlo-cp').length; }));
            return page.evaluate(function () {
                var divs = document.getElementsByClassName('settings-link-row arlo-cp');
                // console.log("DIVS", divs.length);
                for (var i=0; i<divs.length; ++i) {
                    // console.log(i, divs[i].firstChild.textContent);
                    if (divs[i].firstChild.textContent == 'Video Settings')
                        return true;
                }
                return false;
            });

        }, function onReady() {
            // console.log("Gon click");
            page.evaluate(function () {
                var divs = document.getElementsByClassName('settings-link-row arlo-cp');
                if (divs) {
                    for (var i=0; i<divs.length; ++i) {
                        if (divs[i].firstChild.textContent == 'Video Settings') {
                            divs[i].click();
                            break;
                        }
                    }
                }
            });
            waitFor(function check() {
                // console.log("SHIT");
                // console.log("LIST", page.evaluate(function() { return document.getElementsByClassName('activity-zones-control snapshot arlo-cp').length; }));
                return page.evaluate(function () {
                    var list = document.getElementsByClassName("activity-zones-control snapshot arlo-cp");
                    // console.log("CHECKING FOR SNAPSHOT", list.length);
                    for (var i=0; i<list.length; ++i) {
                        // console.log(i, list[i].firstChild.textContent, list[i].getAttribute("disabled"));
                        if (list[i].firstChild.textContent == 'Snapshot' && !list[i].getAttribute("disabled")) {
                            // console.log("snapshot is available");
                            return true;
                        }
                    }
                    return false;
                });
            }, function onReady() {
                var list = document.getElementsByClassName("activity-zones-control snapshot arlo-cp");
                for (var i=0; i<list.length; ++i) {
                    // console.log(i, list[i].firstChild.textContent);
                    if (list[i].firstChild.textContent == 'Snapshot') {
                        // console.log("clicking snapshot");
                        list[i].click();
                    }
                }
                setTimeout(function() {
                    waitFor(function check() {
                        // console.log("SHIT");
                        // console.log("LIST", page.evaluate(function() { return document.getElementsByClassName('activity-zones-control snapshot arlo-cp').length; }));
                        return page.evaluate(function () {
                            var list = document.getElementsByClassName("activity-zones-control snapshot arlo-cp");
                            // console.log("CHECKING FOR SNAPSHOT AGAIN", list.length);
                            for (var i=0; i<list.length; ++i) {
                                // console.log(i, list[i].firstChild.textContent);
                                if (list[i].firstChild.textContent == 'Snapshot' && !list[i].getAttribute("disabled")) {
                                    // console.log("snapshot is available");
                                    return true;
                                }
                            }
                            return false;
                        });
                    }, function onReady() {
                        var url = page.evaluate(function() {
                            var canvas = document.getElementById('activityZonesCanvas');
                            return canvas.getAttribute('image-url');
                        });
                        console.log(JSON.stringify({url: url, success: true}));
                        phantom.exit();
                    }, 60000);
                }, 2000);
            }, 60000);
        }, 60000);
    }, 60000); // some timeout
    // console.log("NOT HERE");
});
