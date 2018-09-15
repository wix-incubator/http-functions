const server = process.env.NODE_ENV === 'test' ? './src/server' : './dist/src/server';
module.exports = require(server).default;
