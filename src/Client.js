
const dateformat = require("dateformat"),
    EventEmitter = require("events"),

    Channel = require("./Channel"),
    Message = require("./Message"),

    colors = require("./util/colors"),

    clients = [];

let id = 0;

class Client extends EventEmitter {

    constructor(socket) {
        super();

        //Store things
        this.socket = socket;
        this.ip = socket._socket.remoteAddress;
        this.port = socket._socket.remotePort;

        //Generate default client info
        this.id = id++;
        this.name = "Anon#" + this.id;
        this.channels = [];

        //Register listeners
        this.socket.on("message", data => new Message(this, data));
        this.socket.on("close", () => this.onClose());

        //Tell client their ID and give them a list of channels
        // this.json({
        //     id: "connect",
        //     origin: -1,
        //     clientId: this.id,
        //     channels: Channel.instances.map(channel => channel.name)
        // });

        //Add them to the set
        clients.push(this);

        //Log it
        this.log(`[${this.address}]`, "Connected");

    }

    onClose() {

        this.log("Disconnected");

        for (let i = 0; i < this.channels.length; i++)
            this.channels[i].removeClient(this);

        clients.splice(clients.indexOf(this), 1);

    }

    get address() {
        return this.ip + ":" + this.port;
    }

    json(data) {
        if (this.socket.readyState !== 1) return;
        if (this.currentMessage) return this.currentMessage.json(data);

        // this.log("[SEND]", data);
        this.socket.send(JSON.stringify(data));
    }

    send(data) {
        if (this.socket.readyState !== 1) return;
        if (this.currentMessage) return this.currentMessage.sendOverwrite(data);

        // this.log("[SEND]", data);
        this.socket.send(data);
    }

    log(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.bmagenta, `[${this.name}]`);
        args.push(colors.default);
        console.log(...args);
    }

    error(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.magenta, `[${this.name}]`);
        args.push(colors.default);
        console.error(...args);
    }

}

module.exports = Client;
