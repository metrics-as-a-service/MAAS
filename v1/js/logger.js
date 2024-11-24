const $l = (function () {
    "use strict"
    const self = {} // public object - returned at end of module
    let startDateTime
    const logRecord = {}

    function logKey(message, severity = "warning", chartNo) {
        return `${message} | ${severity} | ${chartNo}`
    }
    function logValues(logKey) {
        const logKeyParts = logKey.split("|")
        return {
            message: logKeyParts[0].trim(),
            severity: logKeyParts[1].trim(),
            chartNo: logKeyParts[2].trim(),
        }
    }
    self.clear = function () {
        for (const key in logRecord) {
            delete logRecord[key]
        }
    }
    self.log = function (message, severity = "warning", chartNo) {
        const logKey = `${message} | ${severity} | ${chartNo}`

        if (!logRecord[logKey]) logRecord[logKey] = 0
        logRecord[logKey] += 1
    }

    self.start = function () {
        this.clear()
        startDateTime = new Date()
    }
    self.console = function () {
        console.log(logRecord)
    }
    self.show = function () {
        const allCounts = getCounts()
        function resetChartLogs() {
            const counts = allCounts.counts
            for (const count in counts) {
                const chartId = getChartId(count)
                const chartContainerId = chartId + "-container"
                // const msg = _select(`#${chartContainerId} #msg`)
                const msg = _clearHTML(`#${chartContainerId} #msg`)
                // msg.innerHTML = ""
            }
        }
        function addP(message, severity, chartNo) {
            // if (severity.toLowerCase() == "error") console.error(message)

            const a = document.createElement("a")
            const messageClass = "maas-tag-" + severity.toLowerCase()
            a.setAttribute("class", messageClass)
            a.textContent = message

            const chartId = getChartId(chartNo)
            const chartContainerId = chartId + "-container"
            const msg = _select(`#${chartContainerId} #msg`)
            if (msg) {
                msg.appendChild(a)
                return
            }
            logDiv.appendChild(a)
        }
        function getTimeToPrepareReport() {
            const end = new Date()
            const ms = dateTimeDiff(startDateTime, end, "Milliseconds")
            return `Time taken to make charts: ${ms / 1000} seconds`
        }
        const logDiv = _clearHTML("#log")
        if (!logDiv) {
            console.error("Log div not found", logRecord)
            return
        }
        resetChartLogs()
        /////logs form allCounts
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
    return self // expose externally
})()
