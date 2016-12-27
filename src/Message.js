
const Channel = require("./Channel"),

    database = require("./database");

class Message {
    constructor(client, data) {

        this.client = client;
        this.client.currentMessage = this;

        //Try to parse the data
        try {
            this.req = JSON.parse(data);
            this.client.log("[RECV]", this.req);

        } catch (err) {
            this.req = data;
            this.client.log("[RECV]", this.req);
            return this.fail("invalid JSON")

        }

        //Move echo from req
        this.echo = this.req.echo;
        this.req.echo = undefined;

        if (typeof this.req.id !== "string") {
            try { this.push(); }
            catch (err) { this.fail(err); }

            return;
        }

        try {
            switch (this.req.id) {
                case "channels": this.channels(); break;
                case "subscribe": this.subscribe(); break;
                case "unsubscribe": this.unsubscribe(); break;
                case "rename": this.rename(); break;
                case "echo": this.json(this.req); break;
                default: this.push();
                // default: throw `Unknown message id '${this.req.id}'.`
            }

        } catch (err) {
            this.fail(err);

        }

    }

    channels() { this.json({channels: Channel.instances.map(c => ({name: c.name}))}); }

    subscribe() {
        this.assertParams({channelName: "string"});

        let channel = Channel.instances[this.req.channelName] || new Channel(this.req.channelName);
        channel.addClient(this.client);
    }

    unsubscribe() {
        this.assertParams({channelName: "string"});

        let channel = Channel.instances[this.req.channelName];

        if (!channel)
            throw `Channel '${this.req.channelName}' does not exist.`

        if (this.client.channels.indexOf(channel) === -1)
            throw `Not subscribed to channel '${this.req.channelName}'.`;

        channel.removeClient(this.client);

    }

    rename() {
        this.assertParams({name: "string"});

        this.client.name = this.req.name;

        this.json();

    }

    push() {
        this.assertParams({channelName: "string"});

        let channel = Channel.instances[this.req.channelName];

        if (!channel)
            throw `Channel '${this.req.channelName}' does not exist.`

        if (this.client.channels.indexOf(channel) === -1)
            throw `Not subscribed to channel '${this.req.channelName}'.`;

        this.req.channelName = undefined;
        this.req.origin = this.client.id;

        channel.json(this.req);

    }

    assertParams(rules = {}) {

        if (rules instanceof Array) {
            for (let i = 0; i < rules.length; i++)
                if (typeof this.req[rules[i]] === "undefined")
                    throw `Missing required parameter '${rules[i]}'.`

            return;

        }

        for (let param in rules) {
            let type = typeof this.req[param];
            if (type === "undefined") throw `Missing required parameter '${param}'.`
            else if (type !== rules[param]) throw `Wrong parameter type '${param}'. Received ${type}, expected ${rules[param]}.`
        }

    }

    json(data = {}) {

        if (typeof this.echo !== "undefined") data.echo = this.echo;
        if (typeof data.time === "undefined") data.time = Date.now();

        this.client.currentMessage = null;

        this.client.json(data)

    }

    sendOverwrite(data = "{}") {

        if (typeof this.echo !== "undefined")
            data = `${data.slice(0, data.length - 1)},"echo":${JSON.stringify(this.echo)}}`;

        this.client.currentMessage = null;

        this.client.send(data)

    }

    fail(reason) {

        if (typeof reason === "object" && reason instanceof Error) {
            this.client.error(reason);
            reason = "Uncaught server error.";
        }

        this.json({
            id: "fail",
            reason: reason,
            req: this.req
        });

        return false;

    }

}

module.exports = Message;
