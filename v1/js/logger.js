//import common
//export { clearLogs, startLog, showLogs }
//steps comment const $.. () {  and the last return {} & }

;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Logger = global.Logger || {})))
    // in strict mode we cannot access arguments.callee, so we need a named reference to
    // stringify the factory method for the blob worker
    // eslint-disable-next-line func-name
})(this, function (exports) {
    "use strict"
    let startDateTime
    const logRecord = {}

    function logValues(logKey) {
        const logKeyParts = logKey.split("|")
        return {
            message: logKeyParts[0].trim(),
            severity: logKeyParts[1].trim(),
            chartNo: logKeyParts[2].trim(),
        }
    }

    function clearLogs() {
        for (const key in logRecord) {
            delete logRecord[key]
        }
    }
    function startLogs() {
        clearLogs()
        startDateTime = new Date()
    }
    function showLogs() {
        const allCounts = getCounts()
        function resetChartLogs() {
            const counts = allCounts.counts
            for (const key in counts) {
                const chartContainerId = getChartContainer(key)
                _.clearHTML(`#${chartContainerId} #msg`)
            }
        }
        function addP(message, severity, chartNo) {
            const a = document.createElement("a")
            const messageClass = "maas-tag-" + severity.toLowerCase()
            a.setAttribute("class", messageClass)
            a.textContent = message
            const chartContainerId = getChartContainer(chartNo)
            const msg = _.select(`#${chartContainerId} #msg`)
            if (msg) {
                msg.appendChild(a)
                return
            }
            logDiv.appendChild(a)
        }
        function getTimeToPrepareReport() {
            const end = new Date()
            const ms = _.dateTimeDiff(startDateTime, end, "Milliseconds")
            return `Time taken to make charts: ${ms / 1000} seconds`
        }
        const logDiv = _.clearHTML("#log")
        if (!logDiv) {
            console.error("Log div not found", logRecord)
            return
        }
        resetChartLogs()
        const memo = allCounts.memo

        for (const item in memo) {
            const log = memo[item].log
            if (!log) continue
            for (const key in log) {
                const message = `${key} (${log[key].count}, ${log[key].first}-${log[key].last})`
                addP(message, log[key].severity, item)
            }
        }
        ////logs outside allCounts
        for (const logKey in logRecord) {
            const { message, severity, chartNo } = logValues(logKey)
            const countInfo =
                logRecord[logKey].count > 1
                    ? `(${logRecord[logKey].count})`
                    : ""
            addP(`${message} ${countInfo}`, severity, chartNo)
        }

        addP(getTimeToPrepareReport(), "info")
    }
    exports.clearLogs = clearLogs
    exports.startLogs = startLogs
    exports.showLogs = showLogs
})
