let fs = require("fs");
let raw = require("./data/raw.json");

let Database = require("better-sqlite3");
let db = new Database("./data/blender-opendata.db");

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
					device:
						benchmark.schema_version === "v1"
							? benchmark.data.device_info.compute_devices[0]
							: benchmark.data.device_info.compute_devices[0]
									.name,
					scene: scene.name,
					time: scene.stats.total_render_time,
				});
			}
		});
	} else {
		let launches = benchmark.data;
		launches.forEach((run) => {
			res.push({
				device: run.device_info.compute_devices[0].name,
				scene: run.scene.label,
				time: run.stats.total_render_time,
			});
		});
	}

	return res;
});

try {
	fs.writeFile("./data/parsed.json", JSON.stringify(sceneTimes), () => {
		console.log("Wrote parsed file.");
	});
} catch (err) {
	console.log("Error writing parsed file:", err);
}

let createTable = db.prepare(
	`CREATE TABLE IF NOT EXISTS blender (
		device TEXT,
		scene TEXT,
		time REAL
	)`
);
createTable.run();
let deleteRows = db.prepare(`DELETE FROM blender`);
deleteRows.run();
let putRow = db.prepare("INSERT INTO blender VALUES (?,?,?)");

let insert = db.transaction((trials) => {
	for (let trial of trials) {
		putRow.run(trial["device"], trial["scene"], trial["time"]);
	}
});

let start = new Date().getTime();
insert(sceneTimes);
console.log(
	`Wrote ${sceneTimes.length} rows to db in ${new Date().getTime() - start}ms`
);
