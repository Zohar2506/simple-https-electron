const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const request = require('request');
const electron = require('electron')
const url = require('url')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow




// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', start)

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  start()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



let Q = null;

try {
    Q = require('Q');
} catch (err) {
    Q = require('q');
}

tmp.setGracefulCleanup();

function downloadFile(url, path) {
    const deferred = Q.defer();

    request(url, function (error, response, body) {
        if (error) {
            console.log('Failed to download Key', error);
            deferred.reject("Failed to download ", path);
        } else {
            fs.writeFile(path, body, function (error) {
                if (error) {
                    deferred.reject("Failed to write " + path)
                } else {
                    deferred.resolve(path)
                }
            });
        }
    });

    return deferred.promise;
}

function start(){
    const args = [
        process.cwd(),
        "--cors",
        "-a",
        "127.0.0.1",
        "-r"
    ];

    let f;

    if (process.argv.indexOf("--no-ssl") === -1) {
        let temp_dir = tmp.dirSync({ unsafeCleanup: true });

        const keyUrl = "https://get.rookout.com/localhost_privkey.pem";
        const certUrl = "https://get.rookout.com/localhost_certificate.pem";
        const keyPath = path.join(temp_dir.name, "key.pem");
        const certPath = path.join(temp_dir.name, "cert.pem");

        args.push("--ssl");
        args.push("--cert");
        args.push(certPath);
        args.push("--key");
        args.push(keyPath);

        f = Q.all([
            downloadFile(certUrl, certPath),
            downloadFile(keyUrl, keyPath)
        ]);
    } else {
        f = Q();
    }

    for (let arg of args) {
        process.argv.push(arg);
    }

    f.then(function () {
        // Run http-server with the layout in place
        const httpServer = require('http-server/bin/http-server');
    }).fail(function (error) {
        console.log("Error: ", error);
    });
}
