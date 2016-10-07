
const dateformat = require("dateformat"),
    EventEmitter = require("events"),

    colors = require("./colors");

let id = 0;

class Client extends EventEmitter {

    constructor(socket) {
        super();

        // var cache = [];
        // let stringified = JSON.stringify(socket, function(key, value) {
        //     if (typeof value === 'object' && value !== null) {
        //         if (cache.indexOf(value) !== -1) {
        //             // Circular reference found, discard key
        //             return;
        //         }
        //         // Store value in our collection
        //         cache.push(value);
        //     }
        //     return value;
        // }, "\t");
        // cache = null; // Enable garbage collection
        //
        // require("fs").writeFile("socketInfo.json", stringified);

        this.socket = socket;
        this.id = id++;

        this.ip = socket._socket.remoteAddress;
        this.port = socket._socket.remotePort;

        this.socket.on("message", data => {
            if (!this.party) return;

            try {
                data = JSON.parse(data);

                data.origin = this.id;
                data.timestamp = Date.now();

                this.party.broadcast(data);

            } catch (err) {}
        });

        this.socket.on("close", () => this.emit("close"));

        this.log(`[${this.address}]`, "Connected");

    }
    get address() {
        return this.ip + ":" + this.port;
    }

    json(data) {
        this.socket.send(JSON.stringify(data));
    }

    send(data) {
        this.socket.send(data);
    }

    disconnect() {
        this.log("Disconnected");
    }

    log(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.bblue, this.id);
        args.push(colors.default);
        console.log(...args);
    }

    error(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.blue, this.id);
        args.push(colors.default);
        console.error(...args);
    }

}

module.exports = Client;
