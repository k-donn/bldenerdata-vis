let http = require("http");
let querystring = require("querystring");
let url = require("url");
let fs = require("fs");
let Database = require("better-sqlite3");
let db = new Database("./data/blender-opendata.db", { verbose: logInfo });

// Listen on a specific host via the HOST environment variable
let host = process.env.HOST || "127.0.0.1";
// Listen on a specific port via the PORT environment variable
let port = process.env.PORT || 8080;

let JSON_CONTENT = {
	"Content-Type": "application/json; charset=utf-8",
};

let TEXT_CONTENT = {
	"Content-Type": "text/plain; charset=utf-8",
};

let server = http.createServer((req, res) => {
	let parsedUrl = url.parse(req.url);

	if (parsedUrl.pathname === "/") {
		fs.readFile("index.html", "utf-8", (err, body) => {
			if (err) {
				res.writeHead(500, "File Problem", TEXT_CONTENT);
				res.write("Server file read error");
				res.end();
				return console.error("Error reading file:", err);
			}

			res.writeHead(200);
			res.write(body);
			res.end();
		});
	}

	if (parsedUrl.pathname === "/suggest") {
		res.writeHead(200, JSON_CONTENT);

		let queries = querystring.parse(parsedUrl.query);
		let suggestions = [];

		let getDevices = db.prepare(
			"SELECT `device` FROM `blender` WHERE `device` LIKE ?"
		);

		let rows = getDevices.all(`%${queries.q}%`);
		let names = rows.map((row) => row.device);

		names = [...new Set(names)];
		names.forEach((row) => {
			let obj = { value: row };
			suggestions.push(obj);
		});

		res.write(JSON.stringify(suggestions));
		res.end();
	}

	if (parsedUrl.pathname === "/info") {
		let queries = querystring.parse(parsedUrl.query);
		let devices = Object.values(queries);

		let tooFew = devices.length < 1;
		let duplicates = devices.length !== new Set(devices).size;
		if (tooFew || duplicates) {
			res.writeHead(400, "Bad request", JSON_CONTENT);
			res.write(
				JSON.stringify({
					error: tooFew
						? "Too few devices requested"
						: "Cannot fetch identical devices",
				})
			);
			res.end();
			return;
		}

		let getDevices = db.prepare(
			"SELECT * FROM `blender` WHERE `device` = ?" +
				" OR `device` = ?".repeat(devices.length - 1)
		);
		let rows = getDevices.all(...devices);

		if (rows.length === 0) {
			res.write(JSON.stringify({ error: "No results" }));
			res.end();
			return;
		}

		// We need to create a datatable where the columns correspond to devices and rows to scenes

		let equalProp = (prop) => (val) => (obj) => obj[prop] === val;
		let devType = (bench) => bench.type;
		let prop = (prop) => (obj) => obj[prop];

		// Find the unqiue scenes for each device then add frequency to hash-map
		let sceneFreq = {};
		for (let device of devices) {
			let deviceScenes = [
				...new Set(
					rows.filter(equalProp("device")(device)).map(prop("scene"))
				),
			];
			for (let scene of deviceScenes) {
				if (!sceneFreq[scene]) {
					sceneFreq[scene] = 1;
				} else {
					sceneFreq[scene] += 1;
				}
			}
		}

		// Find scenes whose frequency is equal to the number of devices
		let commonScenes = [];
		for (let scene in sceneFreq) {
			if (sceneFreq.hasOwnProperty(scene)) {
				let freq = sceneFreq[scene];
				if (freq === devices.length) {
					commonScenes.push(scene);
				}
			}
		}

		let devicesTypes = {};
		for (const device of devices) {
			devicesTypes[device] = [
				...new Set(
					rows.filter(equalProp("device")(device)).map(devType)
				),
			];
		}

		console.group(`Info request for ${devices.length} device(s)`);
		console.info(devices);
		console.info(devicesTypes);
		console.info(commonScenes);
		console.groupEnd();

		let dataFrame = {};
		let header = ["Scene"];

		// Go row by row for each scene, append the data for each device-type combo
		for (let i = 0; i < commonScenes.length; i++) {
			let scene = commonScenes[i];
			dataFrame[scene] = [scene];

			// Iterate through all the device-type values for this scene
			for (let device in devicesTypes) {
				if (devicesTypes.hasOwnProperty(device)) {
					let types = devicesTypes[device];
					for (let type of types) {
						// All benchmarks with this scene, device, and type
						let benchmarks = rows
							.filter(equalProp("scene")(scene))
							.filter(equalProp("device")(device))
							.filter(equalProp("type")(type));

						if (benchmarks.length === 0) {
							dataFrame[scene].push(0);
						} else {
							let timeSum = benchmarks.reduce(
								(acc, curr) => acc + curr.time,
								0
							);

							dataFrame[scene].push(timeSum / benchmarks.length);
						}
					}
				}
			}
		}

		// Make the header to describe the data
		for (let device in devicesTypes) {
			if (devicesTypes.hasOwnProperty(device)) {
				let types = devicesTypes[device];

				for (let type of types) {
					header.push(`${device} (${type})`);
				}
			}
		}

		let perfValues = Object.values(dataFrame);

		res.writeHead(200, JSON_CONTENT);
		res.write(JSON.stringify([header, ...perfValues]));
		res.end();
	}

	if (parsedUrl.pathname === "/random/device") {
		res.writeHead(200, JSON_CONTENT);
		let randomDev = db.prepare(
			"SELECT `device` FROM `blender` ORDER BY RANDOM() LIMIT 1;"
		);

		res.write(JSON.stringify(randomDev.get()));
		res.end();
	}
});

server.listen(port, host, () => {
	console.log(`Running web server on http://${host}:${port}/`);
});

process.on("SIGINT", () => {
	server.close(() => {
		console.log("Closed webserver");
	});
});

function logInfo(params) {
	console.group(`Incoming request`);
	console.log(params);
	console.groupEnd();
}
