
const config = require("./src/config"),
    server = require("./src/server");

config.on("ready", config => server.start(config));
