// See https://github.com/typicode/json-server#module
const jsonServer = require('json-server');
const jsonServerAuth = require('json-server-auth');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Middleware para asegurarse de que la colección "users" exista
server.use((req, res, next) => {
    if (!router.db.get('users').value()) {
        router.db.set('users', []).write();
    }
    next();
});

// Inicializar la base de datos para json-server-auth
server.db = router.db; // Necesario para json-server-auth

// Cargar reglas de permisos desde routes.json
const rules = jsonServerAuth.rewriter(JSON.parse(fs.readFileSync(path.join(__dirname, '../routes.json'))));

server.use(middlewares);
server.use(rules); // Aplicar las reglas de permisos antes del router
server.use(jsonServer.rewriter({
    '/api/*': '/$1',
    '/blog/:resource/:id/show': '/:resource/:id'
}));

server.use(jsonServerAuth);

// Middleware para calcular y devolver el número total de páginas en las solicitudes de productos
server.use((req, res, next) => {
    if (req.method === 'GET' && req.path === '/products') {
        const totalItems = server.db.get('products').size().value();
        const limit = parseInt(req.query._limit, 10) || totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        res.setHeader('X-Total-Pages', totalPages); // Agregar encabezado con el total de páginas
    }
    next();
});

server.use(router);

server.post('/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = server.db.get('users').value();
    const userExists = users.some(user => user.email === email);

    if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 5);
    const newUser = { id: Date.now(), email, password: hashedPassword, name: name || '' };

    server.db.get('users').push(newUser).write();
    res.status(201).json(newUser);
});

server.listen(3000, () => {
    console.log('JSON Server is running');
});

// Export the Server API
module.exports = server;
