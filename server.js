let http = require("http");
let querystring = require("querystring");
let url = require("url");
let fs = require("fs");
let Database = require("better-sqlite3");
let db = new Database("./data/blender-opendata.db");

// Listen on a specific host via the HOST environment variable
let host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
let port = process.env.PORT || 8080;

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
		let getDevices = db.prepare(
			"SELECT `device` FROM `blender` WHERE `device` LIKE '%" +
				queries.q +
				"%'"
		);
		let rows = getDevices.all();
		let names = rows.map((row) => row.device);
		names = [...new Set(names)];
		names.forEach((row) => {
			let obj = { value: row };
			devices.push(obj);
		});

		res.write(JSON.stringify(devices));
		res.end();
	}
	if (parsedUrl.pathname === "/info") {
		res.writeHead(200, {
			"Content-Type": "application/json; charset=utf-8",
		});
		let queries = querystring.parse(parsedUrl.query);
		let benchmarks = {};
		let getDevices = db.prepare(
			"SELECT * FROM `blender` WHERE `device` = ? OR `device` = ?"
		);
		let rows = getDevices.all(queries.dev1, queries.dev2);
		// Groups all the scene for each device under device name.
		let grouped = rows.reduce((acc, curr) => {
			// Go through the data and make an object for each device
			if (!acc.hasOwnProperty(curr.device)) {
				acc[curr.device] = [];
			}
			// Append to that object an array of objects corresponding to trials
			acc[curr.device].push({
				scene: curr.scene,
				time: curr.time,
			});
			return acc;
		}, {});

		// The times for each scene for device1.
		let dev1Times = grouped[queries.dev1].reduce((acc, curr) => {
			// Create an object where each key is a scene-name
			if (!acc.hasOwnProperty(curr.scene)) {
				acc[curr.scene] = [];
			}
			// The value is the array of all times recorded for that scene-name
			acc[curr.scene].push(curr.time);
			return acc;
		}, {});

		// The times for each scene for device2.
		let dev2Times = grouped[queries.dev2].reduce((acc, curr) => {
			// Create an object where each key is a scene-name
			if (!acc.hasOwnProperty(curr.scene)) {
				acc[curr.scene] = [];
			}
			// The value is the array of all times recorded for that scene-name
			acc[curr.scene].push(curr.time);
			return acc;
		}, {});

		// Average the arrays part of dev1Times keys
		let dev1Avgs = {};
		for (let scene in dev1Times) {
			// Make sure both devices have the scene
			if (
				dev1Times.hasOwnProperty(scene) &&
				dev2Times.hasOwnProperty(scene)
			) {
				// Sum all the values part of this one key
				let sum = dev1Times[scene].reduce((curr, acc) => curr + acc, 0);
				let len = dev1Times[scene].length;
				dev1Avgs[scene] = sum / len;
			}
		}

		// Average the arrays part of dev2Times keys
		let dev2Avgs = {};
		for (let scene in dev2Times) {
			// Make sure both devices have the scene
			if (
				dev1Times.hasOwnProperty(scene) &&
				dev2Times.hasOwnProperty(scene)
			) {
				// Sum all the values part of this one key
				let sum = dev2Times[scene].reduce((curr, acc) => curr + acc, 0);
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
	}
});

server.listen(port, host, () => {
	console.log("Running web server on " + host + ":" + port);
});

process.on("SIGINT", () => {
	server.close(() => {
		console.log("Closed webserver");
	});
});
