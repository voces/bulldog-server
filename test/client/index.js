
const config = {
        url: "wss://localhost:8088"
    };

class BulldogClient extends EventEmitter2 {

    constructor(connect) {
        super();

        this.echoId = 0;
        this.echos = [];

        if (connect) this.connect();

    }

    connect() {

        this.socket = new WebSocket(config.url);

        this.socket.addEventListener("open", data => this.emit("open"));
        this.socket.addEventListener("message", ({data}) => this.onMessage(JSON.parse(data)));

    }

    onMessage(message) {
        // console.log("RECV", message);

        if (typeof message.echo !== "undefined" && this.echos[message.echo]) {

            if (message.id === "fail") this.echos[message.echo].reject(message);
            else this.echos[message.echo].resolve(message);

            setTimeout(() => delete this.echos[message.echo], 0);
        }

        this.emit(message.id || "push", message);

    }

    channels() { return this.json({id: "channels"}) }
    subscribe(channel) { return this.json({id: "subscribe", channelName: channel}); }
    unsubscribe(channel) { return this.json({id: "unsubscribe", channelName: channel}); }
    rename(name) { return this.json({id: "rename", name: name}); }

    push(channel, message) {
        message.channelName = channel;
        return this.json(message);
    }

    json(message = {}) {
        return new Promise((resolve, reject) => {
            message.echo = this.echoId++;
            this.echos[message.echo] = {resolve, reject};

            // console.log("SEND", message);
            this.socket.send(JSON.stringify(message));
        });

    }

}

let server = new BulldogClient(true);
server.on("open", () =>
    server
        .channels()
        .then(({channels: [{name = "Chat"} = {}]}) => server.subscribe(name))
);
