#!/bin/sh

curl https://opendata.blender.org/snapshots/opendata-latest.zip -o latest.zip
unzip latest.zip
find README.txt LICENSE.txt latest.zip -delete

mv *.jsonl raw.json
# Add first bracket and commas
sed -i '1s/^/[/g' raw.json
sed -i 's/$/,/g' raw.json
# delete last spare line and comma
sed -i '$d' raw.json
sed -i '$ s/.$//' raw.json
# put closing bracket
echo "]" >> raw.json

