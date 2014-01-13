var http = require("http");
var url = require("url");
var PORT = 8888;
var fs = require("fs");
var path = require("path");
var mime = require("./mime").types;
var config = require("./config");
var zlib = require("zlib");



function start() {
  function onRequest(request, response) {
	response.setHeader("Server", "NodeJS");

	var pathname = url.parse(request.url).pathname;
    var realPath = path.join("F:/moewiki/senchatests/senchaDemo", path.normalize(pathname.replace(/\.\./g, "")));
	console.log("require file : " + realPath);


    fs.exists(realPath, function (exists) {

        if (!exists) {

            response.writeHead(404, "Not Found", {'Content-Type': 'text/plain'});

            response.write("This request URL " + pathname + " was not found on this server.");

            response.end();

        } else {

            var ext = path.extname(realPath);

            ext = ext ? ext.slice(1) : 'unknown';

            var contentType = mime[ext] || "text/plain";

            response.setHeader("Content-Type", contentType);



            fs.stat(realPath, function (err, stat) {

                var lastModified = stat.mtime.toUTCString();

                var ifModifiedSince = "If-Modified-Since".toLowerCase();

                response.setHeader("Last-Modified", lastModified);



                if (ext.match(config.Expires.fileMatch)) {

                    var expires = new Date();

                    expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);

                    response.setHeader("Expires", expires.toUTCString());

                    response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);

                }



                if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {

                    response.writeHead(304, "Not Modified");

                    response.end();

                } else {

                    var raw = fs.createReadStream(realPath);

                    var acceptEncoding = request.headers['accept-encoding'] || "";

                    var matched = ext.match(config.Compress.match);



                    if (matched && acceptEncoding.match(/\bgzip\b/)) {

                        response.writeHead(200, "Ok", {'Content-Encoding': 'gzip'});

                        raw.pipe(zlib.createGzip()).pipe(response);

                    } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {

                        response.writeHead(200, "Ok", {'Content-Encoding': 'deflate'});

                        raw.pipe(zlib.createDeflate()).pipe(response);

                    } else {

                        response.writeHead(200, "Ok");

                        raw.pipe(response);

                    }

                }

            });

        }

    });

  }

  http.createServer(onRequest).listen(PORT);
  console.log("Server has started.");
}

exports.start = start;