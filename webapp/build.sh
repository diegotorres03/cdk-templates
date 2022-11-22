
mkdir dist
# rm -rf dist/*
# ls
browserify index.js -o package.bundle.js
cp index.html dist/index.html
cp package.bundle.js dist/package.bundle.js
cp main.js dist/main.js
ls dist

