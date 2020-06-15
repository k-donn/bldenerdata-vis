let fs = require("fs");
let readline = require("readline");

let fileStream = fs.createReadStream("./data/raw.jsonl");

async function processLines() {
	let res = [];

	let shown1 = false;
	let shown2 = false;
	let shown3 = false;
	// The file is a JSON-L file so it should be processed line-by-line
	let rl = readline.createInterface({
		input: fileStream,
	});

	for await (let line of rl) {
		let bench = JSON.parse(line);
		if (bench.schema_version === "v1" && !shown1) {
			shown1 = true;
			res.push(bench);
		}
		if (bench.schema_version === "v2" && !shown2) {
			shown2 = true;
			res.push(bench);
		}
		if (bench.schema_version === "v3" && !shown3) {
			shown3 = true;
			res.push(bench);
		}
	}

	return res;
}

(async () => {
	try {
		let selected = await processLines();
		console.log(JSON.stringify(selected));
	} catch (err) {
		console.error(err);
	}
})();
