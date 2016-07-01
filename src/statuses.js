'use strict';

const Mirror = require('./utils').mirror;

module.exports = Mirror('@@auth-status', {
    INIT: true,
    WAITING: true,
    WAITING_LOGOUT: true,
    FINISHED: true
});
