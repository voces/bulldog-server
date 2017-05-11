
const Server = require( "mongodb" ).Server,
	Db = require( "mongodb" ).Db,
	MongoClient = require( "mongodb" ).MongoClient;

class Database {

	start( { database: { url = "mongodb://localhost:27017/bulldog" } } ) {

		MongoClient.connect( url, ( err, client ) => {

			if ( err ) {

				const [ host, port ] = url.split( "//" )[ 1 ].split( "/" )[ 0 ].split( ":" );

				this.db = new Db( "bulldog", new Server( host, port ) );
				this.users = this.db.collection( "users" );
    			this.channels = this.db.collection( "channels" );

				return;

			}

			this.db = client.db( "bulldog" );
			this.users = this.db.collection( "users" );
			this.channels = this.db.collection( "channels" );

		} );

	}

}

module.exports = new Database();
