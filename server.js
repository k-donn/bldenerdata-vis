let corsAnywhere = require("cors-anywhere");
let http = require("http");
let querystring = require("querystring");
let url = require("url");
let fs = require("fs");
let sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./data/blender-opendata.sqlite3");

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
	let parsedUrl = url.parse(req.url);

	if (parsedUrl.pathname === "/") {
		fs.readFile("index.html", (err, body) => {
			if (err) {
				return console.error("Error reading file:", err);
			}
			res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
			res.write(body);
			res.end();
		});
	}
	if (parsedUrl.pathname === "/suggest") {
		res.writeHead(200, {
			"Content-Type": "application/json; charset=utf-8",
		});
		let queries = querystring.parse(parsedUrl.query);
		let devices = [];
		let stmt =
			"SELECT `device` FROM `blender` WHERE `device` LIKE '%" +
			queries.q +
			"%'";
		db.all(stmt, (err, rows) => {
			if (err) {
				res.end();
				return console.error(err);
			}
			let names = rows.map((row) => row.device);
			names = [...new Set(names)];
			names.forEach((row) => {
				let obj = { value: row };
				devices.push(obj);
			});
			console.log(devices);

			res.write(JSON.stringify(devices));
			res.end();
		});
	}
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
