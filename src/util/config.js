
const fs = require("fs"),
    EventEmitter = require("events");

class Config extends EventEmitter {
    constructor() {
        super();

        fs.readFile(__dirname + "/../../config.json", (err, file) => this.processFile(err, file));

    }

    processFile(err, file) {
        if (err) {
            console.error("Unable to load config.json");
            process.exit(1);
        }

        try {
            file = JSON.parse(file.toString());

            for (let prop in file)
                this[prop] = file[prop];

            setImmediate(() => this.emit("ready", file));

        } catch (err) {
            console.error("Unable to parse config.json");
            process.exit(1);
        }
    }
}

let config = new Config();

module.exports = config;
