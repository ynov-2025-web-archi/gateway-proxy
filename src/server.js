const express = require('express');
const cors = require('cors');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

app.use(cors());
app.use(express.json());

const productsProxy = createProxyMiddleware({
    target: process.env.PRODUCTS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/products': '/api/products'
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
    },
});

app.get('/', (req, res) => { 
    res.send('Welcome to the Gateway API');
});

app.get('/api/products', productsProxy);

app.listen(process.env.PORT || 3001, () => {
    console.log(`Gateway API is running on port ${process.env.PORT || 3001}`);
});
