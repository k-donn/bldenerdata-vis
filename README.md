# Blender OpenData visualization

This app compares two devices used for [Blender Benchmark](https://opendata.blender.org/).

Input the device names into the field and a visualization appears showing the render times for scenes for each device.

## Cloning

Must have [git-lfs](https://git-lfs.github.com/) configured.

## Running

1.  `npm install`
2.  `cd data`
3.  `./get/sh`
4.  `cd ..`
5.  `node parse.js`
6.  `node server.js`

## TODO

-   Create github workflow to pull latest data daily.
-   Create a publicPath system like WebPack, so requests from index.html go to the hosting server not localhost.
