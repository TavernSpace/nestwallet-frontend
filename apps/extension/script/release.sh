#!/bin/bash

rm -rf dist
rm -rf web-build
rm nestwallet.zip

echo "Building extension..."
yarn version --patch
yarn build

echo "Packaging extension..."
mv web-build dist
zip -r nestwallet.zip dist

rm -rf dist
