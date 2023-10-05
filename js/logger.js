
var $l = (function () {
    'use strict'
    var $ = {};// public object - returned at end of module
    var startDateTime
    var logRecord = {}

    function logkey(message, severity = "warning", chartno) {
        return `${message} | ${severity} | ${chartno}`
    }
    function logkeyvalues(logkey) {
        const logkeyparts = logkey.split("|")
        return {
            message: logkeyparts[0].trim(),
            severity: logkeyparts[1].trim(),
            chartno: logkeyparts[2].trim(),
        }
    }
    $.clear = function () {
        logRecord = {}
    }
    $.log = function (message, severity = "warning", chartno) {
        const logkey = `${message} | ${severity} | ${chartno}`

        if (!logRecord[logkey]) logRecord[logkey] = 0
        logRecord[logkey] += 1
    }

    $.start = function () {
        const datetime = new Date()
        logRecord = {}
        startDateTime = datetime
    }
    $.console = function () {
        console.log(logRecord)
    }
    $.show = function () {
        function addp(message, severity, chartno) {
            const p = document.createElement("p")
            p.setAttribute("class", "maas-log-" + severity.toLowerCase())
            p.textContent = message
            if (!isNaN(chartno)) {//!= undefinedmessage.substring(0, 5) == "Chart") {
                //const chartno = Number(message.substring(6, 8).trim())-1

                const chartid = getChartId(chartno)
                const chartdiv = document.getElementById(chartid)
                if (chartdiv != null) {
                    chartdiv.appendChild(p)
                    return
                }
                else
                    p.setAttribute("class", "maas-log-error")
            }
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
        for (const logkey in logRecord) {
            const { message, severity, chartno } = logkeyvalues(logkey)
            const countinfo = logRecord[logkey].count > 1 ? `Count: ${logRecord[logkey].count}` : ""
            addp(`${message}. ${countinfo}`, severity, chartno)
        }
        addp(getTimeToPrepareReport(), "info")
    }
    return $; // expose externally
}());