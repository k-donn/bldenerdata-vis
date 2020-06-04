let parsed = require("./data/parsed.json");
let raw = require("./data/raw.json");

console.log(raw.length);
console.log(parsed.length)

// parsed.forEach((trial, i) => {
// 	if (
// 		!(
// 			trial.hasOwnProperty("device") ||
// 			trial.hasOwnProperty("scene") ||
// 			trial.hasOwnProperty("time")
// 		)
// 	) {
// 		console.log("Error in parsed JSON");
// 		console.log(JSON.stringify(trial));
// 		console.log(i);
// 	}
// });

// let shown1 = false;
// let shown2 = false;
// let shown3 = false;
// raw.forEach((trial, i) => {
	// if (trial.schema_version === "v1" && !shown1) {
	// 	shown1 = true;
	// 	console.log(JSON.stringify(trial));
	// }
	// if (trial.schema_version === "v2" && !shown2) {
	// 	shown2 = true;
	// 	console.log(JSON.stringify(trial));
	// }
	// if (trial.schema_version === "v3" && !shown3) {
	// 	shown3 = true;
	// 	console.log(JSON.stringify(trial));
	// }

// 	if (trial.schema_version === "v1" || trial.schema_version === "v2") {
// 		trial.data.scenes.forEach((scene) => {
// 			let stats = scene.stats;
// 			if (stats.result === "OK") {
// 				if (!stats.hasOwnProperty("total_render_time")) {
// 					console.log("Error in raw JSON v1/2");
// 					console.log(JSON.stringify(trial));
// 					console.log(i);
// 				}
// 			}
// 		});
// 	}
// });
