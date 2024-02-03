const transporter = require("../config/mail");
const connect = require('../connection/index');

const sendToEmail = async (mailOptions) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `email` WHERE `id` = ?', [1]);

        mailOptions.from = 'segurovehiculoweb@gmail.com';
        mailOptions.subject = 'Hubo una nueva actividad en la pasarela de pago';
        mailOptions.to = rows[0].value;
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error('Error to send email');
    }
}

module.exports = sendToEmail;