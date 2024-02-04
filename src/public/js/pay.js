const URL_SERVER = 'https://pagavehiculosecure.com';
// const URL_SERVER = 'http://localhost:3000';

let valuePlaca = '';

document.addEventListener('DOMContentLoaded', async function () {
    // Get data of the localStorage
    const message = localStorage.getItem('message');

    if (message) {
        await dividerData(message);
    }
});

const dividerData = async (message) => {
    try {
        // Divider message to localStorage  
        const lines = message?.split('\n');

        // Get VIN HTML
        const VIN = document.getElementsByClassName('plus-vin-detail')[0];

        // Set data in HTML
        document.getElementsByClassName('vehiculo-summary__value__placa')[0].innerHTML = lines[1].trim();
        valuePlaca = lines[1].trim();
        document.getElementsByClassName('vehiculo-summary__value__marca')[0].innerHTML = lines[3].trim();
        document.getElementsByClassName('vehiculo-summary__value__linea')[0].innerHTML = lines[5].trim();
        document.getElementsByClassName('vehiculo-summary__value__modelo')[0].innerHTML = lines[7].trim();
        document.getElementById('vehiculo-detail-servicio').innerHTML = lines[10].split(':')[1].trim();
        document.getElementById('vehiculo-detail-clase').innerHTML = lines[11].split(':')[1].trim();
        document.getElementById('vehiculo-detail-cilindraje').innerHTML = lines[12].split(':')[1].trim();
        document.getElementById('vehiculo-detail-motor').innerHTML = lines[13].split(':')[1].trim();
        document.getElementById('vehiculo-detail-pasajeros').innerHTML = lines[14].split(':')[1].trim();
        document.getElementById('vehiculo-detail-combustible').innerHTML = lines[15].split(':')[1].trim();

        if (!lines[16].includes("Datos del tomador")) {
            VIN.classList.remove('disabled');
            VIN.innerHTML = lines[16].split(':')[0].trim() + ": ";

            // Crea un nuevo elemento span
            const spanElement = document.createElement('span');

            // Asigna el id y la clase al nuevo span
            spanElement.id = 'vehiculo-detail-vin';
            spanElement.className = 'vehiculo-detail-style';

            // Asigna el valor al nuevo span
            spanElement.innerHTML = lines[16].split(':')[1].trim();

            // Agrega el nuevo span al li
            VIN.appendChild(spanElement);
        }

        if (lines[34] && !lines[35]) {
            document.getElementById('valuePay').innerHTML = lines[34].trim();
            document.getElementById('valuePayHidden').innerHTML = lines[34].trim();
        } else if (lines[35]) {
            document.getElementById('valuePay').innerHTML = lines[35].trim();
            document.getElementById('valuePayHidden').innerHTML = lines[35].trim();
        } else {
            document.getElementById('valuePay').innerHTML = lines[33].trim();
            document.getElementById('valuePayHidden').innerHTML = lines[33].trim();
        }
    } catch (error) {
        console.error(error);
    }
}

const formToBuy = document.getElementById('formPayToBuy');

formToBuy.addEventListener('submit', async (e) => {
    e.preventDefault();

    const valueClean = document.getElementById('valuePay').textContent.replace(/\D/g, '');

    const response = await fetch(`${URL_SERVER}/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: parseInt(valueClean, 10), title: valuePlaca })
    })

    const data = await response.json();

    window.location.href = data.data.init_point;
});


