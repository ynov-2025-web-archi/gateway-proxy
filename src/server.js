const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[Gateway] Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`[Gateway] Request headers:`, req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[Gateway] Request body:`, req.body);
    }
    next();
});

console.log('Products Service URL:', process.env.PRODUCTS_SERVICE_URL);
console.log('Newsletter Service URL:', process.env.NEWSLETTER_SERVICE_URL);
console.log('Search Service URL:', process.env.SEARCH_SERVICE_URL);

const productsProxy = createProxyMiddleware({
    target: process.env.PRODUCTS_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: path => path,
    onError: (err, req, res) => {
        console.error('Products proxy error:', err);
        res.status(503).json({ 
            error: 'Products service unavailable',
            details: err.message 
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Products] Proxying request to: ${process.env.PRODUCTS_SERVICE_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Products] Response received: ${proxyRes.statusCode} ${req.method} ${req.url}`);
    }
});

const newsletterProxy = createProxyMiddleware({
    target: process.env.NEWSLETTER_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    preserveHeaderKeyCase: true,
    pathRewrite: path => path,
    onError: (err, req, res) => {
        console.error('Newsletter proxy error:', err);
        console.error('Request details:', {
            method: req.method,
            url: req.url,
            headers: req.headers
        });
        res.status(503).json({ 
            error: 'Newsletter service unavailable',
            details: err.message 
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Newsletter] Proxying request to: ${process.env.NEWSLETTER_SERVICE_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Newsletter] Response received: ${proxyRes.statusCode} ${req.method} ${req.url}`);
        console.log(`[Newsletter] Response headers:`, proxyRes.headers);
    }
});

const searchProxy = createProxyMiddleware({
    target: process.env.SEARCH_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    preserveHeaderKeyCase: true,
    pathRewrite: path => path,
    onError: (err, req, res) => {
        console.error('Search proxy error:', err);
        console.error('Request details:', {
            method: req.method,
            url: req.url,
            headers: req.headers
        });
        res.status(503).json({ 
            error: 'Search service unavailable',
            details: err.message 
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Search] Proxying request to: ${process.env.SEARCH_SERVICE_URL}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Search] Response received: ${proxyRes.statusCode} ${req.method} ${req.url}`);
        console.log(`[Search] Response headers:`, proxyRes.headers);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Gateway is running',
        timestamp: new Date().toISOString(),
        services: {
            products: process.env.PRODUCTS_SERVICE_URL,
            newsletter: process.env.NEWSLETTER_SERVICE_URL,
            search: process.env.SEARCH_SERVICE_URL
        }
    });
});

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        services: {
            products: process.env.PRODUCTS_SERVICE_URL,
            newsletter: process.env.NEWSLETTER_SERVICE_URL,
            search: process.env.SEARCH_SERVICE_URL
        },
        routes: {
            products: `${process.env.PRODUCTS_SERVICE_URL}/api/products`,
            newsletter: `${process.env.NEWSLETTER_SERVICE_URL}/api/newsletter`,
            search: `${process.env.SEARCH_SERVICE_URL}/api/search`
        },
        environment: {
            PORT: process.env.PORT,
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Root endpoint
app.get('/', (req, res) => { 
    res.json({
        message: 'Welcome to the Gateway API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            debug: 'GET /debug',
            products: 'GET /api/products',
            newsletter: 'POST /api/newsletter/subscribe',
            searchSuggestions: 'GET /api/search/suggestions?q=query'
        }
    });
});

// Route products requests to Products API
app.use('/api/products', productsProxy);

// Route newsletter requests to Newsletter API
app.use('/api/newsletter', newsletterProxy);

// Route search requests to Search API
app.use('/api/search', searchProxy);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        availableRoutes: {
            health: 'GET /health',
            debug: 'GET /debug',
            products: 'GET /api/products',
            newsletter: 'POST /api/newsletter/subscribe',
            searchSuggestions: 'GET /api/search/suggestions?q=query'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        error: 'Internal gateway error',
        message: err.message
    });
});

app.listen(process.env.PORT, () => {
    console.log(`🚀 Gateway API is running on port ${process.env.PORT || 3001}`);
    console.log(`📊 Health check: http://localhost:${process.env.PORT || 3001}/health`);
    console.log(`🔍 Debug info: http://localhost:${process.env.PORT || 3001}/debug`);
    console.log(`🛍️ Products API: http://localhost:${process.env.PORT || 3001}/api/products`);
    console.log(`📧 Newsletter API: http://localhost:${process.env.PORT || 3001}/api/newsletter`);
    console.log(`🔍 Search API: http://localhost:${process.env.PORT || 3001}/api/search`);
});
