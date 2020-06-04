let sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./data/blender-opendata2.sqlite3");
// let Database = require("better-sqlite3");
// let db = new Database("./data/blender-opendata2.db", { verbose: console.log });
let fs = require("fs");

let raw = require("./data/raw.json");

let sceneTimes = raw.flatMap((benchmark) => {
	let res = [];
	if (
		benchmark.schema_version === "v1" ||
		benchmark.schema_version === "v2"
	) {
		let scenes = benchmark.data.scenes;
		scenes.forEach((scene) => {
			if (scene.stats.result === "OK") {
				res.push({
					device: benchmark.data.device_info.compute_devices[0],
					scene: scene.name,
					time: scene.stats.total_render_time,
				});
			}
		});
	} else {
		let launches = benchmark.data;
		launches.forEach((run) => {
			if (run.stats.result === "OK") {
				res.push({
					device: run.device_info.compute_devices[0].name,
					scene: run.scene.label,
					time: run.stats.total_render_time,
				});
			}
		});
	}

	return res;
});

fs.writeFileSync("./data/parsed.json", JSON.stringify(sceneTimes));

db.run(
	`CREATE TABLE blender (
		device TEXT,
		scene TEXT,
		time INTEGER
		)`,
	(err) => {
		let STMT = db.prepare("INSERT INTO blender VALUES (?,?,?)");
		function insertOld(trial) {
			return new Promise((res, rej) => {
				STMT.run(
					[trial["device"], trial["scene"], trial["time"]],
					(err) => {
						if (err) {
							rej(err);
						}
						res();
					}
				);
			});
		}
		if (err) {
			return console.error(err);
		}

		let start = new Date().getTime();
		Promise.all(sceneTimes.map(insertOld)).then(() => {
			console.log(
				"Wrote to database in " + (new Date().getTime() - start) + "ms"
			);
		});
	}
);

// db.prepare(
// 	`CREATE TABLE blender (
// 		device TEXT,
// 		scene TEXT,
// 		time INTEGER
// 		)`
// ).run();
// let stmt = db.prepare("INSERT INTO blender VALUES (?,?,?)");

// let insert = db.transaction((trials) => {
// 	for (let trial of trials) {
// 		stmt.run(trial["device"], trial["scene"], trial["time"]);
// 	}
// });

// insert(sceneTimes);
