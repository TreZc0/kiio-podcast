'use strict';
// Packages
const cheerio = require('cheerio');
const request = require('request-promise').defaults({jar: true}); // <= Automatically saves and re-uses cookies.

// Ours
const nodecgApiContext = require('./util/nodecg-api-context');
module.exports = function (nodecg) {
		// Store a reference to this nodecg API context in a place where other libs can easily access it.
	// This must be done before any other files are `require`d.
	nodecgApiContext.set(nodecg);
	require('./discord');
};
