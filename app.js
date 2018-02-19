const path = require('path');
const express = require('express');
const app = express();

const middleware = require(path.join(__dirname, 'config/middleware'))(app);
const auth = require(path.join(__dirname, 'config/auth'))(app);
const routers = require(path.join(__dirname, 'config/router'))(app);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Poin Service에 오신것을 환영합니다.'});
});

console.log(process.env.poin_env);

let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('http://localhost:' + port);
});