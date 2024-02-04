const URL_SERVER = 'https://suramercado.com';
// const URL_SERVER = 'http://localhost:3000';

const formLogin = document.getElementById('formLogin');

formLogin.addEventListener('submit', async (e) => {
    try {
        e.preventDefault();

        const user = document.getElementById('floatingUser').value;
        const password = document.getElementById('floatingPassword').value;

        const data = await fetch(`${URL_SERVER}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: user, password })
        })

        const jsonData = await data.json();

        document.getElementById('floatingUser').value = '';
        document.getElementById('floatingPassword').value = '';

        if (jsonData.success) {
            window.location.href = `${URL_SERVER}/dashboard`;
        } else {
            alert('Las credenciales no son correctas, por favor válida nuevamente');
        }
    } catch (error) {
        console.error('Error login user ', error);
    }
});