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
    onProxyReq: (proxyReq, req, res) => {
        // You can modify the request here if needed
        console.log(`Proxying request to ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // You can modify the response here if needed
        console.log(`Response from ${req.originalUrl} received`);
    }
});

const newsletterProxy = createProxyMiddleware({
    target: process.env.NEWSLETTER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/newsletter': '/api/newsletter'
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
    },
    onProxyReq: (proxyReq, req, res) => {
        // You can modify the request here if needed
        console.log(`Proxying request to ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // You can modify the response here if needed
        console.log(`Response from ${req.originalUrl} received`);
    }
});

app.get('/', (req, res) => { 
    res.send('Welcome to the Gateway API');
});

app.use('/api/products', productsProxy);
app.use('/api/newsletter', newsletterProxy);

app.listen(process.env.PORT, () => {
    console.log(`Gateway API is running on port ${process.env.PORT || 3001}`);
});
