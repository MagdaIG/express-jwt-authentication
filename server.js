const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'mi_clave_secreta_jwt_2024'; // En producción, usa una variable de entorno

// Base de datos simulada (array de usuarios)
const users = [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static('public'));

// Middleware de autenticación JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Token no válido o expirado',
          message: err.message 
        });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ 
      error: 'Token no proporcionado',
      message: 'Se requiere un token de autenticación en el encabezado Authorization' 
    });
  }
};

// Ruta de registro
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Datos incompletos',
      message: 'Se requiere email y password' 
    });
  }

  // Verificar si el usuario ya existe
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({ 
      error: 'Usuario ya existe',
      message: 'El email ya está registrado' 
    });
  }

  // Crear nuevo usuario
  const newUser = {
    id: users.length + 1,
    email: email,
    password: password // En producción, usar hash (bcrypt)
  };

  users.push(newUser);

  res.status(201).json({ 
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: newUser.id,
      email: newUser.email
    }
  });
});

// Ruta de inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Datos incompletos',
      message: 'Se requiere email y password' 
    });
  }

  // Buscar usuario
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ 
      error: 'Usuario no encontrado',
      message: 'No existe un usuario con ese email' 
    });
  }

  // Verificar contraseña
  if (user.password !== password) {
    return res.status(401).json({ 
      error: 'Contraseña incorrecta',
      message: 'La contraseña proporcionada es incorrecta' 
    });
  }

  // Generar JWT
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email 
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ 
    success: true,
    message: 'Inicio de sesión exitoso',
    token: token,
    user: {
      id: user.id,
      email: user.email
    }
  });
});

// Ruta protegida - Perfil del usuario
app.get('/profile', authenticateJWT, (req, res) => {
  const userId = req.user.userId;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ 
      error: 'Usuario no encontrado',
      message: 'El usuario asociado al token no existe' 
    });
  }

  res.json({ 
    success: true,
    message: 'Perfil del usuario',
    user: {
      id: user.id,
      email: user.email
    }
  });
});

// Ruta para obtener todos los usuarios (solo para desarrollo)
app.get('/users', (req, res) => {
  res.json({ 
    users: users.map(u => ({ id: u.id, email: u.email }))
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Frontend disponible en http://localhost:${PORT}`);
});

