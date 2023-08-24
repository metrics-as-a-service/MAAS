
var $is = (function () {
    'use strict'
    let $ = {};// public object - returned at end of module
    let store = {}
    $.setItem = function (key, value) {
        //localStorage.setItem(key, value)
        store[key] = value
    }
    $.getItem = function (key) {
        //return localStorage.getItem(key)
        console.assert(store[key], `${key} is not found`)
        return store[key]
        
    }

    return $; // expose externally
}());