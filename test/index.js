'use strict';

// Load modules

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const StrangeAuth = require('../src');

const Types = StrangeAuth.types;
const Statuses = StrangeAuth.statuses;

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {};

describe('strange-auth', () => {

    describe('action types', () => {

        it('exist and are namespaced.', () => {

            expect(Types).to.equal({
                LOGIN_ATTEMPT: '@@auth/LOGIN_ATTEMPT',
                LOGIN_SUCCESS: '@@auth/LOGIN_SUCCESS',
                LOGIN_FAIL: '@@auth/LOGIN_FAIL',
                LOGOUT_ATTEMPT: '@@auth/LOGOUT_ATTEMPT',
                LOGOUT_SUCCESS: '@@auth/LOGOUT_SUCCESS',
                LOGOUT_FAIL: '@@auth/LOGOUT_FAIL'
            });
        });
    });

    describe('auth statuses', () => {

        it('exist and are namespaced.', () => {

            expect(Statuses).to.equal({
                INIT: '@@auth-status/INIT',
                WAITING: '@@auth-status/WAITING',
                WAITING_LOGOUT: '@@auth-status/WAITING_LOGOUT',
                FINISHED: '@@auth-status/FINISHED'
            });
        });
    });

    describe('makeActions()', () => {

        it('complains if you don\'t implement login.', () => {

            expect(() => {

                StrangeAuth.makeActions({});
            }).to.throw('You must at least specify a login callback.');
        });

        it('has a default logout strategy.', () => {

            const actions = StrangeAuth.makeActions({
                login: () => Promise.resolve({ credentials: true })
            });

            const called = [];
            const dispatch = (x) => called.push(x);

            actions.logout()(dispatch);

            expect(called).to.equal([
                {
                    type: Types.LOGOUT_ATTEMPT,
                    payload: []
                },
                {
                    type: Types.LOGOUT_SUCCESS,
                    payload: null
                }
            ]);
        });

        it('accepts a function returning a promise for login.', () => {

            const actions = StrangeAuth.makeActions({
                login: (username, password) => {

                    if (username !== 'don-moe') {
                        return Promise.reject(new Error('bad user'));
                    }

                    return Promise.resolve({
                        credentials: {
                            username,
                            password: password.replace(/./g, '*')
                        },
                        artifacts: { passed: true }
                    });
                }
            });

            let called = [];
            const dispatch = (x) => called.push(x);

            actions.login('don-moe', 'big-secret')(dispatch)
                .then(() => {

                    expect(called).to.equal([
                        {
                            type: Types.LOGIN_ATTEMPT,
                            payload: ['don-moe', 'big-secret']
                        },
                        {
                            type: Types.LOGIN_SUCCESS,
                            payload: {
                                credentials: {
                                    username: 'don-moe',
                                    password: '**********'
                                },
                                artifacts: { passed: true }
                            }
                        }
                    ]);

                    called = [];
                    return actions.login('bad-moe', 'bad-secret')(dispatch);
                })
                .catch((err) => {

                    expect(err.message).to.equal('bad user');

                    expect(called).to.equal([
                        {
                            type: Types.LOGIN_ATTEMPT,
                            payload: ['bad-moe', 'bad-secret']
                        },
                        {
                            type: Types.LOGIN_FAIL,
                            payload: new Error('bad user'),
                            error: true
                        }
                    ]);
                });
        });

        it('bails early if thenable returned doesn\'t behave like a Promise', (flags) => {

            const actions = StrangeAuth.makeActions({
                login: (username, password) => {

                    if (username !== 'don-moe') {
                        return Promise.reject(new Error('bad user'));
                    }

                    // Missing a callback, but returns a non-Promise-compliant thenable
                    return {
                        credentials: {
                            username,
                            password: password.replace(/./g, '*')
                        },
                        artifacts: { passed: true },
                        then: 'not a function'
                    };
                }
            });

            const called = [];
            const dispatch = (x) => called.push(x);

            const brokenPromise = actions.login('don-moe', 'big-secret')(dispatch);
            expect(called).to.equal([
                {
                    type: Types.LOGIN_ATTEMPT,
                    payload: ['don-moe', 'big-secret']
                }
            ]);
            expect(() => brokenPromise.then()).to.throw(TypeError, 'Cannot read property \'then\' of undefined');
        });

        it('accepts a function with a callback for login.', () => {

            const actions = StrangeAuth.makeActions({
                login: (username, password, cb) => {

                    if (username !== 'don-moe') {
                        return cb(new Error('bad user'));
                    }

                    return cb(null, {
                        credentials: {
                            username,
                            password: password.replace(/./g, '*')
                        },
                        artifacts: { passed: true }
                    });
                }
            });

            let called = [];
            const dispatch = (x) => called.push(x);

            actions.login('don-moe', 'big-secret')(dispatch);

            expect(called).to.equal([
                {
                    type: Types.LOGIN_ATTEMPT,
                    payload: ['don-moe', 'big-secret']
                },
                {
                    type: Types.LOGIN_SUCCESS,
                    payload: {
                        credentials: {
                            username: 'don-moe',
                            password: '**********'
                        },
                        artifacts: { passed: true }
                    }
                }
            ]);

            called = [];
            actions.login('bad-moe', 'bad-secret')(dispatch);

            expect(called).to.equal([
                {
                    type: Types.LOGIN_ATTEMPT,
                    payload: ['bad-moe', 'bad-secret']
                },
                {
                    type: Types.LOGIN_FAIL,
                    payload: new Error('bad user'),
                    error: true
                }
            ]);
        });

        it('accepts a function returning a promise for logout.', () => {

            const actions = StrangeAuth.makeActions({
                login: (cb) => cb(null),
                logout: (proceed) => {

                    if (!proceed) {
                        return Promise.reject(new Error('not a good time'));
                    }

                    return Promise.resolve('success');
                }
            });


            let called = [];
            const dispatch = (x) => called.push(x);

            actions.logout(true)(dispatch)
                .then(() => {

                    expect(called).to.equal([
                        {
                            type: Types.LOGOUT_ATTEMPT,
                            payload: [true]
                        },
                        {
                            type: Types.LOGOUT_SUCCESS,
                            payload: 'success'
                        }
                    ]);

                    called = [];
                    return actions.logout(false)(dispatch);
                })
                .catch((err) => {

                    expect(err.message).to.equal('not a good time');

                    expect(called).to.equal([
                        {
                            type: Types.LOGOUT_ATTEMPT,
                            payload: [false]
                        },
                        {
                            type: Types.LOGOUT_FAIL,
                            payload: new Error('not a good time'),
                            error: true
                        }
                    ]);
                });
        });

        it('accepts a function with a callback for logout.', () => {

            const actions = StrangeAuth.makeActions({
                login: (cb) => cb(null),
                logout: (proceed, cb) => {

                    if (!proceed) {
                        return cb(new Error('not a good time'));
                    }

                    return cb(null, 'success');
                }
            });

            let called = [];
            const dispatch = (x) => called.push(x);

            actions.logout(true)(dispatch);

            expect(called).to.equal([
                {
                    type: Types.LOGOUT_ATTEMPT,
                    payload: [true]
                },
                {
                    type: Types.LOGOUT_SUCCESS,
                    payload: 'success'
                }
            ]);

            called = [];
            actions.logout(false)(dispatch);

            expect(called).to.equal([
                {
                    type: Types.LOGOUT_ATTEMPT,
                    payload: [false]
                },
                {
                    type: Types.LOGOUT_FAIL,
                    payload: new Error('not a good time'),
                    error: true
                }
            ]);
        });

        it('complains if you handle a promise and a callback.', () => {

            const actions = StrangeAuth.makeActions({
                login: (cb) => {

                    cb(null, {});
                    return Promise.resolve({});
                }
            });

            actions.login()(() => null)
                .catch((err) => {

                    expect(err.message).to.equal('You might be doing something weird.  The login or logout callback was called twice.');
                });
        });
    });

    describe('reducer', () => {

        const actions = StrangeAuth.makeActions({
            login: () => Promise.resolve({ credentials: true })
        });

        it('accepts custom initial state through makeReducer().', () => {

            const reducer = StrangeAuth.makeReducer({
                customProp: true,
                artifacts: { custom: true }
            });

            expect(reducer(null, {})).to.equal({
                status: Statuses.INIT,
                isAuthenticated: false,
                credentials: {},
                artifacts: { custom: true },
                error: {
                    login: false,
                    logout: false
                },
                customProp: true
            });
        });

        it('handles login attempt.', () => {

            const reducer = StrangeAuth.makeReducer();
            const action = actions.loginAttempt();

            expect(reducer(null, action)).to.equal({
                status: Statuses.WAITING,
                isAuthenticated: false,
                credentials: {},
                artifacts: {},
                error: {
                    login: false,
                    logout: false
                }
            });
        });

        it('handles login success with creds.', () => {

            const reducer = StrangeAuth.makeReducer({
                error: { login: true, logout: false }
            });
            const attempt = actions.loginAttempt();
            const success = actions.loginSuccess({ credentials: 'creds', artifacts: 'arts' });

            const state = reducer(reducer(null, attempt), success);

            expect(state).to.equal({
                status: Statuses.FINISHED,
                isAuthenticated: true,
                credentials: 'creds',
                artifacts: 'arts',
                error: {
                    login: false, // Cleared
                    logout: false
                }
            });
        });

        it('handles login success without creds.', () => {

            const reducer = StrangeAuth.makeReducer({
                error: { login: true, logout: false }
            });
            const attempt = actions.loginAttempt();
            const success = actions.loginSuccess({});

            const state = reducer(reducer(null, attempt), success);

            expect(state).to.equal({
                status: Statuses.FINISHED,
                isAuthenticated: true,
                credentials: {},  // Default
                artifacts: {},    // Default
                error: {
                    login: false,
                    logout: false
                }
            });
        });

        it('handles login failure.', () => {

            const reducer = StrangeAuth.makeReducer();
            const attempt = actions.loginAttempt();
            const fail = actions.loginFail(new Error('bad'));

            const state = reducer(reducer(null, attempt), fail);

            expect(state).to.equal({
                status: Statuses.FINISHED,
                isAuthenticated: false,
                credentials: {},
                artifacts: {},
                error: {
                    login: true,
                    logout: false
                }
            });
        });

        it('handles logout attempt.', () => {

            const reducer = StrangeAuth.makeReducer();
            const login = actions.loginSuccess({ credentials: 'creds', artifacts: 'arts' });
            const attemptLogout = actions.logoutAttempt();

            const state = reducer(reducer(null, login), attemptLogout);

            expect(state).to.equal({
                status: Statuses.WAITING_LOGOUT,
                isAuthenticated: false,
                credentials: 'creds',
                artifacts: 'arts',
                error: {
                    login: false,
                    logout: false
                }
            });
        });

        it('handles logout success.', () => {

            const reducer = StrangeAuth.makeReducer({
                error: { login: false, logout: true }
            });
            const login = actions.loginSuccess({ credentials: 'creds', artifacts: 'arts' });
            const attemptLogout = actions.logoutAttempt();
            const succeedLogout = actions.logoutSuccess();

            const state = reducer(reducer(reducer(null, login), attemptLogout), succeedLogout);

            expect(state).to.equal({
                status: Statuses.FINISHED,
                isAuthenticated: false,
                credentials: {},
                artifacts: {},
                error: {
                    login: false,
                    logout: false // Cleared
                }
            });
        });

        it('handles logout error.', () => {

            const reducer = StrangeAuth.makeReducer();
            const login = actions.loginSuccess({ credentials: 'creds', artifacts: 'arts' });
            const attemptLogout = actions.logoutAttempt();
            const failLogout = actions.logoutFail(new Error('bad'));

            const state = reducer(reducer(reducer(null, login), attemptLogout), failLogout);

            expect(state).to.equal({
                status: Statuses.FINISHED,
                isAuthenticated: false,
                credentials: 'creds',
                artifacts: 'arts',
                error: {
                    login: false,
                    logout: true
                }
            });
        });
    });
});
