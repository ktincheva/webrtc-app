var config = require('./config/config.json');
var server = require('./lib/server');

// In case the port is set using an environment variable (Heroku)
console.log(config);
server.run(config);