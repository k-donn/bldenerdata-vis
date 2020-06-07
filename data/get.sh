#!/bin/sh

find . -name "*.json*" -delete
curl https://opendata.blender.org/snapshots/opendata-latest.zip -o latest.zip
unzip latest.zip
find README.txt LICENSE.txt latest.zip -delete

mv *.jsonl raw.jsonl
