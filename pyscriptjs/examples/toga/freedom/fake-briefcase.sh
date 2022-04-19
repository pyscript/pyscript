#!/bin/sh

mkdir -p ../server/static/wheels
cd src
unzip ../base-wheel.zip
zip ../../server/static/wheels/freedom-0.0.1-py3-none-any.whl -r freedom*
rm -rf freedom-0.0.1.dist-info
