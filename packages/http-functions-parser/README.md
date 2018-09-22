# http-functions-parser &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wix-incubator/http-functions/blob/master/LICENSE) [![Build Status](https://travis-ci.org/wix-incubator/http-functions.svg?branch=master)](https://travis-ci.org/wix-incubator/http-functions)

A powerful object to json serializer/deserializer. In addition to the standard json data types (Number, String, Boolean, Array, Object & Null), this module helps you also to serialize & deserialize more advanced data types such as: Date, RegExp  & Error objects.

## How to use

```sh
$ npm install --save http-functions-parser
```

```js
const { toJSON, fromJSON } = require('http-functions-parser');

const originalObj = {
  aNumber: 5,
  aSrting: 'hello',
  aBoolean: true,
  aDate: new Date(),
  aRegExp: /aaa/i,
  aError: new Error('message')
};

const str = JSON.stringify(toJSON(originalObj), null, 2);
console.log(str);
// {
//   "aNumber": 5,
//   "aSrting": "hello",
//   "aBoolean": true,
//   "aDate": {
//     "___http-functions-class___": "Date",
//     "json": "2018-09-21T23:21:02.149Z"
//   },
//   "aRegExp": {
//     "___http-functions-class___": "SerializableRegExp",
//     "json": {
//       "source": "aaa",
//       "flags": "i",
//       "lastIndex": 0
//     }
//   },
//   "aError": {
//     "___http-functions-class___": "SerializableError",
//     "json": {
//       "name": "Error",
//       "message": "message",
//       "stack": "Error: message\n    at ..."
//     }
//   }
// }


const newObj = fromJSON(JSON.parse(str));
console.log(newObj.aDate.toUTCString()); //Fri, 21 Sep 2018 23:21:02 GMT
console.log(newObj.aRegExp.test('_aaa_')); //true
console.log(newObj.aError.toString()); //Error: message
```

## How does it work?

As you can see in the example above, the more complex data types are actually converted to a little more elaborate representation in the serialized json. For example, if we take Date as an example, instead of getting:
```js
"aDate": "2018-09-21T23:21:02.149Z"
```
As we normally get in json for dates (and then sadly parse into a string), we now get (thanks to our `toJSON` function):
```js
"aDate": {
  "___http-functions-class___": "Date",
  "json": "2018-09-21T23:21:02.149Z"
}
```
Which our parser `fromJSON` function recognizes due to the special `___http-functions-class___` notation and actually converts into a date object.

As you can see, the higher level json protocol can be easily extended to support any number of higher level data types, which we can add as needed, but the most amazing thing is that actually **you** can add more data types if you like, without changing a single line of code in this library. Read on to learn how.

## Supporting custom data types

Let's say you have your own custom data type that you would like to be able to serialize:
```js
class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

In order to be able to serialize and deserialize this class, you need to do 3 simple things:
1. Add a toJSON() function to the class which return the json representation of the class:
```js
  toJSON() {
    return { firstName: this.firstName, lastName: this.lastName };
  }
```
2. Add a static function fromJSON() to the class that give a json, returns a new instance of the class:
```js
Person.fromJSON = function (obj) {
  return new Person(obj.firstName, obj.lastName);
}
```
3. Let the serailzer know about this custom data type:
```js
const { addDataType } = require('http-functions-parser');
addDataType(Person);
```

Thant's it! Now you can do something like the following and it will work like a charm:
```js
const { toJSON, fromJSON, addDataType } = require('http-functions-parser');

class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  toJSON() {
    return { firstName: this.firstName, lastName: this.lastName };
  }
}
Person.fromJSON = function (obj) {
  return new Person(obj.firstName, obj.lastName);
}
addDataType(Person);

const originalObj = {
  aPerson: new Person('Shahar', 'Talmi')
};

const str = JSON.stringify(toJSON(originalObj), null, 2);
console.log(str);
// {
//   "aPerson": {
//     "___http-functions-class___": "Person",
//     "json": {
//       "firstName": "Shahar",
//       "lastName": "Talmi"
//     }
//   }
// }

const newObj = fromJSON(JSON.parse(str));
console.log(newObj.aPerson.fullName()); //Shahar Talmi
```

## Notes

 * Instead of implementing `fromJSON` as a static method, you can optionally support getting the json object in your constructor.
 * In case you want to serialize/deserialize a data type which you don't own and can't add `toJSON`/`fromJSON` to it, you can create a class that gets that type in the constructor and pass the data type as second parameter to `addDataType` function. Take a look in the source code on how we support `RegExp` serialization if you need a good example.
