// middlewares/error-handler.js

export function notFoundHandler(req, res, next) {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    const isApiRequest = req.originalUrl.startsWith('/api/');

    if (isApiRequest) {
        return res.status(404).json({
            success: false,
            status: 'not_found',
            message
        });
    }

    return res.status(404).render('vwAccount/404', {
        title: 'Page not found',
        error: message
    });
}

export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    console.error({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode,
        message: err.message,
        stack: isProduction ? undefined : err.stack
    });

    const message = statusCode >= 500
        ? 'Something went wrong on the server.'
        : err.message || 'Request failed.';

    if (req.originalUrl.startsWith('/api') || req.accepts('json')) {
        return res.status(statusCode).json({
            success: false,
            status: statusCode >= 500 ? 'error' : 'fail',
            message,
            ...(isProduction ? {} : { stack: err.stack })
        });
    }

    return res.status(statusCode).render('vwAccount/500', {
        title: 'Server error',
        message,
        error: isProduction ? null : err
    });
}