# Blender OpenData visualization

This app compares two devices used for [Blender Foundation Benchmark Tool](https://opendata.blender.org/).

Input the device names into the fields and a visualization appears showing the render times for scenes for each device.

## Cloning

Must have [git-lfs](https://git-lfs.github.com/) configured.

## Running

1.  `npm install`
2.  `node parse.js`
3.  `node server.js`

[http://127.0.0.1:8080/](http://127.0.0.1:8080/)

## TODO

-   Expand front-end to be able to compare >2 devices.
