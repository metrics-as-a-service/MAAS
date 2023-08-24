

////////////////////////////////////////////////////
// {
//  col1: {
//      value1: {
//          include: true|false, 
//          totqaValue: value if sum, 
//          filteredValue: value if sum
//          totalCount: count, 
//          filteredCount: count
//      }
//      value2: {...},
//      ....
//     }
//  col2: ...
// }

//const { config } = require("process");

/////////////////////////////////////////////////////
var $c = (function () {
    'use strict'
    let $ = {};// public object - returned at end of module
    let totalRows = 0, filteredRows = 0
    $.getCountSummary = function () {
        return { totalRows, filteredRows }

    }

    $.processCSVFile = function (file, filter, configAction = "Keep Config") {

        function zeroiseCounters(allCounts) {
            for (const [key, value] of Object.entries(allCounts)) {
                function setZeroDefault() {
                    for (const v of Object.values(value)) {
                        v.totalSum = 0
                        v.filteredSum = 0
                        v.totalCount = 0
                        v.filteredCount = 0
                    }
                }
                const { type } = $p.getColProperties(key)
                if (type == "State Change") {
                    setZeroDefault()
                    continue
                }
                if ($p.hasSpecialCounter(type)) {
                    allCounts[key] = {}
                    continue
                }
                setZeroDefault()
            }
        }

        var rowCount = 0,
            allCounts = {}
        totalRows = 0
        filteredRows = 0
        if (filter !== undefined) {
            allCounts = JSON.parse(JSON.stringify(filter))
            zeroiseCounters(allCounts)
        }

        return new Promise((resolve) => {
            Papa.parse(file, {
                download: true,
                header: true,
                step: function (row) {
                    rowCount++
                    if (rowCount == 1) {
                        $p.autoCreateConfig(file, row, configAction)
                    }
                    countRecords(rowCount, row, allCounts, filter)
                },
                complete: function () {
                    //console.log(`All done! ${rowCount} rows processed`)
                    countRecords(undefined, undefined, allCounts, undefined, true)
                    resolve(allCounts)
                }
            })
        })
    }


    function countRecords(rowCount, row, allCounts, filter, EOFReached = false) {
        function createDefault(countType, sortkey) {
            return {
                include: true,          // true mean include in counts
                totalSum: 0,            // if sum/ave then sum without filter
                filteredSum: 0,         // if sum/ave then sum when filtered
                totalCount: 0,          // count without filter
                filteredCount: 0,       // count when filtered
                sortkey: sortkey,       // sortkey to arrange the chart
                // value: undefined,       //
                // fiteredValue: undefined,       //
            }

        }
        function getAvSumValue(key, col) {
            let returnValue = row.data[col]
            if (!returnValue) {
                $l.log(`Chart ${Number(key) + 1}: Av/Sum col (${col}) does not exist`, "Error")
                return 0
            }
            if (isNaN(returnValue)) {
                $l.log(`Chart ${Number(key) + 1}: Av/Sum col (${col}) is not a number`)
                return 0
            }
            return Number(returnValue) // parseFloat(returnValue)
        }
        function storeSum(countType) {
            if (countType == "Average") return true
            if (countType == "Sum") return true
            return false
        }
        function countTable(oneCount, filtered, key) {
            const { maxEntries } = $p.getColProperties(key)
            if (!filtered) return
            if (filteredRows > maxEntries) return
            if (!oneCount[filteredRows]) oneCount[filteredRows] = { include: true }
            oneCount[filteredRows].filteredValue = row.data
        }
        function countPlan(oneCount, filtered, key) {
            if (!filtered) return

            const { descriptionCol, startDateCol, endDateCol } = $p.getColProperties(key)


            const desc = row.data[descriptionCol]
            if (!oneCount[desc]) oneCount[desc] = { include: true }
            const start = row.data[startDateCol]
            const end = row.data[endDateCol]
            let errorFound = false
            if (!start) {
                $l.log(`Chart ${Number(key) + 1}: Start date col (${startDateCol}) does not exist`, "Error")
                errorFound = true
            }
            else if (!isValidDate(start)) {
                $l.log(`Chart ${Number(key) + 1}: Start date col (${startDateCol}) is not date`)
                errorFound = true
            }
            if (!end) {
                $l.log(`Chart ${Number(key) + 1}: End date col (${endDateCol}) does not exist`, "Error")
                errorFound = true
            }
            else if (!isValidDate(end)) {
                $l.log(`Chart ${Number(key) + 1}: End date col (${endDateCol}) is not date`)
                errorFound = true
            }
            if (errorFound) return
            oneCount[desc].start = start
            oneCount[desc].end = end
        }
        function countTrend(oneCount, filtered, key) {
            //function initValue() {
            const init = { include: true, /*open: 0, close: 0, */ count: 0 } // trendOC const init = { include: true, open: 0, close: 0 }
            //    return JSON.parse(JSON.stringify(init))
            //}
            function initCounters() {
                if (oneCount[trendStartDate]) return
                const dateRange = $p.getOrderedValues("Trend", col)
                dateRange.forEach(v => {
                    oneCount[v] = { ...init }
                })
                oneCount.forecast = { ...init }
            }
            function updateCounter(dateIn, open) {
                let date = $p.getFotmattedValue(col, dateIn).formatedValue
                const basis = dateTimeDiff(dateIn, reportDate, "Days")
                const forecast = oneCount["forecast"]
                forecast.forecastBasis = forecastBasis
                // if (date == "?") {
                //     const columnname = open ? "Open" : "Close"
                //     $l.log(`Invalid date in ${columnname} column`)
                //     return false
                // }
                if (date <= trendStartDate) date = trendStartDate
                if (date > reportDate) return true
                if (!oneCount[date]) {
                    oneCount[date] = { ...init }
                }
                oneCount[date].count++
                if (basis <= forecastBasis) forecast.count++

                // trend OC below
                // if (open) {
                //     oneCount[date].open++
                //     if (basis > forecastBasis) return true
                //     forecast.open++
                //     if (forecast.basis < basis) forecast.basis = basis
                //     return true
                // }

                // oneCount[date].close++
                // if (basis > forecastBasis) return true
                // forecast.close++
                // if (forecast.basis < basis) forecast.basis = basis
                return true
            }
            if (!filtered) return
            const col = $p.getColProperties(key)
            // const { trendStartDate, openDateCol, closeDateCol, forecastBasis } = col//Trend OC

            const { trendStartDate, dateCol, forecastBasis, countCol, countValues } = col
            const { reportDate } = $p.getConfig()
            let errorFound = false

            const date = row.data[dateCol]
            console.assert(date != undefined, `Col (${dateCol}) invalid`)
            if (date.trim() != "") {
                if (!isValidDate(date)) {
                    $l.log(`Chart ${Number(key) + 1}: Col (${dateCol}) is not date`)
                    errorFound = true
                    return
                }
                initCounters()
    
                if (countValues != "") {
                    const value = row.data[countCol].toUpperCase()
                    if (countValues.toUpperCase().indexOf(value) == -1) return
                }

                updateCounter(date, true)
            }
        }
        function countTrendOC(oneCount, filtered, key) {
            const INITIALVALUE = { include: true, open: 0, close: 0 }
            // function initValue() {
            //     const init = { include: true, open: 0, close: 0 }
            //     return JSON.parse(JSON.stringify(init))
            // }
            function initCounters() {
                if (oneCount[trendStartDate]) return
                const dateRange = $p.getOrderedValues("Trend OC", col)
                dateRange.forEach(v => {
                    oneCount[v] = { ...INITIALVALUE }
                })
                oneCount.forecast = { ...INITIALVALUE }//initValue()//{ include: true, basis: 0, open: 0, close: 0 }
            }
            function updateCounter(dateIn, open) {
                let date = $p.getFotmattedValue(col, dateIn).formatedValue //new Date(dateIn)
                const basis = dateTimeDiff(dateIn, reportDate, "Days")
                const forecast = oneCount["forecast"]
                forecast.forecastBasis = forecastBasis
                // if (date == "?") {
                //     const columnname = open ? "Open" : "Close"
                //     $l.log(`Invalid date in ${columnname} column`)
                //     return false
                // }
                if (date <= trendStartDate) date = trendStartDate
                if (date > reportDate) return true
                if (!oneCount[date]) {
                    // console.log("oops", date, dateIn)
                    oneCount[date] = { ...INITIALVALUE }//initValue()//{ include: true, open: 0, close: 0}
                }

                if (open) {
                    oneCount[date].open++
                    if (basis > forecastBasis) return true
                    forecast.open++
                    if (forecast.basis < basis) forecast.basis = basis
                    return true
                }

                oneCount[date].close++
                if (basis > forecastBasis) return true
                forecast.close++
                if (forecast.basis < basis) forecast.basis = basis
                return true
            }
            if (!filtered) return
            const col = $p.getColProperties(key)
            const { trendStartDate, openDateCol, closeDateCol, forecastBasis } = col//$p.getColProperties(key)
            const { reportDate } = $p.getConfig()
            let errorFound = false
            const openDate = row.data[openDateCol]
            if (openDate == undefined) {
                $l.log(`Chart ${Number(key) + 1}: Open col (${openDateCol}) does not exist`, "Error")
                errorFound = true
            }
            else if (!isValidDate(openDate)) {
                $l.log(`Chart ${Number(key) + 1}: Open col (${openDateCol}) is not date`)
                errorFound = true
            }


            const closeDate = row.data[closeDateCol]
            const isClosed = closeDate.trim() == ""
            if (!isClosed) {
                if (closeDate == undefined) {
                    $l.log(`Chart ${Number(key) + 1}: Close col (${closeDateCol}) does not exist`, "Error")
                    errorFound = true
                }
                else if (!isValidDate(closeDate)) {
                    $l.log(`Chart ${Number(key) + 1}: Open col (${closeDateCol}) is not date`)
                    errorFound = true
                }
            }

            if (errorFound) return

            initCounters()
            updateCounter(openDate, true)

            if (isClosed) updateCounter(closeDate, false)

        }
        function countStateChange(oneCount, filtered, key, value, EOFReached = false) {
            function wrapUpLastOne() {
                const prevFrom = "<Now>" + "|" + oneCount["SKIP"].to
                if (!oneCount[prevFrom]) {
                    oneCount[prevFrom] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }
                }
                oneCount[prevFrom].filteredCount++
                const prevTimestamp = oneCount["SKIP"].timestamp
                oneCount[prevFrom].filteredSum += dateTimeDiff(prevTimestamp, reportDate, "Days")
            }
            function storeCurrentRecordReadyForNextOne() {
                oneCount["SKIP"].timestamp = currentTimestamp
                oneCount["SKIP"].from = from
                oneCount["SKIP"].to = to
            }
            const { reportDate } = $p.getConfig()
            if (EOFReached) {
                wrapUpLastOne()
                return
            }
            if (!filtered) return

            const { toCol, fromCol, timestampCol } = $p.getColProperties(key)
            const tofrom = value.formatedValue
            const status = tofrom.split("|")
            const to = status[0].trim()
            const from = status[1].trim()

            let currentTimestamp = row.data[timestampCol]
            if (!isValidDate(currentTimestamp)) {
                $l.log(`Chart ${Number(key) + 1}: Timestamp col (${timestampCol}) is not a date`)
                currentTimestamp = reportDate

            }
            if (!oneCount["SKIP"]) {
                oneCount["SKIP"] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }
            }

            if (from == "") {
                if (oneCount["SKIP"].from)
                    wrapUpLastOne()
                storeCurrentRecordReadyForNextOne()
                return
            }

            //const fromto = statusFrom + "|" + statusTo
            if (!oneCount[tofrom]) oneCount[tofrom] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }

            const fromto = from + "|" + to
            if (!oneCount[fromto]) oneCount[fromto] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }

            oneCount[tofrom].filteredCount++
            const prevTimestamp = oneCount["SKIP"].timestamp
            let datediff = dateTimeDiff(prevTimestamp, currentTimestamp, "Days")
            if (datediff < 0) {
                $l.log(`Chart ${Number(key) + 1}: Timestamp col (${timestampCol}) is not in incraesing order`)
                datediff = 0
            }
            oneCount[tofrom].filteredSum += dateTimeDiff(prevTimestamp, currentTimestamp, "Days")

            storeCurrentRecordReadyForNextOne()
        }
        //if past last recod the update the counters that need updating 
        if (EOFReached) {
            for (const key in allCounts) {
                const { type } = $p.getColProperties(key)
                if (type == "State Change") {
                    const oneCount = allCounts[key]
                    countStateChange(oneCount, undefined, key, undefined, EOFReached)
                }
            }
            return
        }
        // function countList(oneCount, filtered, key, value,) {
        //     function countMembers() {
        //         let numberofMembers = 0
        //         listmembers.forEach(v => {
        //             if (v.trim() != "") numberofMembers++
        //         })
        //         if (!oneCount[numberofMembers]) oneCount[numberofMembers] = { include: true, filteredCount: 0 }
        //         oneCount[numberofMembers].filteredCount++
        //     }
        //     function countByMember() {
        //         listmembers.forEach(v => {
        //             const member = v.trim()
        //             if (!oneCount[member]) oneCount[member] = { include: true, filteredCount: 0 }
        //             oneCount[member].filteredCount++
        //         })

        //     }
        //     const { separator } = $p.getColProperties(key)
        //     const list = value.formatedValue.trim()
        //     const listmembers = list.split(separator)
        //     countMembers()
        //     // countByMember()
        // }

        totalRows++
        //if (totalRows<5) console.log(totalRows, transformedRow)
        //if (rowCount < 3) console.log(`row number: ${rowCount}`, row.data)

        let transformedRow = $p.transformRow(row.data)
        for (const [key, value] of Object.entries(transformedRow)) {

            if (!allCounts[key]) allCounts[key] = {}
            const oneCount = allCounts[key]
            const { countType, type, colOver } = $p.getColProperties(key)

            if ($p.hasSpecialCounter(type)) continue

            let v = value.formatedValue
            if (!oneCount[v]) {
                if (Object.keys(oneCount).length < 30)
                    oneCount[v] = createDefault(countType, value.unFormatedValue)
                else {
                    v = "..."
                    //console.log("before", check(allCounts[key]))
                    if (!oneCount[v])
                        oneCount[v] = createDefault("...")
                    transformedRow[key] = { formatedValue: v, unFormatedValue: v }
                }
            }

            oneCount[v].totalCount++
            if (storeSum(countType)) oneCount[v].totalSum += getAvSumValue(key, colOver)
        }

        // update filtered counts 
        let includeInCount = true

        for (const [key, value] of Object.entries(transformedRow)) {
            const { type } = $p.getColProperties(key)

            if ($p.cannotFilter(type)) continue

            if (!allCounts[key][value.formatedValue].include) {
                includeInCount = false
                break
            }
            // }
        }

        if (includeInCount) {
            filteredRows++

            for (const [key, value] of Object.entries(transformedRow)) {
                const { countType, type, colOver } = $p.getColProperties(key)
                const oneCount = allCounts[key]

                if (type == "Data Table") {///// move these to chartType????????????
                    countTable(oneCount, true, key)
                    continue
                }
                if (type == "Plan") {
                    countPlan(oneCount, true, key)
                    continue
                }
                if (type == "Trend OC") {
                    countTrendOC(oneCount, true, key)
                    continue
                }
                if (type == "Trend") {
                    countTrend(oneCount, true, key)
                    continue
                }
                if (type == "State Change") {
                    countStateChange(oneCount, true, key, value)
                    continue
                }
                // if (type == "List") {
                //     countList(oneCount, true, key, value)
                //     continue
                // }
                if (type == "Note") {
                    continue
                }
                oneCount[value.formatedValue].filteredCount++
                if (storeSum(countType)) oneCount[value.formatedValue].filteredSum += getAvSumValue(key, colOver)
            }
        }
    }
    return $
})()

