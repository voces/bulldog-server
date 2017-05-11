
const https = require( "https" ),
	fs = require( "fs" ),
	ws = require( "ws" ),
	async = require( "async" ),
	dateformat = require( "dateformat" ),

	colors = require( "./util/colors" ),
	Client = require( "./Client" );

class Server {

	constructor() {

	}

	loadSSLKeys( keys, callback ) {

		async.parallel( {
			key: callback => fs.readFile( __dirname + "/../" + keys.key, callback ),
			cert: callback => fs.readFile( __dirname + "/../" + keys.cert, callback ),
			ca: callback => fs.readFile( __dirname + "/../" + keys.ca, ( err, file ) => {

				if ( err ) return callback( err );

				let lines = file.toString().split( "\n" ),
					ca = [];

				for ( let i = 0, n = 0; i < lines.length; i ++ )
					if ( lines[ i ].match( /END CERTIFICATE/ ) )
						ca.push( lines.slice( n, i + 1 ).join( "\n" ) ), n = i + 1;

				callback( null, ca );

			} )

		}, ( err, keys ) => {

			if ( err ) return callback( err );

			keys.key = keys.key.toString();
			keys.cert = keys.cert.toString();

			callback( null, keys );

		} );

	}

	startServer( keys, port ) {

		this.https = https.createServer( {
			key: keys.key,
			cert: keys.cert,
			ca: keys.ca

		}, ( req, res ) => {

			res.writeHead( "200" );
			res.end( "Hello World!" );

		} ).listen( port, () => {

			this.wss = new ws.Server( { server: this.https } );
			this.wss.on( "connection", socket => new Client( socket ) );

			this.log( "WSS listening on", port );

		} );

		this.https.on( "error", err => {

			if ( err.code === "EADDRINUSE" ) {

				this.error( "Port", port, "already in use!" );
				process.exit( 1 );

			} else {

				this.error( err );
				process.exit( 1 );

			}

		} );

	}

	start( config ) {

		this.config = config;

		this.loadSSLKeys( config.wss.keys, ( err, keys ) => {

			if ( err ) {

				console.error( err );
				process.exit( 1 );

			}

			this.startServer( keys, config.wss.port );

		} );

	}

	log( ...args ) {

		args.unshift( dateformat( new Date(), "hh:MM:sst" ) + colors.bcyan );
		args.push( colors.default );
		console.log( ...args );

	}

	error( ...args ) {

		args.unshift( dateformat( new Date(), "hh:MM:sst" ) + colors.cyan );
		args.push( colors.default );
		console.error( ...args );

	}

}

module.exports = new Server();
