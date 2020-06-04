# Blender OpenData visualization

This app compares two devices used for [Blender Benchmark](https://opendata.blender.org/).

Input the device names into the field and a visualization appears showing the render times for scenes for each device.

## Cloning

Must have [git-lfs](https://git-lfs.github.com/) configured.

## Running

1.  `cd data`
2.  `./get/sh`
3.  `cd ..`
4.  `npm install`
5.  `node server.js`

## TODO

-   Create a publicPath system like WebPack, so requests from index.html go to the hosting server not localhost.
