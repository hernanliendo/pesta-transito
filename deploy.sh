#!/bin/bash

rm -fR build/
npm run build
cd build/
git checkout -- .
firebase deploy
cd ../
