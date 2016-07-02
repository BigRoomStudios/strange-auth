# strange-auth

Redux toolkit for auth

[![Build Status](https://travis-ci.org/BigRoomStudios/strange-auth.svg?branch=master)](https://travis-ci.org/BigRoomStudios/strange-auth)
[![Coverage Status](https://coveralls.io/repos/BigRoomStudios/strange-auth/badge.svg?branch=master&service=github)](https://coveralls.io/github/BigRoomStudios/strange-auth?branch=master)

## Usage
**strange-auth** makes it simple to implement auth by providing factories to create a reducer and a set of actions that the reducer understands.  To give you an idea of what sort of state is managed, here's what the default initial state looks like,
```json5
{
    status: INIT,           // settled? pending login or logout?
    isAuthenticated: false, // logged-in?
    credentials: {},        // user info, tokens, etc.
    artifacts: {},          // any leftover info from login
    error: {                // did something nasty happen?
        login: false,
        logout: false
    }
}
```

### Example
#### `reducers/auth.js`
```js
const StrangeAuth = require('strange-auth');

// Assume that this reducer is placed at { auth } in the store
module.exports = StrangeAuth.makeReducer();
```

#### `actions/auth.js`
```js
const StrangeAuth = require('strange-auth');

module.exports = StrangeAuth.makeActions({
    // Implement login
    login: (username, password, whatever, cb) => {

        makeSomeRequest({ username, password }, (err, user) => {

            if (err) {
                return cb(err);
            }

            // You could also return a promise in here rather than calling cb()
            cb(null, {
                credentials: user,
                artifacts: whatever
            });
        });
    }
    // You can also implement logout: (cb) => ...
});
```

#### `action-types/auth.js`
```js
const StrangeAuth = require('strange-auth');

// Attempt, success, and failure types for both login and logout
module.exports = StrangeAuth.types;
```

#### `containers/login-form.js`
```js
const Connect = require('react-redux').connect;
const StrangeAuth = require('strange-auth');
const AuthActions = require('../actions/auth');
const LoginForm = require('../components/login-form');

module.exports = Connect(
    (state) => ({
        isLoggedIn: state.auth.isAuthenticated,
        isLoginPending: (state.auth.status === StrangeAuth.statuses.WAITING)
    }),
    {
        login: AuthActions.login
    }
)(LoginForm);
```
