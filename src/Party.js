
const dateformat = require("dateformat"),
    EventEmitter = require("events"),

    config = require("./config"),
    colors = require("./colors");

class Party extends EventEmitter {
    constructor() {
        super();

        this.clients = [];

        this.packetId = 0;

        this.auto = true;
        this.opened = true;

        this.host = null;

        this.state = {
            level: 0
        };

        this.id = Party.id++;

        this.log("Constructed");

    }

    add(client) {

        this.state.seed = Math.floor(Math.random() * 4294967296);

        this.broadcast({
            origin: -1,
            clientId: client.id,
            timestamp: Date.now(),
            seed: this.state.seed,
            eid: "join"
        });

        client.json({
            origin: -1,
            clientId: client.id,
            timestamp: Date.now(),
            eid: "connected",
            party: this.clients.map(client => ({id: client.id})),
            state: this.state
        });

        this.clients.push(client);
        client.party = this;

        if (this.clients.length === config.maxPartySize)
            this.close();

        this.log("Added", client.id);

    }

    close() {
        this.opened = false;
        this.emit("close");
    }

    open() {
        this.opened = true;
        this.open("open");
    }

    kill() {

        this.log("Deconstructed");
        this.emit("kill");

    }

    remove(client) {

        this.clients.splice(this.clients.indexOf(client), 1);
        client.party = null;

        this.log("Removed", client.id);

        if (this.clients.length === 0 && this.auto)
            this.kill();

    }

    broadcast(packet) {

        packet.id = this.packetId++;

        let stringified = JSON.stringify(packet);
        for (let i = 0; i < this.clients.length; i++)
            this.clients[i].send(stringified);

    }

    log(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.bmagenta, this.id);
        args.push(colors.default);
        console.log(...args);
    }

    error(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.magenta, this.id);
        args.push(colors.default);
        console.error(...args);
    }

}

Party.id = 0;

module.exports = Party;
