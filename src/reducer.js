'use strict';

const Types = require('./types');
const Statuses = require('./statuses');

module.exports = (moreInitialState) => {

    moreInitialState = moreInitialState || {};

    const initialState = Object.assign({
        status: Statuses.INIT,
        isAuthenticated: false,
        credentials: {},
        artifacts: {},
        error: { // For actual error handling write a separate reducer
            login: false,
            logout: false
        }
    }, moreInitialState);

    return (state, action) => {

        state = state || initialState;

        const type = action.type;
        const payload = action.payload;

        switch (type) {

            case Types.LOGIN_ATTEMPT:
                return Object.assign({}, state, {
                    status: Statuses.WAITING
                });

            case Types.LOGIN_SUCCESS:
            {
                const error = Object.assign({}, state.error, {
                    login: false
                });

                return Object.assign({}, state, {
                    status: Statuses.FINISHED,
                    isAuthenticated: true,
                    credentials: payload.credentials || {},
                    artifacts: payload.artifacts || {},
                    error
                });
            }

            case Types.LOGIN_FAIL:
            {
                const error = Object.assign({}, state.error, {
                    login: true
                });

                return Object.assign({}, state, {
                    status: Statuses.FINISHED,
                    error
                });
            }

            case Types.LOGOUT_ATTEMPT:
                return Object.assign({}, state, {
                    status: Statuses.WAITING_LOGOUT,
                    isAuthenticated: false // Immediately considered not authenticated
                });

            case Types.LOGOUT_SUCCESS:
            {
                // Clear logout error
                const error = Object.assign({}, state.error, {
                    logout: false
                });

                return Object.assign({}, state, {
                    status: Statuses.FINISHED,
                    isAuthenticated: false,
                    credentials: {}, // Only at this point reset credentials/artifacts
                    artifacts: {},
                    error
                });
            }

            case Types.LOGOUT_FAIL:
            {
                // Set logout error
                const error = Object.assign({}, state.error, {
                    logout: true
                });

                return Object.assign({}, state, {
                    status: Statuses.FINISHED,
                    error
                });
            }
        }

        return state;
    };
};
