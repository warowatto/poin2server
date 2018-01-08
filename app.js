const path = require('path');
const express = require('express');
const app = express();

const middleware = require(path.join(__dirname, 'config/middleware'))(app);
const auth = require(path.join(__dirname, 'config/auth'))(app);
const routers = require(path.join(__dirname, 'config/router'))(app);

app.listen(3000, () => {
    console.log('http://localhost:3000');
});