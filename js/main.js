

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
    const $ = {};// public object - returned at end of module
    let totalRowCounts = 0, filteredRowCounts = 0
    $.getCountSummary = function () {
        return { totalRowCounts, filteredRowCounts }

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
        totalRowCounts = 0
        filteredRowCounts = 0
        if (filter !== undefined) {
            allCounts = JSON.parse(JSON.stringify(filter))
            zeroiseCounters(allCounts)
        }

        return new Promise((resolve) => {
            Papa.parse(file, {
                delimiter: ",",
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
    function countifIsTrue(countif, row, key) {
        function getCountifOutput() {
            const { isValid, output, error } = parseInput(countif.trim(), COUNTIF_GRAMMAR)
            if (!isValid) {
                $l.log(`'Count if' invalid. ${error}`, "warning", Number(key))
                return
            }
            return output
        }
        function getCountifPropoerties(output) {
            const outputprops = Object.keys(output)
            let error = false
            const optionpresent = (proprties) => {
                let propfound
                proprties.forEach(property => {
                    const index = outputprops.findIndex(outputproperty => outputproperty.toLowerCase() == property.toLowerCase())
                    if (index != -1) {
                        propfound = outputprops[index]
                        return
                    }
                })
                if (propfound == undefined) {
                    console.error(output, proprties)
                    error = true
                }
                return propfound
            }
            const includeorexclude = optionpresent(["excludeif", "includeif"])
            const op = optionpresent(["contains"])
            return { includeorexclude, op, error }
        }
        if (countif == undefined) return true
        if (countif.trim() == "") return true
        const output = getCountifOutput()
        if (!output) return false

        const { includeorexclude, op, error } = getCountifPropoerties(output)
        if (error) {
            $l.log(`'Count if' column invalid`, "warning", Number(key))
            return false
        }
        const countcol = output[includeorexclude]
        if (countcol == undefined) {
            $l.log(`'Count if' column name invalid`, "warning", Number(key))
            errorFound = true
            return false
        }

        function getval(col) {
            const rowkeys = Object.keys(row.data)
            const rowkeyindex = rowkeys.findIndex(k => k.toUpperCase() == col)
            return rowkeyindex == -1 ? undefined : row.data[rowkeys[rowkeyindex]]
        }
        const value = getval(countcol)

        if (value == undefined) {
            $l.log(`'Count if' column name invalid`, "warning", Number(key))
            errorFound = true
            return false
        }
        const comparevalues = output[op]
        let returnvalue = true
        if (op == "contains") {
            const index = comparevalues.findIndex(v => v.trim().toUpperCase() == value.toUpperCase())
            if (index == -1 && includeorexclude == "includeif") returnvalue = false
            if (index != -1 && includeorexclude == "excludeif") returnvalue = false
        }
        // if (op == "containsone") {
        //     const index = comparevalues.findIndex(v => v.trim().toUpperCase() == value.toUpperCase())
        //     if (index == -1 && includeorexclude == "includeif") return false
        //     if (index != -1 && includeorexclude == "excludeif") return false
        // }
        // if (op == "containsall") {
        //     const index = comparevalues.findIndex(v => v.trim().toUpperCase() == value.toUpperCase())
        //     if (index == -1 && includeorexclude == "includeif") return false
        //     if (index != -1 && includeorexclude == "excludeif") return false
        // }

        //TO DO reintroduce this?  if (!returnvalue) $l.log(`Some data skipped due to 'Count if' in this chart`, "info", Number(key))

        return returnvalue
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
                $l.log(`Av/Sum col (${col}) does not exist`, "Error", Number(key))
                return 0
            }
            if (isNaN(returnValue)) {
                $l.log(`Av/Sum col (${col}) is not a number`, "warning", Number(key))
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
            if (filteredRowCounts > maxEntries) return
            if (!oneCount[filteredRowCounts]) oneCount[filteredRowCounts] = { include: true }
            oneCount[filteredRowCounts].filteredValue = row.data
        }

        function countDataDescription(oneCount, filtered, key) {

            function initCounter() {
                for (const [key, value] of Object.entries(row.data)) {
                    oneCount[key] = {
                        include: true,
                        spaceCount: 0,
                        maxdate: undefined, mindate: undefined, numberDateCount: 0,
                        maxnumber: undefined, minnumber: undefined, numberValueCount: 0,
                        maxstring: undefined, minstring: undefined, numberStringCount: 0,
                    }
                }
            }

            function wrapup() {

            }

            if (!filtered) return

            if (filteredRowCounts == 1) initCounter()

            function getMin(currentvalue, value) {
                if (currentvalue == undefined) return value
                if (currentvalue > value) return value
                return currentvalue
            }

            function getMax(currentvalue, value) {
                if (currentvalue == undefined) return value
                if (currentvalue < value) return value
                return currentvalue
            }

            for (const [key, value] of Object.entries(row.data)) {
                const item = value.trim()
                const count = oneCount[key]
                if (item == "") {
                    count.spaceCount++
                    continue
                }
                if (isValidDate(item)) {
                    count.maxdate = getMax(count.maxdate, item)
                    count.mindate = getMin(count.mindate, item)
                    count.numberDateCount++
                    continue
                }
                if (!isNaN(item)) {
                    count.maxnumber = getMax(count.maxnumber, Number(item))
                    count.minnumber = getMin(count.minnumber, Number(item))
                    count.numberValueCount++
                    continue
                }
                count.maxstring = getMax(count.maxstring, item)
                count.minstring = getMin(count.minstring, item)
                count.numberStringCount++
            }
        }

        function countPlan(oneCount, filtered, key) {
            if (!filtered) return

            const { descriptionCol, startDateCol, endDateCol, actualStartDateCol, actualEndDateCol } = $p.getColProperties(key)

            function createdisplayothers(start, end, actualstart, actualend) {

                if (!oneCount[DISPLAY_OTHERS]) oneCount[DISPLAY_OTHERS] = { include: true, start, end, actualstart, actualend }

                const dispalyothers = oneCount[DISPLAY_OTHERS]
                if (dispalyothers.start > start) dispalyothers.start = start
                if (dispalyothers.end < end) dispalyothers.end = end
                if (dispalyothers.actualstart > actualstart) dispalyothers.actualstart = actualstart
                if (dispalyothers.actualend < actualend) dispalyothers.actualend = actualend

            }
            const desc = row.data[descriptionCol]
            if (!oneCount[desc]) oneCount[desc] = { include: true }
            const start = row.data[startDateCol]
            const end = row.data[endDateCol]

            const actualstart = row.data[actualStartDateCol]
            const actualend = row.data[actualEndDateCol]

            let errorFound = false

            const isColValid = (col) => {
                if (!col) {
                    $l.log(`Col (${col}) does not exist`, "Error", Number(key))
                    return false
                }
                if (!isValidDate(col)) {
                    $l.log(`(${col}) is not date`, "Warning", Number(key))
                    return false
                }
                return true
            }

            if (!isColValid(start)) errorFound = true
            if (!isColValid(end)) errorFound = true
            if (start > end) {
                $l.log(`Start > end Date`, "warning", Number(key))
                errorFound = true
            }
            if (actualstart)
                if (!isColValid(actualstart)) errorFound = true
            if (actualend)
                if (!isColValid(actualend)) errorFound = true
            if (actualstart)
                if (actualstart > actualend) {
                    $l.log(`Actual start > actual/estimated end Date`, "warning", Number(key))
                    errorFound = true
                }
            if (errorFound) return

            if (Object.keys(oneCount).length > 30) {
                // $l.log(`Task ... added as task count > 30`, "warning", Number(key))
                createdisplayothers(start, end, actualstart, actualend)
                return
            }

            oneCount[desc].start = start
            oneCount[desc].end = end
            oneCount[desc].actualstart = actualstart
            oneCount[desc].actualend = actualend
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
                forecast.forecastBasis = basisdays
                // forecast.forecastdays = forecastdays

                if (date <= trendStartDate) date = trendStartDate
                if (date > reportDate) return true
                if (!oneCount[date]) {
                    oneCount[date] = { ...init }
                }
                oneCount[date].count++
                if (basis <= basisdays) forecast.count++

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

            const { trendStartDate, dateCol, forecastBasis, countif, countCol, countValues, forecast } = col
            // const basisdays = forecastBasis
            const { basisdays } = getbasisdays(forecast, TREND_FORECAST_GRAMMAR, key)
            const { reportDate } = $p.getConfig()
            let errorFound = false

            const date = row.data[dateCol]
            if (!date) return //console.assert(date != undefined, `Col (${dateCol}) invalid`)
            if (date.trim() == "") return
            if (!isValidDate(date)) {
                $l.log(`Col (${dateCol}) is not date`, "warning", Number(key))
                errorFound = true
                return
            }
            initCounters()
            updateCounter(date, true)

        }
        function getbasisdays(forecast, trendgrammar, key) {
            if (forecast.trim() == "") return 0
            const { isValid, output } = parseInput(forecast, trendgrammar)
            if (!isValid) {
                $l.log(`Forecast invalid and ignored`, "Error", Number(key))
                return 0 //errorFound = true
            }
            const { basisdays, forecastdays } = output
            return { basisdays, forecastdays }
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
                forecast.forecastBasis = basisdays

                if (date <= trendStartDate) date = trendStartDate
                if (date > reportDate) return true
                if (!oneCount[date]) {
                    // console.log("oops", date, dateIn)
                    oneCount[date] = { ...INITIALVALUE }//initValue()//{ include: true, open: 0, close: 0}
                }

                if (open) {
                    oneCount[date].open++
                    if (basis > basisdays) return true
                    forecast.open++
                    if (forecast.basis < basis) forecast.basis = basis
                    return true
                }

                oneCount[date].close++
                if (basis > basisdays) return true
                forecast.close++
                if (forecast.basis < basis) forecast.basis = basis
                return true
            }
            if (!filtered) return
            const col = $p.getColProperties(key)
            const { trendStartDate, openDateCol, closeDateCol, forecastBasis, forecast } = col//$p.getColProperties(key)
            // const basisdays = forecastBasis
            const { basisdays } = getbasisdays(forecast, TRENDOC_FORECAST_GRAMMAR, key)

            const { reportDate } = $p.getConfig()
            let errorFound = false
            const openDate = row.data[openDateCol]
            if (openDate == undefined) {
                $l.log(`Open col (${openDateCol}) does not exist`, "Error", Number(key))
                errorFound = true
            }
            else if (!isValidDate(openDate)) {
                $l.log(`Open col (${openDateCol}) is not date`, "warning", Number(key))
                errorFound = true
            }


            const closeDate = row.data[closeDateCol]
            concole.log(row.data) //Fix
            const isClosed = !closeDate && closeDate.trim() != ""
            if (isClosed) {
                if (closeDate == undefined) {
                    $l.log(`Close col (${closeDateCol}) does not exist`, "Error", Number(key))
                    errorFound = true
                }
                else if (!isValidDate(closeDate)) {
                    $l.log(`Open col (${closeDateCol}) is not date`, "warning", Number(key))
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
                oneCount["SKIP"].id = currentid
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

            const { idCol, toCol, fromCol, timestampCol } = $p.getColProperties(key)
            const tofrom = value.formatedValue
            const status = tofrom.split("|")
            const to = status[0].trim()
            const from = status[1].trim()

            let currentTimestamp = row.data[timestampCol]
            const currentid = row.data[idCol]
            if (!isValidDate(currentTimestamp)) {
                $l.log(`Timestamp col (${timestampCol}) is not a date`, "warning", Number(key))
                currentTimestamp = reportDate

            }
            if (!oneCount["SKIP"]) {
                oneCount["SKIP"] = { id: currentid, include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }
            }
            if (currentid != oneCount["SKIP"].id) {
                wrapUpLastOne()
                storeCurrentRecordReadyForNextOne()
                return
            }
            // if (from == "") {
            //     if (oneCount["SKIP"].from) wrapUpLastOne()
            //     storeCurrentRecordReadyForNextOne()
            //     return
            // }

            //const fromto = statusFrom + "|" + statusTo
            if (from != "") {
                if (!oneCount[tofrom]) oneCount[tofrom] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }

                const fromto = from + "|" + to
                if (!oneCount[fromto]) oneCount[fromto] = { include: true, totalSum: 0, filteredSum: 0, totalCount: 0, filteredCount: 0 }

                oneCount[tofrom].filteredCount++

                const prevTimestamp = oneCount["SKIP"].timestamp
                let datediff = dateTimeDiff(prevTimestamp, currentTimestamp, "Days")
                if (datediff < 0) {
                    $l.log(`Timestamp col (${timestampCol}) not in incraesing order`, "warning", Number(key))
                    datediff = 0
                }
                oneCount[tofrom].filteredSum += datediff//dateTimeDiff(prevTimestamp, currentTimestamp, "Days")
            }
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
        function countListMembers(oneCount, filtered, key, value,) {
            function countMembers() {
                let numberofMembers = 0
                listmembers.forEach(v => {
                    if (v.trim() != "") numberofMembers++
                })
                if (!oneCount[numberofMembers]) oneCount[numberofMembers] = { include: true, filteredCount: 0 }
                oneCount[numberofMembers].filteredCount++
            }
            function countByMember() {
                listmembers.forEach(v => {
                    const member = v.trim()
                    if (member == "") return
                    if (!oneCount[member]) oneCount[member] = { include: true, filteredCount: 0 }
                    oneCount[member].filteredCount++
                })

            }
            const { separator, countif } = $p.getColProperties(key)
            const list = value.formatedValue.trim()
            const listmembers = new Set(list.split(separator))
            // countMembers()
            // if (!countifIsTrue(countif, row)) return //TO DO remove
            countByMember()
        }

        totalRowCounts++
        //if (totalRowCounts<5) console.log(totalRowCounts, transformedRow)
        //if (rowCount < 3) console.log(`row number: ${rowCount}`, row.data)

        let transformedRow = $p.transformRow(row.data)

        for (const [key, value] of Object.entries(transformedRow)) {

            if (!allCounts[key]) allCounts[key] = {}
            const oneCount = allCounts[key]
            const { countType, type, colOver, countif } = $p.getColProperties(key)

            if (!countifIsTrue(countif, row, key)) continue
            if ($p.hasSpecialCounter(type)) continue

            let v = value.formatedValue
            if (!oneCount[v]) {
                if (Object.keys(oneCount).length < 100)
                    oneCount[v] = createDefault(countType, value.unFormatedValue)
                else {
                    v = DISPLAY_OTHERS
                    //console.log("before", check(allCounts[key]))
                    if (!oneCount[v])
                        oneCount[v] = createDefault(DISPLAY_OTHERS)
                    transformedRow[key] = { formatedValue: v, unFormatedValue: v }
                }
            }
            oneCount[v].totalCount++
            if (storeSum(countType)) oneCount[v].totalSum += getAvSumValue(key, colOver)
        }

        // update filtered counts 
        let includeInCount = true

        for (const [key, value] of Object.entries(transformedRow)) {
            const { type, countif } = $p.getColProperties(key)
            if (!countifIsTrue(countif, row, key)) continue
            if ($p.cannotFilter(type)) continue
            if (!allCounts[key][value.formatedValue].include) {
                includeInCount = false
                break
            }
            // }
        }

        if (includeInCount) {
            filteredRowCounts++

            for (const [key, value] of Object.entries(transformedRow)) {
                const { countType, type, colOver, countif } = $p.getColProperties(key)
                if (!countifIsTrue(countif, row, key)) continue
                const oneCount = allCounts[key]

                if (type == "Data Table") {///// move these to chartType????????????
                    countTable(oneCount, true, key)
                    continue
                }
                if (type == "Data Description") {
                    countDataDescription(oneCount, true, key)
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
                if (type == "List Members") {
                    countListMembers(oneCount, true, key, value)
                    continue
                }
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

