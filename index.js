
const config = require("./src/util/config"),
    server = require("./src/server"),
    database = require("./src/database");

config.on("ready", config => {
    server.start(config);
    database.start(config);
});
