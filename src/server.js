
const https = require("https"),
    fs = require("fs"),
    ws = require("ws"),
    async = require("async"),
    dateformat = require("dateformat"),

    colors = require("./colors"),
    Client = require("./Client")
    Party = require("./Party");

class Server {

    constructor() {

        this.clients = [];
        this.parties = [];

        this.openManualParties = [];
        this.openAutoParties = [];

        this.history = [];

        this.packetId = 0;

    }

    get openParties() {
        return {
            autoParties: this.openAutoParties,
            manualParties: this.openManualParties
        }
    }

    loadSSLKeys(keys, callback) {

        async.parallel({
            key: callback => fs.readFile(__dirname + "/../" + keys.key, callback),
            cert: callback => fs.readFile(__dirname + "/../" + keys.cert, callback),
            ca: callback => fs.readFile(__dirname + "/../" + keys.ca, (err, file) => {
                if (err) return callback(err);

                let lines = file.toString().split("\n"),
                    ca = [];

                for (let i = 0, n = 0; i < lines.length; i++)
                    if (lines[i].match(/END CERTIFICATE/))
                        ca.push(lines.slice(n, i + 1).join("\n")), n = i + 1;

                callback(null, ca);

            })

        }, (err, keys) => {
            if (err) return callback(err);

            keys.key = keys.key.toString();
            keys.cert = keys.cert.toString();

            callback(null, keys);

        });

    }

    startServer(keys, port) {

        this.https = https.createServer({
            key: keys.key,
            cert: keys.cert,
            ca: keys.ca

        }, (req, res) => {
            res.writeHead("200");
            res.end("Hello World!");

        }).listen(port, () => {
            this.wss = new ws.Server({server: this.https});
            this.wss.on("connection", socket => this.onConnect(socket));

            this.log("WSS listening on", port);
        });

        this.https.on("error", err => {
            if (err.code === "EADDRINUSE") {
                this.error("Port", port, "already in use!")
                process.exit(1);

            } else {
                this.error(err);
                process.exit(1);
            }

        });

    }

    start(config) {

        this.config = config;

        this.loadSSLKeys(config.wss.keys, (err, keys) => {

            if (err) {
                console.error(err);
                process.exit(1);
            }

            this.startServer(keys, config.wss.port);

        });

    }

    createParty() {

        let party = new Party();
        this.parties.push(party);

        party.on("open", () => {

            if (party.auto) this.openAutoParties.push(party);
            else this.openManualParties.push(party);

        });

        party.on("kill", () => {

            if (party.open) {

                if (party.auto)
                    this.openAutoParties.splice(this.openAutoParties.indexOf(party), 1);
                else this.openManualParties.splice(this.openManualParties.indexOf(party, 1));

            }

            this.parties.splice(this.parties.indexOf(party), 1);

        });

        return party;

    }

    getOpenParty() {

        if (this.openAutoParties.length === 0)
            return this.createParty();

        return this.openAutoParties[0];

    }

    onDisconnect(client) {

        client.disconnect();

        if (client.party) client.party.remove(client);
        this.clients.splice(this.clients.indexOf(client), 1)

    }

    onConnect(socket) {
        let client = new Client(socket);

        this.clients.push(client);

        this.getOpenParty().add(client);

        client.on("close", () => this.onDisconnect(client));
    }

    log(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.bcyan);
        args.push(colors.default);
        console.log(...args);
    }

    error(...args) {
        args.unshift(dateformat(new Date(), "hh:MM:sst") + colors.cyan);
        args.push(colors.default);
        console.error(...args);
    }

}

module.exports = new Server
