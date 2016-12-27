
module.exports = {
    black:		'\x1b[30m',
    red: 		'\x1b[31m',
    green: 		'\x1b[32m',
    yellow: 	'\x1b[33m',    //Channel
    blue: 		'\x1b[34m',
    magenta: 	'\x1b[35m',   //Client
    cyan: 		'\x1b[36m',     //Server
    white: 		'\x1b[37m',
    bred: 		'\x1b[1;31m',
    bgreen: 	'\x1b[1;32m',
    byellow: 	'\x1b[1;33m',
    bblue: 		'\x1b[1;34m',
    bmagenta:   '\x1b[1;35m',
    bcyan: 		'\x1b[1;36m',
    bwhite: 	'\x1b[1;37m',
    default: 	'\x1b[0;37m',

    print: function() {
        for (let color in this)
            if (color !== "print")
                console.log(this.default + color + " " + this[color] + color);
    }
}
