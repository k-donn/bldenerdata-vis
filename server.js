let corsAnywhere = require("cors-anywhere");
let http = require("http");
let fs = require("fs");

// Listen on a specific host via the HOST environment variable
let host = process.env.HOST || "0.0.0.0";
// Listen on a specific port
let corsPort = 8080;
// Listen on a specific port via the PORT environment variable
let port = process.env.PORT || 5500;

let corsServer = corsAnywhere.createServer({
	originWhitelist: [], // Allow all origins
	requireHeader: ["origin", "x-requested-with"],
	removeHeaders: ["cookie", "cookie2"],
});

corsServer.listen(corsPort, host, () => {
	console.log("Running CORS Anywhere on " + host + ":" + corsPort);
});

let server = http.createServer((req, res) => {
	fs.readFile("index.html", (err, body) => {
		if (err) {
			console.error("Error reading file:", err);
		}
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.write(body);
		res.end();
	});
});

server.listen(port, host, () => {
	console.log("Running web server on " + host + ":" + port);
});

process.on("SIGINT", () => {
	server.close(() => {
		console.log("Closed webserver");
	});
	corsServer.close(() => {
		console.log("Closed CORS server");
	});
});
