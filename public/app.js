const API_URL = 'http://localhost:3000';

// Función para actualizar el indicador de pasos
function updateStepIndicator(stepNumber) {
    // Resetear todos los pasos
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });

    // Marcar pasos anteriores como completados
    for (let i = 1; i < stepNumber; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.classList.add('completed');
        }
    }

    // Marcar el paso actual como activo
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

// Función para mostrar/ocultar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar la pestaña seleccionada
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    // Actualizar indicador de pasos
    const stepMap = {
        'register': 1,
        'login': 2,
        'profile': 3
    };
    updateStepIndicator(stepMap[tabName]);
}

// Función para llenar credenciales de prueba
function fillTestCredentials() {
    document.getElementById('login-email').value = 'test@example.com';
    document.getElementById('login-password').value = 'test123';
}

// Función para mostrar mensajes
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Función para actualizar el display del token
function updateTokenDisplay() {
    const token = localStorage.getItem('jwt_token');
    const tokenContent = document.getElementById('token-content');
    const tokenStatus = document.getElementById('token-status');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    if (token) {
        tokenContent.innerHTML = `<p style="margin: 0; word-break: break-all;">${token}</p>`;
        tokenContent.classList.add('has-token');
        tokenStatus.textContent = 'Token Activo';
        tokenStatus.className = 'token-status con-token';
        copyBtn.disabled = false;
        clearBtn.disabled = false;
    } else {
        tokenContent.innerHTML = '<p class="no-token">No hay token almacenado. Inicia sesión para obtener uno.</p>';
        tokenContent.classList.remove('has-token');
        tokenStatus.textContent = 'Sin Token';
        tokenStatus.className = 'token-status sin-token';
        copyBtn.disabled = true;
        clearBtn.disabled = true;
    }
}

// Función para copiar el token
function copyToken() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        navigator.clipboard.writeText(token).then(() => {
            const copyBtn = document.getElementById('copy-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copiado!';
            copyBtn.style.background = '#28a745';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            alert('Error al copiar: ' + err);
        });
    }
}

// Función para limpiar el token
function clearToken() {
    if (confirm('¿Estás seguro de que quieres eliminar el token? Tendrás que iniciar sesión nuevamente.')) {
        localStorage.removeItem('jwt_token');
        updateTokenDisplay();
        document.getElementById('profile-info').innerHTML = '';
        showMessage('profile-message', 'Token eliminado. Debes iniciar sesión nuevamente.', 'success');
    }
}

// Manejar registro
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('register-message', data.message || 'Usuario registrado exitosamente', 'success');
            document.getElementById('register-form').reset();
            // Mostrar pista de siguiente paso
            document.getElementById('register-next').classList.add('show');
            // Marcar paso 1 como completado
            document.getElementById('step1').classList.add('completed');
        } else {
            showMessage('register-message', data.message || data.error || 'Error al registrar usuario', 'error');
            document.getElementById('register-next').classList.remove('show');
        }
    } catch (error) {
        showMessage('register-message', 'Error de conexión: ' + error.message, 'error');
    }
});

// Manejar login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el token en localStorage
            localStorage.setItem('jwt_token', data.token);
            updateTokenDisplay();
            showMessage('login-message', '✓ ' + (data.message || 'Inicio de sesión exitoso') + ' Tu token JWT aparece abajo.', 'success');
            document.getElementById('login-form').reset();
            // Mostrar pista de siguiente paso
            document.getElementById('login-next').classList.add('show');
            // Marcar paso 2 como completado
            document.getElementById('step2').classList.add('completed');
        } else {
            showMessage('login-message', data.message || data.error || 'Error al iniciar sesión', 'error');
            document.getElementById('login-next').classList.remove('show');
        }
    } catch (error) {
        showMessage('login-message', 'Error de conexión: ' + error.message, 'error');
    }
});

// Función para cargar el perfil
async function loadProfile() {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        showMessage('profile-message', 'No hay token. Por favor, inicia sesión primero.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const profileInfo = document.getElementById('profile-info');
            profileInfo.innerHTML = `
                <h4 style="margin-top: 0; color: #667eea;">Información del Perfil</h4>
                <p><strong>ID de Usuario:</strong> ${data.user.id}</p>
                <p><strong>Email:</strong> ${data.user.email}</p>
                <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; color: #28a745; font-size: 14px;">
                    ✓ Acceso exitoso a ruta protegida usando JWT
                </p>
            `;
            showMessage('profile-message', '✓ ' + (data.message || 'Perfil cargado exitosamente') + ' Esta ruta está protegida por JWT.', 'success');
            // Marcar paso 3 como completado
            document.getElementById('step3').classList.add('completed');
        } else {
            showMessage('profile-message', data.message || data.error || 'Error al cargar el perfil', 'error');
            document.getElementById('profile-info').innerHTML = '';
            
            // Si el token es inválido, limpiarlo
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('jwt_token');
                updateTokenDisplay();
            }
        }
    } catch (error) {
        showMessage('profile-message', 'Error de conexión: ' + error.message, 'error');
    }
}

// Actualizar el display del token al cargar la página
updateTokenDisplay();

// Inicializar indicador de pasos
updateStepIndicator(1);

