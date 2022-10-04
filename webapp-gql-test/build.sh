echo "building..."
cp index.html ./dist/index.html
browserify gql-test.js -o ./dist/bundle.js