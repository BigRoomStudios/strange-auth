'use strict';

exports.mirror = (namespace, obj) => {

    return Object.keys(obj).reduce((collector, key) => {

        collector[key] = `${namespace}/${key}`;
        return collector;
    }, {});
};
