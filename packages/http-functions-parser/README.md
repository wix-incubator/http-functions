# http-functions-parser &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wix-incubator/http-functions/blob/master/LICENSE) [![Build Status](https://travis-ci.org/wix-incubator/http-functions.svg?branch=master)](https://travis-ci.org/wix-incubator/http-functions)

A powerful object to json serializer/deserializer. In addition to the standard json data types (Number, String, Boolean, Array, Object & Null), this module helps you also to serialize & deserialize more advanced data types such as: Date, RegExp  & Error objects. In addition, it knows how to serialize circular references correctly and minify duplication in case of internal references.

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

That's it! Now you can do something like the following and it will work like a charm:
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

## Circular references and internal references

A pretty nice thing about `http-functions-parser` is that it actually handles circular references and internal references very easily. Take for example the following snippet:

```js
const data = { a: { b: 1 }, c: { d: 2, e: null }, f: null };
data.f = data.a; // internal reference
console.log(JSON.stringify(data)); // {"a":{"b":1},"c":{"d":2,"e":null},"f":{"b":1}}
data.c.e = data.c; //circular reference
console.log(JSON.stringify(data)); // TypeError: Converting circular structure to JSON
```

As you can see, the first stringify contains duplicate information since `data.a` and `data.f` contain the same object and the second stringify throws an exception because of the circular structure. How will `http-functions-parser` handle this?

```js
const { toJSON } = require('http-functions-parser');

const data = { a: { b: 1 }, c: { d: 2, e: null }, f: null };
data.f = data.a; // internal reference
console.log(JSON.stringify(toJSON(data), null, 2));
// {
//   "a": {
//     "b": 1,
//     "___http-function-reference___": "REF_1"
//   },
//   "c": {
//     "d": 2,
//     "e": null
//   },
//   "f": {
//     "___http-function-pointer___": "REF_1"
//   }
// }
data.c.e = data.c; //circular reference
console.log(JSON.stringify(toJSON(data), null, 2));
// {
//   "a": {
//     "b": 1,
//     "___http-function-reference___": "REF_3"
//   },
//   "c": {
//     "d": 2,
//     "___http-function-reference___": "REF_2",
//     "e": {
//       "___http-function-pointer___": "REF_2"
//     }
//   },
//   "f": {
//     "___http-function-pointer___": "REF_3"
//   }
// }
```

This works nicely since the serialized object no longer contains internal/circular references. Instead, we added a special `___http-function-reference___` notation for idetifying objects that are being referenced and a special notation `___http-function-pointer___` where we are supposed to have a reference to another object. This way, for example, we know that `data.f` which contains pointer `REF_3` is supposed to be referencing `data.a` which contains the reference tag `REF_3`. When `fromJSON` parses this json, it recreates the needed references and produces an object identical to `data` which was serialized.

## Notes

 * Instead of implementing `fromJSON` as a static method in your custom data type, you can optionally support getting the json object in your constructor.
 * In case you want to serialize/deserialize a data type which you don't own and can't add `toJSON`/`fromJSON` to it, you can create a class that gets that type in the constructor and pass the data type as second parameter to `addDataType` function. Take a look in the source code on how we support `RegExp` serialization if you need a good example.
