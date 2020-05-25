let cors_proxy = require("cors-anywhere");
let http = require("http");
let fs = require("fs");

// Listen on a specific host via the HOST environment variable
let host = process.env.HOST || "0.0.0.0";
// Listen on a specific port
let corsPort = 8080;
// Listen on a specific port via the PORT environment variable
let port = process.env.PORT || 5500;

cors_proxy
	.createServer({
		originWhitelist: [], // Allow all origins
		requireHeader: ["origin", "x-requested-with"],
		removeHeaders: ["cookie", "cookie2"],
	})
	.listen(corsPort, host, () => {
		console.log("Running CORS Anywhere on " + host + ":" + corsPort);
	});

http.createServer((req, res) => {
	fs.readFile("index.html", (err, body) => {
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.write(body);
		res.end();
	});
}).listen(port, host, () => {
	console.log("Running web server on " + host + ":" + port);
});
