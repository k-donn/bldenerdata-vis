# Blender OpenData visualization

This app compares two devices used for [Blender Foundation Benchmark Tool](https://opendata.blender.org/).

Input the device names into the fields and a visualization appears showing the render times for scenes for each device.

## Installation

[better-sqlite3](https://www.npmjs.com/package/better-sqlite3) must be installed to write to the database.

You must be using Node.js v10.20.1 or above. Prebuilt binaries of `better-sqlite3` are available for [LTS](https://nodejs.org/en/about/releases/) versions + Linux/OSX.

## Running

1.  `npm install`
2.  `npm run parse`
3.  `npm run serve`

[http://127.0.0.1:8080/](http://127.0.0.1:8080/)

## TODO
