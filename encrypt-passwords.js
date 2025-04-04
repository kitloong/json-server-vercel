const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = './db.json';
const saltRounds = 5;

// Leer el archivo db.json
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Encriptar contraseñas de los usuarios si no están encriptadas
db.users = db.users.map(user => {
    if (!user.password.startsWith('$2b$')) { // Verificar si ya está encriptada
        return {
            ...user,
            password: bcrypt.hashSync(user.password, saltRounds)
        };
    }
    return user; // Dejar sin cambios si ya está encriptada
});

// Guardar los cambios en db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('Contraseñas encriptadas correctamente.');
