'use strict';

const Types = require('./types');

const internals = {};

module.exports = ({ login, logout }) => {

    if (!login) {
        throw new Error('You must at least specify a login callback.');
    }

    const loginCb = internals.wrapToUseCallback(login);
    const logoutCb = logout ? internals.wrapToUseCallback(logout) : (cb) => cb(null);

    const actions = {
        loginAttempt: (...args) => {

            return {
                type: Types.LOGIN_ATTEMPT,
                payload: args
            };
        },
        loginFail: (error) => {

            return {
                type: Types.LOGIN_FAIL,
                payload: error,
                error: true
            };
        },
        loginSuccess: ({ credentials, artifacts }) => {

            credentials = credentials || null;
            artifacts = artifacts || null;

            return {
                type: Types.LOGIN_SUCCESS,
                payload: { credentials, artifacts }
            };
        },
        // Whatever args taken by loginCb, minus final callback
        login: (...args) => {

            return (dispatch) => {

                dispatch(actions.loginAttempt(...args));

                return loginCb(...args, (err, result) => {

                    if (err) {
                        return dispatch(actions.loginFail(err));
                    }

                    return dispatch(actions.loginSuccess({
                        credentials: result.credentials,
                        artifacts: result.artifacts
                    }));
                });
            };
        },
        // Whatever args taken by logoutCb, minus final callback
        logoutAttempt: (...args) => {

            return {
                type: Types.LOGOUT_ATTEMPT,
                payload: args
            };
        },
        logoutFail: (error) => {

            return {
                type: Types.LOGOUT_FAIL,
                payload: error,
                error: true
            };
        },
        logoutSuccess: (info) => {

            return {
                type: Types.LOGOUT_SUCCESS,
                payload: info
            };
        },
        // Whatever args taken by logoutCb, minus final callback
        logout: (...args) => {

            return (dispatch) => {

                dispatch(actions.logoutAttempt(...args));

                return logoutCb(...args, (err, info) => {

                    if (err) {
                        return dispatch(actions.logoutFail(err));
                    }

                    return dispatch(actions.logoutSuccess(info || null));
                });
            };
        }
    };

    return actions;
};

internals.wrapToUseCallback = (fn) => {

    return (...args) => {

        const cb = args.pop(); // Pop last param off args– will be the callback

        let called = false;
        const onceCb = (err, result) => {

            if (called) {
                throw new Error('You might be doing something weird.  The login or logout callback was called twice.');
            }

            called = true;
            cb(err, result);
        };

        const maybePromise = fn(...args, onceCb);

        if (!maybePromise || typeof maybePromise.then !== 'function') {
            return;
        }

        const success = (result) => {

            onceCb(null, result);
            return result;
        };

        const fail = (err) => {

            onceCb(err);
            return Promise.reject(err);
        };

        return maybePromise.then(success, fail);
    };
};
