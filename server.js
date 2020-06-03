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
		// TODO
		// Figure out how to use wildcards in prepared statements
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

			res.write(JSON.stringify(devices));
			res.end();
		});
	}
	if (parsedUrl.pathname === "/info") {
		res.writeHead(200, {
			"Content-Type": "application/json; charset=utf-8",
		});
		let queries = querystring.parse(parsedUrl.query);
		let benchmarks = {};
		let stmt = "SELECT * FROM `blender` WHERE `device` = ? OR `device` = ?";
		db.all(stmt, [queries.dev1, queries.dev2], (err, rows) => {
			if (err) {
				res.end();
				return console.error(err);
			}
			// Groups all the scene for each device under device name.
			let grouped = rows.reduce((acc, curr) => {
				if (!acc.hasOwnProperty(curr.device)) {
					acc[curr.device] = [];
				}
				acc[curr.device].push({
					scene: curr.scene,
					time: curr.time,
				});
				return acc;
			}, {});

			// The times for each scene for device1.
			let dev1Times = grouped[queries.dev1].reduce((acc, curr) => {
				if (!acc.hasOwnProperty(curr.scene)) {
					acc[curr.scene] = [];
				}
				acc[curr.scene].push(curr.time);
				return acc;
			}, {});

			// The times for each scene for device2.
			let dev2Times = grouped[queries.dev2].reduce((acc, curr) => {
				if (!acc.hasOwnProperty(curr.scene)) {
					acc[curr.scene] = [];
				}
				acc[curr.scene].push(curr.time);
				return acc;
			}, {});

			let dev1Avgs = {};
			for (let scene in dev1Times) {
				if (
					dev1Times.hasOwnProperty(scene) &&
					dev2Times.hasOwnProperty(scene)
				) {
					let sum = dev1Times[scene].reduce(
						(curr, acc) => curr + acc,
						0
					);
					let len = dev1Times[scene].length;
					dev1Avgs[scene] = sum / len;
				}
			}

			let dev2Avgs = {};
			for (let scene in dev2Times) {
				// Get common scenes
				if (
					dev1Times.hasOwnProperty(scene) &&
					dev2Times.hasOwnProperty(scene)
				) {
					let sum = dev2Times[scene].reduce(
						(curr, acc) => curr + acc,
						0
					);
					let len = dev2Times[scene].length;
					dev2Avgs[scene] = sum / len;
				}
			}

			let dev1 = queries.dev1;
			let dev2 = queries.dev2;

			benchmarks[dev1] = dev1Avgs;
			benchmarks[dev2] = dev2Avgs;

			res.write(JSON.stringify(benchmarks));
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
