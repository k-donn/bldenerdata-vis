let sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./data/blender-opendata.sqlite3");
let fs = require("fs");

let benchmarks = JSON.parse(
	fs.readFileSync("./data/opendata-2020-05-25-062840+0000.json")
);

let sceneTimes = benchmarks.flatMap((benchmark) => {
	let res = [];
	if (
		benchmark.schema_version === "v1" ||
		benchmark.schema_version === "v2"
	) {
		benchmark.data.scenes.forEach((scene) => {
			let time;
			if (scene.stats.total_render_time !== undefined) {
				time = scene.stats.total_render_time;
			} else if (scene.stats.render_time_no_sync !== undefined) {
				time = scene.stats.render_time_no_sync;
			} else if (scene.stats.pipeline_render_time !== undefined) {
				time = scene.stats.pipeline_render_time;
			} else {
				return;
			}
			res.push({
				device: benchmark.data.device_info.compute_devices[0],
				scene: scene.name,
				time: time,
			});
		});
	} else {
		benchmark.data.forEach((run) => {
			res.push({
				device: run.device_info.compute_devices[0].name,
				scene: run.scene.label,
				time: run.stats.total_render_time,
			});
		});
	}

	return res;
});

fs.writeFileSync("./data/parsed.json", JSON.stringify(sceneTimes));
let len = sceneTimes.length;

function insert(i) {
	console.log(`${i}/${len}`);

	let stmt = db.prepare("INSERT INTO blender VALUES (?,?,?)");
	let row = sceneTimes[i];
	stmt.run(row["device"], row["scene"], row["time"]);
	stmt.finalize((err) => {
		if (err) {
			return console.error("Error occurred writing: ", err);
		}
		if (i < len - 1) {
			insert(i + 1);
		}
	});
}

db.run(
	`CREATE TABLE blender (
	device TEXT,
	scene TEXT,
	time INTEGER
)`,
	(err) => {
		if (err) {
			return console.error("Error creating table: ", err);
		}
		insert(0);
	}
);
