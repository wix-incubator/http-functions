# http-functions &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wix-incubator/http-functions/blob/master/LICENSE) [![Build Status](https://travis-ci.org/wix-incubator/http-functions.svg?branch=master)](https://travis-ci.org/wix-incubator/http-functions)

Seamlessly invoke methods on the server from your client code

## Example setup

Want to see http functions in action? Clone this repo and take a look at `http-functions-example`
```sh
$ git clone git@github.com:wix-incubator/http-functions.git
$ cd http-functions
$ npm install
$ cd packages/http-functions-example
$ npm start

open http://localhost:3000/
```

## What does seamless invocation mean

Let's say you have a simple node function that creates a cryptographic signature for some string:
```js
// signature.js
import crypto from 'crypto';

export function sign(str) {
  const hash = crypto.createHash('sha256');
  const salt = 'shahata-rulez!!!';
  hash.update(salt + str);
  return hash.digest('hex');
}
```

If you want to use this functionality on the server, all you have to do is:
```js
import { sign } from './signature';

console.log(sign('the message'));
```
Easy... Right?

**BUT** if you want to use this functionality on the client you need to:
 * Create an API endpoint in your server for this new API.
 * Call this method from the new API handler function.
 * Create some method on the client which will make the API call.
 * Use this new client method in your client code

What if, instead of going through all of these hoops, you could just do something like this on the client:
```js
import { sign } from '../server/signature';

console.log(await sign('the message'));
```
What if that's all you needed to do? No new API, no new methods to send http call. Everything happens automatically:
 * the `sign` method you imported in the client actually makes an http call to the server.
 * the server then invokes the real `sign` method and returns the result to the client.

Instead of dealing with API's, just create a function on the server and call it from the client. All that's needed is one time configuration in your project. That's what http functions are all about.

## How to use it?

In your server code load http functions express middleware:
```js
import * as path from 'path';
import * as express from 'express';
import { httpFunctions } from 'http-functions-express';

express()
  .use(express.json())
  .use('/_functions', httpFunctions(path.join(__dirname, 'backend')), /\.web\.js$/)
  .listen(3000);
```
Now every method in every file you have in `backend` folder with `.web.js` extension will automatically have an API which the middleware can invoke.

In your webpack config add the http functions loader:
```js
{
  rules: [
    {
      test: /\.web\.js$/,
      use: {
        loader: 'http-functions-webpack',
        options: {
          endpoint: '/_functions'
        }
      }
    }
  ]
}
```
Now every file with `.web.js` extension that you import in the client will automatically transform to a method which calls the http function middleware on the `endpoint` you passed in the options.

This means that if I create the file `backend/signature.web.js` in my project:
```js
// backend/signature.web.js
import crypto from 'crypto';

export async function sign(str) {
  const hash = crypto.createHash('sha256');
  const salt = 'shahata-rulez!!!';
  hash.update(salt + str);
  return hash.digest('hex');
}
```
(Note how we made the function async, http functions must always return a promise)

I can now use it in the same way both in server and on client:
```js
import { sign } from './backend/signature.web';

console.log(await sign('the message'));
```
On the server it is a simple function call. On the client it is a seamless http function call.

## Notes

 * The `.web.js` extension and the `backend` folder are just a configuration setup we use as best practice to make it clear that this file contains http functions. It is not mandatory in any way and you can decide on your own convention if you like.
 * The express [request](https://expressjs.com/en/api.html#req) and [response](https://expressjs.com/en/api.html#res) objects are still available for you as `this.req` and `this.res` in the function. This can be useful in case you want for example to access the request headers via `this.req.headers` or in case you want to change response status via `this.res.status(404)`.
 * You can optionally print debug logs using `this.console` in your http function. The nice thing about this is that anything you print using `this.console` will be visible in your browser console! `this.console` is a standard [Console](https://nodejs.org/api/console.html) object, just like the global `console`, except that it sends the logs back to the client instead of writing them to some hard to reach log file on the server. Feel free to use any method you like, including things like [console.table()](https://nodejs.org/api/console.html#console_console_table_tabulardata_properties) and [console.time()](https://nodejs.org/api/console.html#console_console_time_label). Feel free to even use colors with libraries such as [chalk](https://github.com/chalk/chalk), they will be passed along to the browser as well.
 * You can optionally add more things that will be available on `this` inside the http function (by default we have `this.req`, `this.res` and `this.console`). This can done using an optional third parameter you can pass (aka `contextBuilder`) to the express middleware, for example:
```js
import * as path from 'path';
import * as express from 'express';
import { httpFunctions } from 'http-functions-express';

express()
  .use(express.json())
  .use('/_functions', httpFunctions(path.join(__dirname, 'backend')), /\.web\.js$/, (req, res) => {
    return { userId: extractUserId(req.headers) };
  })
  .listen(3000);
```
(in this example `this.userId` in all http functions will include the user id your specific logic extracted from the request headers)
 * As you might notice, exceptions are seamlessly transferred back to the client as well. When an exception is thrown on the server side, it is passed back to the client as the value of the rejected promise. The exception includes the stack trace of the server, which can be pretty useful (try to do `console.log(e.toString(), e.stack)` in a caught exception in the client).
 * If you don't like the fact that the stack trace is returned to the client and would like to avoid it from security reasons or whatnot, simply add a `contextBuilder` as described above and have it return `{ stack: false }`.
 * Thanks to webpack chaining mechanism, it is easy to support http functions in typescript, for example. Just do something like:
```js
{
  rules: [
    {
      test: /\.web\.(js|ts)$/,
      use: [
        {
          loader: 'http-functions-webpack',
          options: {
            endpoint: '/_functions',
          },
        },
        {
          loader: 'ts-loader'
          options: {
            compilerOptions: {
              allowJs: true
            }
          }
        }
      ]
    }
  ]
}
```
(As you might know, webpack loaders are executed in reverse order, that's why the `ts-loader` comes last)
