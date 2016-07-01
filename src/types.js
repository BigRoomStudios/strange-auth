'use strict';

const Mirror = require('./utils').mirror;

module.exports = Mirror('@@auth', {
    LOGIN_ATTEMPT: true,
    LOGIN_SUCCESS: true,
    LOGIN_FAIL: true,
    LOGOUT_ATTEMPT: true,
    LOGOUT_SUCCESS: true,
    LOGOUT_FAIL: true
});
