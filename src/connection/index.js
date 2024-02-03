const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'srv817.hstgr.io',
    port: 3306,
    database: 'u674933209_basedatosh',
    user: 'u674933209_userh',
    password: 'Maestroy33@'
});

module.exports = connection;