let http = require("http");
let querystring = require("querystring");
let url = require("url");
let fs = require("fs");
let Database = require("better-sqlite3");
let db = new Database("./data/blender-opendata.db", { verbose: console.info });

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
		let devices = [];

		let getDevices = db.prepare(
			"SELECT `device` FROM `blender` WHERE `device` LIKE ?"
		);

		let rows = getDevices.all(`%${queries.q}%`);
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
		let queries = querystring.parse(parsedUrl.query);

		if (queries.dev1 === queries.dev2) {
			res.writeHead(400, "Bad request", JSON_CONTENT);
			res.write(
				JSON.stringify({ error: "Cannot fetch identical devices" })
			);
			res.end();
			return;
		}

		let getDevices = db.prepare(
			"SELECT * FROM `blender` WHERE `device` = ? OR `device` = ?"
		);
		let rows = getDevices.all(queries.dev1, queries.dev2);

		if (rows.length === 0) {
			res.write(JSON.stringify({ error: "No results" }));
			res.end();
			return;
		}

		// We need to create a datatable where the columns correspond to devices and rows to scenes

		// TODO: refactor these to one that accepts string param
		let devEqual = (to) => (val) => val.device === to;
		let typeEqual = (to) => (val) => val.type === to;
		let sceneEqual = (to) => (val) => val.scene === to;
		let devType = (bench) => bench.type;

		// TODO: refactor to one statement that pushes together both arrays
		// then finds uniques in array
		let dev1Scenes = [
			...new Set(
				rows.filter(devEqual(queries.dev1)).map((bench) => bench.scene)
			),
		];
		let dev2Scenes = [
			...new Set(
				rows.filter(devEqual(queries.dev2)).map((bench) => bench.scene)
			),
		];
		let commonScenes = dev1Scenes.filter((scene) =>
			dev2Scenes.includes(scene)
		);

		// TODO: refactor same as above
		let dev1Types = [
			...new Set(rows.filter(devEqual(queries.dev1)).map(devType)),
		];
		let dev2Types = [
			...new Set(rows.filter(devEqual(queries.dev2)).map(devType)),
		];

		let dataFrame = {};

		for (let i = 0; i < commonScenes.length; i++) {
			let scene = commonScenes[i];
			dataFrame[scene] = [scene];

			// TODO: create an array of devices and iterate over it
			// Find types for device in the iteration of device array
			for (let dev1 = 0; dev1 < dev1Types.length; dev1++) {
				let type = dev1Types[dev1];

				// All benchmarks with this scene, device, and type
				let benchmarks = rows
					.filter(sceneEqual(scene))
					.filter(devEqual(queries.dev1))
					.filter(typeEqual(type));

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

			for (let dev2 = 0; dev2 < dev2Types.length; dev2++) {
				let type = dev2Types[dev2];

				// All benchmarks with this scene, device, and type
				let benchmarks = rows
					.filter(sceneEqual(scene))
					.filter(devEqual(queries.dev2))
					.filter(typeEqual(type));

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

		let header = ["Scene"];

		// Above can be refactored to include this
		for (let dev1 = 0; dev1 < dev1Types.length; dev1++) {
			let type = dev1Types[dev1];
			header.push(`${queries.dev1} (${type})`);
		}
		for (let dev2 = 0; dev2 < dev2Types.length; dev2++) {
			let type = dev2Types[dev2];
			header.push(`${queries.dev2} (${type})`);
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
