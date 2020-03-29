// Exports an Express router that supports promises.

const { Route, Router } = require('express');

// The common HTTP methods, also `all` and `use`.
const methods = [
    'all',
    'get',
    'post',
    'put',
    'head',
    'delete',
    'options',
    'patch'
];

function wrapErrorHandler(fn) {
    return function errorHandler(err, req, res, next) {
        // eslint-disable-line max-params
        try {
            const result = fn(err, req, res, next);
            if (
                result &&
                typeof result.then === 'function' &&
                typeof result.catch === 'function'
            )
                result.catch(next);
        } catch (error) {
            next(error);
        }
    };
}

// Returns async function `fn` wrapped in a request/error handler function.
function wrapHandler(fn) {
    if (fn.length === 4) {
        // Express distinguishes regular handler from error handler by number of
        // arguments, so we need to return appropriate function.
        return wrapErrorHandler(fn);
    } else return wrapRequestHandler(fn);
}

function wrapRequestHandler(fn) {
    return function requestHandler(req, res, next, ...args) {
        // eslint-disable-line max-params
        try {
            const result = fn(req, res, next, ...args);
            if (
                result &&
                typeof result.then === 'function' &&
                typeof result.catch === 'function'
            )
                result.catch(next);
        } catch (error) {
            next(error);
        }
    };
}

const useMethod = Router.use;
Router.use = function(path, fn) {
    const mount = typeof path === 'string' ? path : '/';
    const middleware = typeof path === 'function' ? path : fn;
    if (
        middleware.name === 'mounted_app' ||
        (middleware.handle && middleware.use)
    )
    // Mount Express router, no need to wrap
        return useMethod.call(this, mount, middleware);
    else return useMethod.call(this, mount, wrapHandler(middleware));
};

const paramMethod = Router.param;
Router.param = function(name, fn) {
    if (arguments.length === 1) paramMethod.call(this, name);
    else {
        // Param handler takes four arguments, but in the
        // same order as the request handler.
        paramMethod.call(this, name, wrapRequestHandler(fn));
    }
};

methods.forEach(function(method) {
    const routeMethod = Route.prototype[method];
    Route.prototype[method] = function(...fn) {
        return routeMethod.call(this, ...fn.map(wrapHandler));
    };
});