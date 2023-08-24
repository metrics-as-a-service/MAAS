
var $l = (function () {
    'use strict'
    var $ = {};// public object - returned at end of module
    var startDateTime
    var logRecord = {}
    $.clear = function() {
        logRecord={}
    }
    $.log = function (message, severity = "Warning") {
        const record = logRecord[message]
        if (record)
            record.count++
        else {
            logRecord[message] = {
                count: 1,
                severity: severity
            }
        }
        //console.log(message, severity)
    }
    // $.timestamp = function (msg) {
    //     const datetime = new Date()
    //     logRecord[msg] = datetime
    // }
    $.start = function () {
        const datetime = new Date()
        logRecord = {}
        startDateTime = datetime
    }
    $.console = function () {
        console.log(logRecord)
    }
    $.show = function () {
        function addp(message, severity) {
            const p = document.createElement("p")
            p.setAttribute("class", "maas-log-" + severity.toLowerCase())
            p.textContent = message
            logdiv.appendChild(p)
        }
        function getTimeToPrepareReport() {
            const end = new Date()
            return `Time taken to prepare charts: ${dateTimeDiff(startDateTime, end, "Milliseconds") / 1000} seconds`
        }
        const logdiv = document.getElementById("log")
        if (!logdiv) {
            console.log("log div notfound")
            console.log(logRecord)
            console.log(getTimeToPrepareReport())
        }
        logdiv.innerHTML = ""
        for (const msg in logRecord) {
            const severity = logRecord[msg].severity
            addp(`${msg}. Count: ${logRecord[msg].count}`, severity)
        }
        addp(getTimeToPrepareReport(), "Information")
        //console.log(logRecord)
    }
    return $; // expose externally
}());