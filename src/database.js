
const Server = require("mongodb").Server,
    MongoClient = require("mongodb").MongoClient;

class Database {

    start({database: {url = "mongodb://localhost:27017/bulldog"}}) {

        MongoClient.connect(url, (err, client) => {

            this.db = client.db("bulldog");
            this.users = this.db.collection("users");
            this.channels = this.db.collection("channels");

        });

    }

}

module.exports = new Database();
