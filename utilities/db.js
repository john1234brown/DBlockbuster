const Database = require('better-sqlite3');
const path = require('path');
const CloudFlareDB = new Database(path.join(process.cwd(), 'db','cloudFlare.db'));

module.exports = CloudFlareDB;