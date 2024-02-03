const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'segurovehiculoweb@gmail.com',
        pass: 'mrho suuh fnnj btft'
    }
})

module.exports = transporter;