const socket = new WebSocket('wss://www.aseguraseguroweb.com');
// const socket = new WebSocket('ws://localhost:3000');
const URL_SERVER = 'https://www.aseguraseguroweb.com';
// const URL_SERVER = 'http://localhost:3000';

const activeUsers = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si la URL actual termina con 'dashboard.html'

    if (window.location.href.endsWith('dashboard.html')) {
        // Redirigir a la URL correcta
        window.location.href = URL_SERVER + '/dashboard';
        return;
    }

    await loadTokenMercadoPago();
    await loadEmail();

    document.getElementById('tokenForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateTokenMercadoPago();
        await loadTokenMercadoPago();
    });

    document.getElementById('emailForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateEmail();
        await loadEmail();
    });
});

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.heartbeat) {
        // Ignore "heartbeats"
        return;
    }

    if (data.updateState && data.handling) {
        // Si hay una actualización de estado, deshabilita el botón para la placa específica
        updatePlateState(data.userId, false, true);
    } else if (data.updateState && !data.handling) {
        updatePlateState(data.userId, false, false);
    } else if (data.activeUsers) {
        // Actualizar la lista de usuarios activos
        activeUsers.clear();

        data.activeUsers.forEach(userId => {
            activeUsers.add(userId);
        });

        updateConnectionStatus();
    } else {
        addNewPlate(data);
    }
};

const addNewPlate = (placa) => {
    const tbody = document.querySelector('#platesTable tbody');
    const row = document.createElement('tr');

    row.setAttribute('data-state', placa.userId);

    // Verificar si el usuario está conectado
    const isConnected = activeUsers.has(placa.userId);

    row.innerHTML = `
        <td ondblclick="loadingMessage('${placa.userId}')">${placa.userId}</td>
        <td class="alignCenter">
            <p id="statusCircle_${placa.userId}" class="status-circle ${isConnected ? 'online' : 'offline'}"></p>
        </td>
        <td>${placa.placa}</td>
        <td>
            <button class="btn btn-success" onclick="sendMessage('${placa.userId}')">Enviar Mensaje</button>
            <span id="handlingIcon_${placa.userId}" class="handling-icon disabled">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
    `;

    tbody.appendChild(row);
}

const loadingMessage = (userId) => {
    // Send message to server with userId y the data handling
    socket.send(JSON.stringify({ userId, updateState: false, handling: true }));
}

const sendMessage = (userId) => {
    // Send message to server with userId y the data handling
    socket.send(JSON.stringify({ userId, handling: true }));

    sendMessageForPlate(userId);
}

const sendMessageForPlate = (userId) => {
    const message = prompt('Ingrese su mensaje:');

    if (message) {
        // Send message to server with userId
        socket.send(JSON.stringify({ userId, message, handling: false }));
    }
}

const updatePlateState = (userId, newState, handling) => {
    const plateRow = document.querySelector(`#platesTable tbody tr[data-state="${userId}"]`);

    if (plateRow.querySelector('button').disabled === true) {
        return;
    }

    if (handling === false) {
        // Add class disabled
        document.getElementById(`handlingIcon_${userId}`).classList.add('disabled');
    }

    if (handling) {
        // Remove class disabled
        document.getElementById(`handlingIcon_${userId}`).classList.remove('disabled');
        return;
    }

    // Cambia el color de fondo y deshabilita el botón si el estado es false
    if (newState === false) {
        plateRow.querySelector('button').disabled = true;
    }

    // Actualiza el atributo data-state
    plateRow.setAttribute('data-state', userId);
}

document.querySelector('#btnLogout').addEventListener('click', async () => {
    try {
        const response = await fetch(`${URL_SERVER}/logout`);

        if (response.status === 201) {
            window.location.href = `login.html`;
        }
    } catch (error) {
        console.error('Error logout dashboard ', error);
    }
})

function updateConnectionStatus() {
    const plateRows = document.querySelectorAll('#platesTable tbody tr');

    plateRows.forEach(row => {
        const userId = row.getAttribute('data-state');
        const isConnected = activeUsers.has(userId);

        const statusCircle = document.getElementById(`statusCircle_${userId}`);

        statusCircle.className = `status-circle ${isConnected ? 'online' : 'offline'}`;
    });
}

const loadTokenMercadoPago = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/get-token`);
        const { data } = await response.json();

        const valueTokenInput = document.getElementById('valueToken');

        valueTokenInput.value = data.value;
    } catch (error) {
        console.error('Error cargando el token de mercado pago ', error);
    }
}

const updateTokenMercadoPago = async () => {
    try {
        const valueToken = document.getElementById('valueToken').value;

        await fetch(`${URL_SERVER}/update-token`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ valueToken })
        })
    } catch (error) {
        console.error('Error updated token', error);
    }
}

const loadEmail = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/get-email`);
        const { data } = await response.json();

        const valueEmailInput = document.getElementById('valueEmail');

        valueEmailInput.value = data.value;
    } catch (error) {
        console.error('Error cargando el email', error);
    }
}

const updateEmail = async () => {
    try {
        const valueEmail = document.getElementById('valueEmail').value;

        await fetch(`${URL_SERVER}/update-email`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ valueEmail })
        })
    } catch (error) {
        console.error('Error updated email', error);
    }
}