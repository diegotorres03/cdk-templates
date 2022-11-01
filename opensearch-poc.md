

## What is the problem you are trying to solve?
- prevent code duplucation.
- prevent tightly coupled code.
- speed up development process
  - when a dev needs a functionallity there are to options:
    - write it and risk repeating code.
    - search similar functionallity on company projects (if the company has a repo) or look in to public repositories like npm.
- encourage code reusability and conde documentation
  - if documentation is crucial for code to be indexed, this will add an extra value for documentation, now it not only will be developer reference, it will also be used to search for functions.
- encourage cross team collaboration:
  - if code can be easily found, there will be a high chance the developer will want to reuse instead of re-write.


## How big is the problem? How many developers do you think will have such a need?


## What are the alternatives available today?
- using the find functionallity on the IDE to look for similar functions.
- Google and use StackOverflow answers or similar forum answers
- look for that functionallity on public package repositories


## At a high level, how would you describe the solution?
I will open my code editor, and i will open a comment where I will type what I'm looking for like this: `// get items from dynamodb` this will look for functions that have that text.

```js

/**
 * Get an item from a Dynamodb table
 */
function getItemFromDB(key){
    return dynamo.get({TableName: 'test', Key: key}).promise()
}

/**
 * this function is used to get a single item form a dynamo table
 */
function getItem(key){
    return dynamo.get({TableName: 'test', Key: key}).promise()
}

/**
 * get one record from dynamo
 */
const otherGetItem = (key) => {
    return dynamo.get({TableName: 'test', Key: key}).promise()
}

```