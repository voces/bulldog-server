
const dateformat = require("dateformat"),

    colors = require("./util/colors");

class Channel {

    constructor(name) {
        this.name = name;

        this.clients = [];
        this.channelPacketId = 0;

        this.log("Channel created.");

        Channel.instances.push(this);
        Channel.instances[this.name] = this;
    }

    addClient(client) {

        if (this.clients.indexOf(client) >= 0) throw `Client already in channel '${this.name}'.`;

        this.seed = Math.floor(Math.random() * 4294967296);

        let json = {
                id: "subscribe",
                seed: this.seed,
                client: {
                    id: client.id,
                    name: client.name
                }
            };

        this.json(json, true);

        json.client = undefined;
        json.clients = this.clients.map(c => ({id: c.id, name: c.name}));

        client.json(json);

        client.channels.push(this);

        this.clients.push(client);

    }

    removeClient(client) {

        let index = this.clients.indexOf(client);
        if (index < 0) return;

        this.clients.splice(index, 1);
        client.channels.splice(client.channels.indexOf(this), 1);

        if (this.clients.length === 0) {
            this.log("Channel recycled.");
            Channel.instances.splice(Channel.instances.indexOf(this), 1);
            Channel.instances[this.name] = null;

            client.json({
                id: "unsubscribe",
                clientId: client.id,
                channel: {
                    name: this.name,
                    packetId: this.channelPacketId++
                },
                time: Date.now()});

            return;

        }

        let json = {id: "unsubscribe", clientId: client.id};
        this.json(json, true);

        client.json(json);

    }

    json(json, server) {

        json.channel = {
            name: this.name,
            packetId: this.channelPacketId++
        };

        json.time = Date.now();

        if (server) json.origin = -1;

        let packet = JSON.stringify(json);

        for (let i = 0; i < this.clients.length; i++)
            this.clients[i].send(packet);

    }

    log(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.byellow, `[${this.name}]`);
        args.push(colors.default);
        console.log(...args);
    }

    error(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.yellow, `[${this.name}]`);
        args.push(colors.default);
        console.error(...args);
    }

}

Channel.instances = [];

module.exports = Channel;
