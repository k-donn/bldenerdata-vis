#!/bin/sh

echo "Deleting old json*"
find . -name "*.json*" -delete

echo "Downloading new raw json*"
curl https://opendata.blender.org/snapshots/opendata-latest.zip -o latest.zip

echo "Uncompressing"
unzip latest.zip -x LICENSE.txt README.txt

echo "Tidying up"

find . -name "opendata-*.jsonl"
echo "->"
echo "./raw.jsonl"
mv *.jsonl raw.jsonl

find latest.zip -delete
