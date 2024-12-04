;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Counter = global.Counter || {})))
})(this, function (exports) {
    "use strict"
    const SYMBOL_OTHERS = Symbol()
    const SYMBOL_INVALID = Symbol()
    const SYMBOL_INVALID_NUMBER = Symbol()
    const SYMBOL_INVALID_DATE = Symbol()
    const SYMBOL_SPACES = Symbol()
    const SYMBOL_LESS = Symbol()
    const SYMBOL_MORE = Symbol()

    function symbolToDisplay(v) {
        if (v === SYMBOL_OTHERS) return DISPLAY_OTHERS
        if (v === SYMBOL_INVALID) return DISPLAY_INVALID
        if (v === SYMBOL_INVALID_NUMBER) return DISPLAY_INVALID_NUMBER
        if (v === SYMBOL_INVALID_DATE) return DISPLAY_INVALID_DATE
        if (v === SYMBOL_SPACES) return DISPLAY_SPACES
        if (v === SYMBOL_LESS) return DISPLAY_LESS
        if (v === SYMBOL_MORE) return DISPLAY_MORE
        return v
    }
    function getDisplayValue(countType, v) {
        const count = v.count != undefined ? v.count : v.filteredCount
        const sum = v.sum != undefined ? v.sum : v.filteredSum

        if (countType.substring(0, 3) == "Sum") return sum

        const av = count > 0 ? Number((sum / count).toFixed(1)) : 0
        if (countType.substring(0, 7) == "Average") return av

        return count
        // if (countType == "Sum" || countType == "Sum of Transition Duration")
        // return sum
        // if (
        //     countType == "Average" ||
        //     countType == "Average of Transition Duration"
        // )
        // return count > 0 ? Number((sum / count).toFixed(1)) : 0
    }
    async function readCSV(
        resolveValue,
        { file, step, error, complete, preview = 0, token }
    ) {
        const isRemoteFile = typeof file === "string"
        // const isPrivate = isRemoteFile ? file.includes("?private") : false
        // function parseTokenFile(file) {
        //     if (typeof file !== "string") return file
        //     const splitURL = file.split("?private")
        //     if (splitURL.length == 1) return file
        //     return splitURL[0]
        // }
        // const stream = parseTokenFile(file)
        // const token = "xxx"
        const downloadRequestHeaders = token
            ? {
                  Authorization: `token ${token}`,
                  Accept: "application/vnd.github.v3.raw",
              }
            : undefined

        const p = await new Promise((resolve) => {
            Papa.parse(file, {
                delimiter: ",",
                download: isRemoteFile,
                worker: isRemoteFile,
                header: true,
                skipEmptyLines: true,
                downloadRequestHeaders,
                preview,
                step: (row) => step(row),
                error: (err, file) => resolve({ err }),
                complete: (result, file) => {
                    resolve(resolveValue)
                    complete(result, file)
                },
            })
        })
        return p
    }

    function getOrderedValues(chartType, chartProp, param) {
        if (!chartType) return []
        if (!chartTypes[chartType]) return []

        const orderedValues = chartTypes[chartType].orderedValues
        if (orderedValues) return orderedValues(chartProp, param)
        return []
    }

    async function getFirstRecord(file) {
        let firstRow
        return await readCSV(firstRow, {
            file,
            step: (row) => {
                firstRow = row
            },
            error: (err, file) => console.error({ err, file }),
            complete: () => {
                //resolve(firstRow)
            },
        })
    }

    async function getCountsFromFile(inputJSON, localFile) {
        //TO DO FIX THIS MAJOR FUDGE on local file !!!!!!!!!!!!!!!!!!<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        //if remote file then it is in config else it is f
        //also later in client server we cant pass f (can we?)
        const SYMBOL_PREV_STATE = Symbol()
        let totalRowCounts = 0,
            filteredRowCounts = 0,
            isStartOfFile = true,
            fileError,
            dataDescription = {}

        totalRowCounts = 0
        filteredRowCounts = 0
        const inputParams = JSON.parse(inputJSON)
        const { filter, config } = inputParams
        //to do deal with multiple files
        const file = localFile ? localFile : config.files[0]

        if (!config) {
            await passOne(file, 0)
            return dataDescription
        }
        const isDefined = (v) => v !== undefined
        const hasFilterInInput = filter !== undefined
        function isColumnFiltered(x_column) {
            const { chartProperties } = config
            const chartsWithFilterOnX = chartProperties
                .map((chart, i) => ({ ...chart, key: i }))
                .filter((chart) => chart.x_column === x_column)
                .filter((chart) => {
                    let isChartFiltered = false
                    const count = allCounts.counts[chart.key]
                    for (const cat in count) {
                        const include = count[cat].include
                        if (isDefined(include) && !include)
                            isChartFiltered = true
                    }
                    return isChartFiltered
                })

            return chartsWithFilterOnX.length > 0
        }

        const allCounts = hasFilterInInput
            ? JSON.parse(JSON.stringify(filter))
            : { memo: {}, counts: {}, callOuts: {} }

        if (hasFilterInInput) zeroCounters(allCounts)

        const { presetOffsetDays } = config
        // TO DO too many async awaits - simplify

        ////////////////////////////////////////////////////////////////////////// pass 1
        if (filter === undefined) {
            await passOne(file, presetOffsetDays)
            if (fileError) {
                console.log(fileError)
                log(fileError.err, "0", "error")
                return allCounts
            }
            allCounts.memo.dataDescription = dataDescription
        }
        clearLog()
        const pass1allCounts = await passTwo(file, allCounts)
        const files = config.files
        const hasOneFile = file ? true : files.length === 1
        if (hasOneFile) return pass1allCounts

        return await passTwo(files[1], pass1allCounts, true)
        /////////////////////////////////////////////////////////////////
        function passTwo(file, allCounts, secondFile = false) {
            const counts = secondFile ? {} : allCounts
            const response = /* await */ readCSV(counts, {
                file,
                step: (uncleanRow) => {
                    if (uncleanRow.errors.length > 0) {
                        console.error(errors)
                    }
                    const row = cleanRow(uncleanRow.data, presetOffsetDays)
                    countRecords(counts, row)
                },
                error: (err, file) => console.error({ err, file }),
                complete: () => {
                    wrapUp(counts)
                },
            })
            return response
        }
        function countRecords(allCounts, row) {
            const isEndOfFile = !row
            if (isEndOfFile) {
                if (!allCounts.memo.global) allCounts.memo.global = {}

                Object.assign(allCounts.memo.global, {
                    totalRowCounts,
                    filteredRowCounts,
                })

                for (const key in allCounts.counts) countBasedOnType(key)

                return
            }
            totalRowCounts++

            let rowForFilter = new Array(config.chartProperties.length).fill(
                undefined
            )

            for (const key in rowForFilter) {
                if (!allCounts.counts[key]) allCounts.counts[key] = {}
                countBasedOnType(key, false)
            }
            isStartOfFile = false

            let includeRowInReport = true
            for (const key in rowForFilter) {
                const { chartType } = getChartProps(key)
                if (cannotFilter(chartType)) continue
                const value = rowForFilter[key]
                if (value === undefined) continue
                if (!allCounts.counts[key][value])
                    console.log({
                        key,
                        value,
                        totalRowCounts,
                        rowForFilter,
                        count: allCounts.counts[key],
                    })
                if (!allCounts.counts[key][value].include) {
                    includeRowInReport = false
                    break
                }
            }
            if (!includeRowInReport) return

            filteredRowCounts++

            for (const key in rowForFilter) {
                if (includeRowInChart(key, row)) countBasedOnType(key, true)
            }
            function getSumValue(key, countColumn) {
                if (!countColumn) return 0
                const value = row[countColumn]
                if (!isValidData(value, "number", "Av/Sum", key)) return 0
                return Number(value)
            }
            function countTable(key, oneCount, isFiltered) {
                if (isEndOfFile) return
                const { maxEntries } = getChartProps(key)
                if (!isFiltered) return
                if (Object.keys(oneCount).length >= maxEntries) {
                    //delete the middle one
                    delete oneCount[
                        filteredRowCounts - Math.round(maxEntries / 2)
                    ]
                }
                if (!oneCount[filteredRowCounts])
                    oneCount[filteredRowCounts] = { include: true }
                oneCount[filteredRowCounts].filteredValue = row
            }
            function countDataDescription(key, oneCount, isFiltered) {
                function initCounter() {
                    for (const key in row) {
                        oneCount[key] = {
                            include: true,
                            spaceCount: 0,
                            maxDate: undefined,
                            minDate: undefined,
                            dateCount: 0,
                            maxNumber: undefined,
                            totalNumber: 0,
                            minNumber: undefined,
                            numberCount: 0,
                            maxString: undefined,
                            minString: undefined,
                            numberStringCount: 0,
                        }
                    }
                }
                if (isEndOfFile) return
                if (!isFiltered) return
                if (filteredRowCounts == 1) initCounter()

                function getMin(currentValue, value) {
                    if (currentValue == undefined) return value
                    if (currentValue > value) return value
                    return currentValue
                }

                function getMax(currentValue, value) {
                    if (currentValue == undefined) return value
                    if (currentValue < value) return value
                    return currentValue
                }

                for (const [key, value] of Object.entries(row)) {
                    const item = value.trim()
                    const count = oneCount[key]
                    if (item == "") {
                        count.spaceCount++
                        continue
                    }
                    if (_.isValidDate(item)) {
                        count.maxDate = getMax(count.maxDate, item)
                        count.minDate = getMin(count.minDate, item)
                        count.dateCount++
                        continue
                    }
                    if (!isNaN(item)) {
                        const n = Number(item)
                        count.maxNumber = getMax(count.maxNumber, n)
                        count.minNumber = getMin(count.minNumber, n)
                        count.totalNumber += n
                        count.numberCount++
                        continue
                    }
                    count.maxString = getMax(count.maxString, item)
                    count.minString = getMin(count.minString, item)
                    count.stringCount++
                }
            }
            function countPlan(key, oneCount, isFiltered) {
                if (isEndOfFile) return
                if (!isFiltered) return
                if (!includeRowInChart(key, row)) return

                const {
                    descriptionCol,
                    startDateCol,
                    endDateCol,
                    secondStartDateCol,
                    secondEndDateCol,
                    RAGCol,
                } = getChartProps(key)

                function createOthers(
                    start,
                    end,
                    secondStartDate,
                    secondEndDate,
                    rag
                ) {
                    if (!oneCount[DISPLAY_OTHERS])
                        oneCount[DISPLAY_OTHERS] = {
                            include: true,
                            start,
                            end,
                            secondStartDate,
                            secondEndDate,
                            rag: undefined,
                        }

                    const others = oneCount[DISPLAY_OTHERS]
                    if (others.start > start) others.start = start
                    if (others.end < end) others.end = end
                    if (others.secondStartDate > secondStartDate)
                        others.secondStartDate = secondStartDate
                    if (others.secondEndDate < secondEndDate)
                        others.secondEndDate = secondEndDate
                }
                const desc = row[descriptionCol]
                if (!oneCount[desc]) oneCount[desc] = { include: true }
                const start = row[startDateCol]
                const end = row[endDateCol]
                const secondStartDate = row[secondStartDateCol]
                const secondEndDate = row[secondEndDateCol]
                const rag = row[RAGCol]
                let errorFound = false
                if (!isValidData(start, "date", "First start", key))
                    errorFound = true
                if (!isValidData(end, "date", "First end", key))
                    errorFound = true

                if (start > end) {
                    log(`Start > end`, key)
                    errorFound = true
                }
                if (secondStartDate)
                    if (
                        !isValidData(
                            secondStartDate,
                            "date",
                            "Second start",
                            key
                        )
                    )
                        errorFound = true
                if (secondEndDate)
                    if (!isValidData(secondEndDate, "date", "Second end", key))
                        errorFound = true

                if (secondStartDate && secondEndDate) {
                    if (secondStartDate > secondEndDate) {
                        log(`Second start > end`, key)
                        errorFound = true
                    }
                }
                if (secondStartDate && !secondEndDate) {
                    log(`Second start but no end`, key)
                    errorFound = true
                }
                if (!secondStartDate && secondEndDate) {
                    log(`Second end but no start`, key)
                    errorFound = true
                }

                if (errorFound) return

                if (Object.keys(oneCount).length > 30) {
                    createOthers(
                        start,
                        end,
                        secondStartDate,
                        secondEndDate,
                        rag
                    )
                    return
                }
                Object.assign(oneCount[desc], {
                    start,
                    end,
                    secondStartDate,
                    secondEndDate,
                    rag,
                })
            }
            function countTrend(key, oneCount, isFiltered) {
                const chartProp = getChartProps(key)
                const {
                    chartType,
                    trendStartDate,
                    x_column, //for Trend
                    openDateCol, //for Trend OC, same as x_column???
                    closeDateCol, //for Trend OC, rename as x_column_2???
                    forecast,
                    plan,
                } = chartProp
                if (isStartOfFile) init()
                const memo = allCounts.memo[key]
                if (isEndOfFile) {
                    memo.totalRowCounts = totalRowCounts
                    memo.filteredRowCounts = filteredRowCounts
                    return
                }

                if (!isFiltered) return
                if (!includeRowInChart(key, row)) return
                updateCounter()

                function init() {
                    if (!allCounts.memo[key]) allCounts.memo[key] = {}
                    const memo = allCounts.memo[key]
                    const { reportDate } = config
                    Object.assign(memo, {
                        reportDate,
                        count: 0,
                        open: 0,
                        close: 0,
                    })
                    const trendEndDate = getMaxDate()
                    const dateRange = getOrderedValues(
                        "Trend",
                        chartProp,
                        trendEndDate
                    )
                    dateRange.forEach(
                        (v) =>
                            (oneCount[v] = {
                                include: true,
                                open: 0,
                                close: 0,
                                count: 0,
                            })
                    )
                    initForecast(forecast, memo)
                    function getMaxDate() {
                        const updateMax = (chartProp) => {
                            if (!chartProp) return
                            const colMaxDate =
                                allCounts.memo.dataDescription[chartProp]
                                    .maxDate
                            if (maxDate < colMaxDate) maxDate = colMaxDate
                        }
                        // const { reportDate } = config
                        const { reportDate } = memo
                        let maxDate = reportDate
                        updateMax(openDateCol)
                        updateMax(closeDateCol)
                        updateMax(x_column)
                        // get plan end date as well?
                        return maxDate
                    }
                }
                function initForecast(forecast, memo) {
                    if (!forecast) return
                    if (forecast.trim() === "") return
                    const output = parseGrammar(forecast, TREND_GRAMMAR)
                    if (typeof output === "string") {
                        log(`Invalid forecast`, key)
                        return
                    }
                    const { lookBack } = output
                    if (!allCounts.memo[key]) allCounts.memo[key] = {}
                    const { reportDate } = config
                    const cutoffDate = _.addDays(reportDate, -(lookBack - 1))

                    memo.forecast = {
                        ...output,
                        count: 0,
                        open: 0,
                        close: 0,
                        lookBackValues: new Array(lookBack).fill(0),
                        cutoffDate,
                    }
                }
                function updateCounter() {
                    if (chartType == "Trend OC") updateOpenClose()
                    else updateNormal()

                    return true
                    function getNearestMatchingDate(date) {
                        for (const d in oneCount) {
                            if (date <= d) return d
                        }
                        return
                    }
                    function updateNormal() {
                        const date = row[x_column]
                        updateCounters({ date, dateError: "Date", count: 1 })
                    }

                    function updateOpenClose() {
                        const openDate = row[openDateCol]
                        updateCounters({
                            date: openDate,
                            dateError: "Open date",
                            openCount: 1,
                        })
                        const closeDate = row[closeDateCol]
                        const isClosed = closeDate.trim() !== ""
                        if (isClosed)
                            updateCounters({
                                date: closeDate,
                                dateError: "Close date",
                                closeCount: 1,
                            })
                    }
                    function updateCounters({
                        date,
                        count = 0,
                        openCount = 0,
                        closeCount = 0,
                        dateError = "Date",
                    }) {
                        if (!isValidData(date, "date", dateError, key)) return
                        const chartDate = getNearestMatchingDate(date)
                        const dateCount = oneCount[chartDate]
                        if (!dateCount)
                            console.log({ oneCount, date, chartDate })
                        dateCount.count += count
                        dateCount.open += openCount
                        dateCount.close += closeCount
                        updateForecast({
                            date,
                            count: count ? count : openCount - closeCount,
                            openCount,
                            closeCount,
                        })
                    }
                    function updateForecast({
                        date,
                        count = 0,
                        openCount = 0,
                        closeCount = 0,
                    }) {
                        const forecast = allCounts.memo[key].forecast
                        if (!forecast) return
                        const { cutoffDate } = forecast
                        const dateDiff = _.dateTimeDiff(cutoffDate, date) - 1
                        if (dateDiff >= 0) {
                            forecast.count += count
                            forecast.open += openCount
                            forecast.close += closeCount
                            forecast.lookBackValues[dateDiff] += count
                        }
                    }
                }
            }
            function update2X2Counts(
                count,
                x,
                y,
                {
                    totalSum = 0,
                    filteredSum = 0,
                    totalCount = 0,
                    filteredCount = 0,
                }
            ) {
                let xy = x + "|" + y
                if (!count[xy]) {
                    const isTooMany = Object.keys(count).length >= 100
                    if (isTooMany) xy = DISPLAY_OTHERS
                    count[xy] = {
                        include: true,
                        totalSum: 0,
                        filteredSum: 0,
                        totalCount: 0,
                        filteredCount: 0,
                        x: isTooMany ? "<OTHERS>" : x,
                        y: isTooMany ? "<OTHERS>" : y,
                    }
                }

                count[xy].totalSum += totalSum
                count[xy].filteredSum += filteredSum
                count[xy].totalCount += totalCount
                count[xy].filteredCount += filteredCount
            }
            function countStateChange(key, oneCount, filtered) {
                //to do make <now> as a parameter
                const { reportDate } = config
                const { idCol, x_column, y_column, timestampCol } =
                    getChartProps(key)
                if (totalRowCounts === 1) {
                    oneCount[SYMBOL_PREV_STATE] = {}
                    readyPrevious({})
                    const checkFilter = (col) => {
                        if (isColumnFiltered(col))
                            log(`"${col}" is filtered`, key)
                    }
                    checkFilter(x_column)
                    checkFilter(y_column)
                    checkFilter(timestampCol)
                }
                const prev = oneCount[SYMBOL_PREV_STATE]
                if (isEndOfFile) {
                    calculatePrevious()
                    delete oneCount[SYMBOL_PREV_STATE]
                    return
                }
                if (!filtered) return
                if (!includeRowInChart(key, row)) return

                const id = row[idCol].trim()
                const to = row[x_column].trim()
                const from = row[y_column].trim()
                let timestamp = row[timestampCol]

                if (!isValidData(timestamp, "date", "Timestamp", key))
                    timestamp = 0

                // if (prev.id && id < prev.id)
                //     log(`Id not in ascending order ${id} ${prev.id}`, key)

                if (id !== prev.id) calculatePrevious()
                else calculateCurrent()
                readyPrevious({ id, to, from, timestamp })

                function readyPrevious({
                    id = "",
                    to = "",
                    from = "",
                    timestamp = 0,
                }) {
                    const prev = oneCount[SYMBOL_PREV_STATE]
                    Object.assign(prev, { id, to, from, timestamp })
                }
                function calculatePrevious() {
                    // const prev = oneCount[SYMBOL_PREV_STATE]
                    if (prev.to !== "") {
                        const delta = _.dateTimeDiff(
                            prev.timestamp,
                            reportDate,
                            "Days"
                        )
                        if (delta < 0)
                            log(`Timestamp not in ascending order`, key)
                        update2X2Counts(oneCount, "<Now>", prev.to, {
                            filteredCount: 1,
                            filteredSum: delta,
                        })
                    }
                }
                function calculateCurrent() {
                    if (prev.to) {
                        if (prev.to !== from)
                            log(`"from" not same as previous "to"`, key)
                        const delta = _.dateTimeDiff(
                            prev.timestamp,
                            timestamp,
                            "Days"
                        )
                        update2X2Counts(oneCount, to, from, {
                            filteredCount: 1,
                            filteredSum: delta,
                        })
                        if (delta < 0)
                            log(`Timestamp not in ascending order`, key)
                    }
                }
            }
            function count2X2(key, oneCount, isFiltered) {
                if (isEndOfFile) {
                    return
                }
                if (!includeRowInChart(key, row)) return
                const { colOver, x_column, y_column } = getChartProps(key)

                const sum = getSumValue(key, colOver)

                update2X2Counts(oneCount, row[x_column], row[y_column], {
                    totalSum: !isFiltered ? sum : 0,
                    filteredSum: isFiltered ? sum : 0,
                    totalCount: !isFiltered ? 1 : 0,
                    filteredCount: isFiltered ? 1 : 0,
                })
            }
            function countBar(key, oneCount, isFiltered) {
                const {
                    countType,
                    colOver,
                    x_column,
                    x_dataType,
                    x_bin,
                    x_order,
                    x_dateFormat,
                    x_separator,
                } = getChartProps(key)
                // if (totalRowCounts === 1 && !isFiltered) init()
                if (isStartOfFile) init()
                const memo = allCounts.memo[key]

                if (isEndOfFile) {
                    //console.log(key, memo)
                    wrapUp()
                    return
                }
                if (!isValidData(row[x_column], "any", x_column, key)) return
                updateCounts()

                function wrapUp() {}
                function init() {
                    if (!allCounts.memo[key]) allCounts.memo[key] = {}
                    const memo = allCounts.memo[key]
                    if (x_bin) {
                        const binCount = Number(x_bin.trim())
                        if (isNaN(binCount))
                            memo.bin = _.cleanArray(x_bin, "Number")
                        else {
                            const { maxNumber, minNumber } =
                                allCounts.memo["dataDescription"][x_column]
                            const max = Math.round(maxNumber)
                            const min = Math.floor(minNumber)
                            const rawStep = (max - min) / (binCount + 1)
                            if (rawStep < 10) {
                                memo.bin = [min, max]
                            } else {
                                const step = Math.round(rawStep)
                                memo.bin = [min]
                                for (let i = 1; i < binCount; i++)
                                    memo.bin.push(min + i * step)
                                memo.bin.push(max)
                            }
                        }
                    }
                    if (x_order) memo.order = x_order
                    if (x_dateFormat) {
                        memo.dateFormat = x_dateFormat
                        memo.reportDate = config.reportDate
                    }
                    if (x_separator) memo.separator = x_separator
                    return memo
                }
                function updateCounts() {
                    if (!oneCount) oneCount = {}
                    const maxCats = 2 * MAX_BAR_CATS
                    const v = dataTypes[x_dataType].getFormattedValue(
                        row[x_column],
                        memo
                    )

                    if (x_dataType == "List Members") {
                        if (Array.isArray(v)) v.forEach((lm) => countAValue(lm))
                        rowForFilter[key] = undefined
                        return
                    }

                    rowForFilter[key] = countAValue(v)

                    function countAValue(originalCat) {
                        const cat = oneCount[originalCat]
                            ? originalCat
                            : Object.keys(oneCount).length < maxCats
                            ? originalCat
                            : SYMBOL_OTHERS //DISPLAY //_OTHERS

                        if (cat === SYMBOL_OTHERS)
                            //_OTHERS)
                            log(`Over ${maxCats} categories`, key)

                        if (!oneCount[cat])
                            oneCount[cat] = {
                                include: true, // true mean include in counts
                                totalSum: 0, // if sum/ave then sum without filter
                                filteredSum: 0, // if sum/ave then sum when filtered
                                totalCount: 0, // count without filter
                                filteredCount: 0, // count when filtered
                            }
                        if (includeRowInChart(key, row)) {
                            const sum = getSumValue(key, colOver)
                            if (!isFiltered) {
                                oneCount[cat].totalCount++
                                oneCount[cat].totalSum += sum
                            }
                            if (isFiltered) {
                                oneCount[cat].filteredCount++
                                oneCount[cat].filteredSum += sum
                            }
                        }
                        return cat
                    }
                }
            }
            //to do move countBasedOnType to chartTypes??
            function countBasedOnType(key, isFiltered) {
                const oneCount = allCounts.counts[key]
                const { chartType } = getChartProps(key)
                switch (chartType) {
                    case "Bar":
                        countBar(key, oneCount, isFiltered)
                        break
                    case "Data Description":
                        countDataDescription(key, oneCount, isFiltered)
                        break
                    case "Data Table":
                        countTable(key, oneCount, isFiltered)
                        break
                    case "Note":
                        break
                    case "Plan":
                        countPlan(key, oneCount, isFiltered)
                        break
                    case "Risk":
                    case "2X2":
                        count2X2(key, oneCount, isFiltered)
                        break
                    case "State Change":
                        countStateChange(key, oneCount, isFiltered)
                        break
                    case "Trend":
                    case "Trend OC":
                        countTrend(key, oneCount, isFiltered)
                        break
                    default:
                        console.error(`Invalid chartType: ${chartType}`)
                }
            }
        }
        function wrapUp(allCounts) {
            countRecords(allCounts)
            makeChartData(allCounts, config)
            makeCallOuts(allCounts, config)
        }
        function getChartProps(index) {
            if (!config.chartProperties[index]) {
                log(
                    `Invalid call to getChartProps; index= ${index}`,
                    undefined,
                    "error"
                )
                return
            }
            return config.chartProperties[index]
        }
        //to do move zeroCounters to chartTypes??
        function zeroCounters(allCounts) {
            for (const key in allCounts.counts) {
                const { chartType } = getChartProps(key)

                if (["2X2", "Risk", "Bar"].includes(chartType)) {
                    for (const v of Object.values(allCounts.counts[key])) {
                        v.totalSum = 0
                        v.filteredSum = 0
                        v.totalCount = 0
                        v.filteredCount = 0
                    }
                    continue
                }
                if (["Trend", "Trend OC"].includes(chartType)) {
                    for (const v of Object.values(allCounts.counts[key])) {
                        v.open = 0
                        v.close = 0
                        v.count = 0
                    }
                    continue
                }
                allCounts.counts[key] = {}
            }
        }
        function clearLog() {
            for (const key in allCounts.memo)
                if (allCounts.memo[key].log) delete allCounts.memo[key].log
        }
        function log(message, key, severity = "warning") {
            logMessage(message, severity, key, allCounts, filteredRowCounts)
        }
        function gatherDataDescription(row, descriptions) {
            function initCounter() {
                for (const key in row)
                    descriptions[key] = {
                        spaceCount: 0,
                        maxDate: undefined,
                        minDate: undefined,
                        dateCount: 0,
                        maxNumber: undefined,
                        minNumber: undefined,
                        numberCount: 0,
                        maxString: undefined,
                        minString: undefined,
                        stringCount: 0,
                    }
            }

            if (_.isEmpty(descriptions)) initCounter()

            function getMin(currentValue, value) {
                if (currentValue == undefined) return value
                if (currentValue > value) return value
                return currentValue
            }

            function getMax(currentValue, value) {
                if (currentValue == undefined) return value
                if (currentValue < value) return value
                return currentValue
            }

            for (const [key, value] of Object.entries(row)) {
                const item = value.trim()
                const description = descriptions[key]

                if (item == "") {
                    description.spaceCount++
                    continue
                }
                if (_.isValidDate(item)) {
                    description.maxDate = getMax(description.maxDate, item)
                    description.minDate = getMin(description.minDate, item)
                    description.dateCount++
                    continue
                }
                if (!isNaN(item)) {
                    description.maxNumber = getMax(
                        description.maxNumber,
                        Number(item)
                    )
                    description.minNumber = getMin(
                        description.minNumber,
                        Number(item)
                    )
                    description.numberCount++
                    continue
                }
                description.maxString = getMax(description.maxString, item)
                description.minString = getMin(description.minString, item)
                description.stringCount++
            }
        }
        function cleanRow(uncleanRow, presetOffsetDays) {
            const modifiedDate = (date) => {
                const newDate = presetOffsetDays
                    ? _.addDays(date, presetOffsetDays)
                    : date
                return _.formatDate(newDate, "YYYY-MM-DD")
            }
            const row = {}
            for (const key in uncleanRow) {
                const cell = uncleanRow[key].trim()
                if (_.isValidDate(cell)) row[key] = modifiedDate(cell)
                else row[key] = cell
            }
            return row
        }
        async function passOne(file, presetOffsetDays) {
            dataDescription = {}
            const p = await readCSV(
                { complete: true },
                {
                    file,
                    step: (row) => {
                        const cleanedRow = cleanRow(row.data, presetOffsetDays)
                        gatherDataDescription(cleanedRow, dataDescription)
                    },
                    //error: (err, file) => console.error({ err, file }),
                    complete: (result, file) => {
                        //resolve(true)
                    },
                }
            )
            if (p.complete) return
            fileError = p
        }
        function includeRowInChart(key, row) {
            init()
            if (allCounts.memo[key]?.chartFilter) return filterAction()
            return true

            function init() {
                if (allCounts.memo[key] && allCounts.memo[key].chartFilter)
                    return
                const { chartFilter } = getChartProps(key)
                if (chartFilter == undefined) return
                if (chartFilter.trim() === "") return
                if (!allCounts.memo[key]) allCounts.memo[key] = {}
                if (!allCounts.memo[key].chartFilter) {
                    const output = parseGrammar(
                        chartFilter.trim(),
                        CHART_FILTER_GRAMMAR
                    )
                    if (typeof output === "string") {
                        log(`Chart filter invalid: ${output}`, key)
                        return
                    }
                    allCounts.memo[key].chartFilter = output
                }
            }
            function filterAction() {
                const { action, where } = allCounts.memo[key].chartFilter
                let whereConditionMet = true
                let prevOp = "and"
                for (let i = 0; i < where.length; i++) {
                    const hasMet = getConditionResult(where[i])
                    whereConditionMet =
                        prevOp === "and"
                            ? whereConditionMet && hasMet
                            : whereConditionMet || hasMet
                    if (i < where.length) {
                        prevOp = where[i + 1]
                        i++
                    }
                }
                return action == "include"
                    ? whereConditionMet
                    : !whereConditionMet

                function getConditionResult({ columnName, op, operand }) {
                    if (!columnName) {
                        log(`Chart filter column name invalid`, key)
                        return false
                    }
                    const value = row[columnName]
                    if (value == undefined) {
                        log(`Chart filter column (${columnName}) invalid`, key)
                        return false
                    }
                    if (!op) {
                        log(`Chart filter op invalid`, key)
                        return false
                    }
                    if (!operand) {
                        log(`Chart filter operand invalid`, key)
                        return false
                    }
                    //TO DO reintroduce?  log(`Some rows skipped due to 'chart filter' in the chart`, key,"info")
                    const compareAsNumbers = op.includes("(n)")
                    const isEq = compareAsNumbers
                        ? isEqual("number")
                        : isEqual()
                    return op === "eq" || op === "eq(n)" ? isEq : !isEq

                    function isEqual(type) {
                        const val = (x) =>
                            type === "number" ? Number(x) : x.toLowerCase()
                        const compareVal = val(value)
                        if (typeof operand === "string")
                            return val(operand) === compareVal
                        const found =
                            operand.findIndex((v) => val(v) === compareVal) !==
                            -1
                        return found
                    }
                }
            }
        }

        function cannotFilter(chartType) {
            if (!chartType) return false
            if (!chartTypes[chartType]) return false
            if (!chartTypes[chartType].cannotFilter) return false
            return chartTypes[chartType].cannotFilter
        }
        function isValidData(value, dataType, prefix, key = "global") {
            if (value == undefined) {
                log(`Column: "${prefix}" missing`, key, "error")
                return false
            }

            if (typeof dataType !== "string") {
                log(`Data type not string`, key, "error")
                return false
            }

            const dataTypeTlc = dataType.trim().toLowerCase()
            if (dataTypeTlc == "number")
                if (isNaN(value)) {
                    log(`${prefix} is ${DISPLAY_INVALID_NUMBER}`, key)
                    return false
                }
            if (dataTypeTlc == "date")
                if (!_.isValidDate(value)) {
                    log(`${prefix} is ${DISPLAY_INVALID_DATE}`, key)
                    return false
                }
            return true
        }
    }

    //////////////////////////////////////////////////////////////////////////// moved from param
    const dataTypes = {
        Date: {
            formats: ["YYYY", "MMM", "MMM-YY", "DDD", "DD", "W8", "4W4", "8W"],
            getFormattedValue: (v, { dateFormat = "MMM", reportDate }) => {
                if (v.trim() === "") return DISPLAY_SPACES
                if (!_.isValidDate(v)) return DISPLAY_INVALID_DATE

                const positionOfW = dateFormat.indexOf("W")
                if (positionOfW === -1) return _.formatDate(v, dateFormat)

                const min = positionOfW === 0 ? 0 : -Number(dateFormat[0])
                const max =
                    positionOfW === dateFormat.length
                        ? 0
                        : Number(dateFormat[positionOfW + 1])
                function formatWeek(w, min, max) {
                    if (w < min) return DISPLAY_LESS
                    if (w > max) return DISPLAY_MORE
                    return (w ? w : "") + "W"
                }
                const days = _.dateTimeDiff(reportDate, v, "Days")
                const weeks = Math.floor(days / 7)
                return formatWeek(weeks, min, max)
            },
            getCategories: ({ dateFormat = "MMM" }) => {
                if (dateFormat == "MMM") return MONTHS
                if (dateFormat == "DDD") return WEEKDAYS
                if (dateFormat == "DD") {
                    const days = Array.from({ length: 32 }, (_, i) => i + 1)
                    return days
                }
                const getExtent = (dateFormat) => {
                    if (dateFormat[0] === "W")
                        return { min: 0, max: Number(dateFormat[1]) }
                    if (dateFormat[1] === "W")
                        return {
                            min: -Number(dateFormat[0]),
                            max: Number(dateFormat[2]),
                        }
                }
                // if (dateFormat.indexOf("W") !== -1) {
                if (dateFormat.includes("W")) {
                    const { min, max } = getExtent(dateFormat)
                    const weeks = [DISPLAY_LESS]
                    for (let i = min; i <= max; i++)
                        weeks.push((i ? i : "") + "W")
                    weeks.push(DISPLAY_MORE)
                    return weeks
                }
                return []
            },
        },
        Number: {
            getFormattedValue: (v, { bin }) => {
                if (isNaN(v)) {
                    if (v.trim() === "") return DISPLAY_SPACES
                    return DISPLAY_INVALID_NUMBER
                }
                const number = Number(v)
                if (!bin) return number
                function binnedValues(v, bin) {
                    const label = (i) => `${bin[i - 1]}-${bin[i]}`

                    if (bin.length < 2) return v

                    if (v < bin[0]) return DISPLAY_LESS
                    if (v > bin[bin.length - 1]) return DISPLAY_MORE
                    if (v == bin[0]) return label(1)
                    const i = bin.findIndex((e) => v <= e)
                    return label(i)
                }
                const binArray = Array.isArray(bin)
                    ? bin
                    : _.cleanArray(bin, "Number")

                return binnedValues(number, binArray)
            },
            getCategories: ({ bin }) => {
                if (!bin) return []
                const binLabels = []
                const getBinLabel = dataTypes["Number"].getFormattedValue
                bin.forEach((v, i) => {
                    if (i > 0) binLabels.push(getBinLabel(v, { bin }))
                })
                binLabels.unshift(DISPLAY_LESS)
                binLabels.push(DISPLAY_MORE)
                return binLabels
            },
        },
        String: {
            getFormattedValue: (v) => v.trim(),
            getCategories: ({ order }) =>
                order ? order.split(",").map((v) => v.trim()) : [],
        },
        List: {
            getFormattedValue: (v, { separator }) => {
                const list = v.trim()
                if (list === "") return 0
                const rawValues = list.split(separator).map((v) => v.trim())
                const uniqueValues = new Set(rawValues)
                return [...uniqueValues].filter((v) => v !== "").length
            },
            getCategories: () => [],
        },
        "List Members": {
            getFormattedValue: (v, { separator }) => {
                const list = v.trim()
                if (list === "") return 0
                const rawValues = list.split(separator).map((v) => v.trim())
                const uniqueValues = new Set(rawValues)
                return [...uniqueValues].filter((v) => v !== "")
            },
            getCategories: () => [],
        },
    }
    /////////////////////////////////////////////////////////// common validation functions

    function validateGrammar(input, grammar) {
        if (!input) return
        if (input.trim() === "") return
        const output = parseGrammar(input.trim(), grammar)
        if (_.isOject(output)) return
        return output
    }
    function validateAnnotations(annotations) {
        if (annotations.trim() === "") return
        const annotationArray = annotations.split(",")

        const styles = ["th", "tv", "mh", "mv", "bh", "bv"]
        const msg =
            "Annotations must have 3 values: date, label, style: " +
            styles.join(",")

        if (annotationArray.length % 3 !== 0) return msg

        for (let i = 0; i < annotationArray.length; i += 3) {
            const date = annotationArray[i].trim()
            if (!_.isValidDate(date)) return msg

            if (!annotationArray[i + 1]) return msg

            const style = annotationArray[i + 2].trim().toLowerCase()

            if (!styles.includes(style)) return msg
        }
        return
    }
    function err(key, message, errors) {
        if (!errors[key]) errors[key] = []
        if (!errors[key].includes(message)) errors[key].push(message)
    }

    const chartTypes = {
        Note: {
            cannotFilter: true,
            validate: (properties) => {
                if (properties["message"].trim() == "") {
                    return {
                        isValid: false,
                        errors: { message: "Required" },
                    }
                }
                return { isValid: true }
            },
        },
        Risk: {
            cannotFilter: true,
            validate: (properties) => {
                const {
                    countType,
                    colOver,
                    y_column,
                    y_labels,
                    x_column,
                    x_labels,
                    chartFilter,
                    countLabels,
                } = properties
                const errors = {}
                const validateDistinct = (col1, col2) => {
                    if (properties[col1] === properties[col2]) {
                        err(col1, "Must be different", errors)
                        err(col2, "Must be different", errors)
                        return false
                    }
                    return true
                }
                validateDistinct("y_column", "x_column")

                const isArrayOf5 = (v) => {
                    const array = properties[v].split(",")
                    if (array.length != 5) {
                        err(v, "Required 5 values", errors)
                    }
                }
                isArrayOf5("x_labels")
                isArrayOf5("y_labels")
                isArrayOf5("countLabels")

                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)
                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
            validateCallout: (properties) =>
                chartTypes["2X2"].validateCallout(properties),
            getCallout: (properties, chartProperties, data) => {
                return chartTypes["2X2"].getCallout(
                    properties,
                    chartProperties,
                    data
                )
            },
        },
        "2X2": {
            cannotFilter: true,
            //formatValue chartProp must have all values to check x_column and y_column
            // formatValue: (v, chartProp, param) => {
            //     const { row } = param
            //     //validate chartProp row before calling?
            //     if (!chartProp || !row) return DISPLAY_INVALID
            //     const { x_column, y_column } = chartProp
            //     const x = row[x_column].trim()
            //     const y = row[y_column].trim()
            //     const xy = x + "|" + y
            //     return xy
            // },
            validate: (properties) => {
                const {
                    countType,
                    colOver,
                    y_column,
                    y_labels,
                    x_column,
                    x_labels,
                    chartFilter,
                    countLabels,
                } = properties
                const errors = {}
                const validateDistinct = (col1, col2) => {
                    if (properties[col1] === properties[col2]) {
                        err(col1, "Must be different", errors)
                        err(col2, "Must be different", errors)
                        return false
                    }
                    return true
                }
                validateDistinct("y_column", "x_column")

                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)
                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
            // validate: (properties) => {
            //     const {
            //         x_column,
            //         x_dataType,
            //         x_dateFormat,
            //         x_order,
            //         x_bin,
            //         x_separator,
            //         chartFilter,
            //         countType,
            //         colOver,
            //     } = properties
            //     const errors = {}

            //     if (x_dataType === "String") {
            //         //no validation
            //     }
            //     if (x_dataType === "Number") {
            //         const checkBinValue = () => {
            //             if (!x_bin) return
            //             if (x_bin.trim() === "") return
            //             const binError =
            //                 "Required: integer > 1 or list of increasing numbers"
            //             if (!isNaN(x_bin)) {
            //                 if (_isInteger(x_bin)) if (Number(x_bin) > 1) return
            //                 return err("x_bin", binError, errors)
            //             }
            //             const binArray = x_bin.split(",")
            //             if (!Array.isArray(binArray))
            //                 return err("x_bin", binError, errors)
            //             if (binArray.length < 2)
            //                 return err("x_bin", binError, errors)
            //             for (let i = 0; i <= binArray.length - 1; i++) {
            //                 const v = Number(binArray[i])
            //                 if (isNaN(v)) return err("x_bin", binError, errors)
            //                 if (i > 0 && v <= Number(binArray[i - 1]))
            //                     return err("x_bin", binError, errors)
            //             }
            //         }
            //         checkBinValue()
            //     }
            //     if (x_dataType === "Date") {
            //         //no validation
            //     }
            //     if (x_dataType === "List") {
            //         //no validation
            //     }
            //     if (x_dataType === "List Members") {
            //         //no validation
            //     }
            //     const chartFilterError = validateGrammar(
            //         chartFilter,
            //         CHART_FILTER_GRAMMAR
            //     )
            //     if (chartFilterError)
            //         err("chartFilter", chartFilterError, errors)

            //     const isValid = Object.keys(errors).length === 0
            //     return { isValid, errors }
            // },
            validateCallout: (properties) => {
                const { value, category } = properties
                if (value !== "category") return {}
                const cats = category
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v !== "")
                if (cats.length !== 2)
                    return { errors: { category: "Required 2 values" } }
                return {}
            },
            getCallout: (properties, chartProperties, data) => {
                const { errors, output } =
                    chartTypes["2X2"].validateCallout(properties)
                if (errors) {
                    const bottom = Object.keys(errors)
                        .map((key) => key + " " + errors[key])
                        .join(", ")
                    return { top: "ERR", bottom }
                }
                const { chartType, x_column, y_column } = chartProperties
                const { value, message } = properties
                if (value === "category") {
                    const cats = category
                        .split(",")
                        .map((v) => v.trim())
                        .filter((v) => v !== "")
                    // if (!Array.isArray(cats)) return error
                    // if (cats.length !== 2) return error
                    const x = cats[0]
                    const y = cats[1]
                    const d = data.find(
                        (v) => v.x.trim() === x && v.y.trim() === y
                    )
                    const top = d ? d.v : "NA"
                    const bottom =
                        message ??
                        `Value for ${x_column} = ${x} | ${y_column} = ${y}`
                    return { top, bottom }
                }
                const extent = d3.extent(data, (d) => d.v)
                const top = value === "max" ? extent[1] : extent[0]
                const cats = data
                    .filter((v) => v.v === top)
                    .map((v) => `${x_column} = ${v.x} | ${y_column} = ${v.y}`)
                const bottom =
                    message ??
                    (value === "max" ? "Maximum" : "Minimum") +
                        ` at ${cats.join(", ")}`

                return { top, bottom }
            },
        },
        "State Change": {
            cannotFilter: true,
            // hasSpecialCounter: true,
            //formatValue chartProp must have all values to check y_column and x_column timestampcol can it be xCol and yCol?
            // formatValue: (v, chartProp, param) => {
            //     const { row } = param
            //     //validate chartProp row before calling?
            //     if (!chartProp || !row) return DISPLAY_INVALID
            //     const { y_column, x_column } = chartProp
            //     //validate y_column and x_column?
            //     const to = row[x_column].trim()
            //     const from = row[y_column].trim()
            //     const toFrom = to + "|" + from
            //     return toFrom
            // },
            validate: (properties) => {
                const {
                    x_column,
                    x_labels,
                    y_column,
                    y_labels,
                    timestampCol,
                    countType,
                    idCol,
                    countLabels,
                    chartFilter,
                } = properties
                const errors = {}
                const validateDistinct = (col1, col2) => {
                    if (properties[col1] === properties[col2]) {
                        err(col1, "Must be different", errors)
                        err(col2, "Must be different", errors)
                        return false
                    }
                    return true
                }

                validateDistinct("idCol", "y_column")
                validateDistinct("idCol", "x_column")
                validateDistinct("idCol", "timestampCol")
                validateDistinct("y_column", "x_column")
                validateDistinct("y_column", "timestampCol")
                validateDistinct("x_column", "timestampCol")
                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)
                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
            validateCallout: (properties) =>
                chartTypes["2X2"].validateCallout(properties),
            getCallout: (properties, chartProperties, data) => {
                return chartTypes["2X2"].getCallout(
                    properties,
                    chartProperties,
                    data
                )
            },
        },
        "Data Table": { cannotFilter: true },
        "Data Description": {
            cannotFilter: true,
        },
        Plan: {
            cannotFilter: true,
            validate: (properties) => {
                const {
                    descriptionCol,
                    startDateCol,
                    endDateCol,
                    secondStartDateCol,
                    secondEndDateCol,
                    firstLabel,
                    secondLabel,
                    chartFilter,
                    RAGCol,
                    annotations,
                } = properties
                const errors = {}

                const different = (col1, col2) => {
                    if (properties[col1] === properties[col2]) {
                        err(col1, "Must be different", errors)
                        err(col2, "Must be different", errors)
                        return false
                    }
                    return true
                }
                different("descriptionCol", "startDateCol")
                different("descriptionCol", "endDateCol")
                different("startDateCol", "endDateCol")
                if (!firstLabel) err("firstLabel", "Mandatory", errors)

                if (secondStartDateCol) {
                    if (!secondLabel) err("secondLabel", "Mandatory")
                    different("descriptionCol", "secondStartDateCol")
                    different("endDateCol", "secondStartDateCol")
                    different("startDateCol", "secondStartDateCol")
                    if (!secondEndDateCol)
                        err("secondStartDateCol", "Required", errors)
                }
                if (secondEndDateCol) {
                    if (!secondLabel) err("secondLabel", "Mandatory")
                    different("descriptionCol", "secondEndDateCol")
                    different("endDateCol", "secondEndDateCol")
                    different("startDateCol", "secondEndDateCol")
                    different("secondStartDateCol", "secondEndDateCol")
                    if (!secondStartDateCol)
                        err("secondStartDateCol", "Required", errors)
                }

                if (RAGCol) {
                    different("descriptionCol", "RAGCol")
                    different("endDateCol", "RAGCol")
                    different("startDateCol", "RAGCol")
                    different("secondStartDateCol", "RAGCol")
                    different("secondEndDateCol", "RAGCol")
                }
                const annotationError = validateAnnotations(annotations)
                if (annotationError) err("annotations", annotationError, errors)

                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)
                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
        },
        Trend: {
            cannotFilter: true,
            orderedValues: (chartProp, trendEndDate) => {
                return chartTypes["Trend OC"].orderedValues(
                    chartProp,
                    trendEndDate
                )
            },
            validate: (properties, { reportDate }) => {
                const {
                    //common
                    trendStartDate,
                    x_label,
                    chartFilter,
                    annotations,
                    forecast,
                    plan,
                    //Trend
                    x_column,
                    // Trend OC
                    openDateCol,
                    closeDateCol,
                } = properties
                const errors = {}
                // if (x_label.trim() === "") err("x_label", "Mandatory", errors)

                if (trendStartDate > reportDate)
                    err("trendStartDate", "Start must be < report date", errors)
                const annotationError = validateAnnotations(annotations)
                if (annotationError) err("annotations", annotationError, errors)
                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)

                if (plan && plan.trim() !== "") {
                    const output = parseGrammar(plan, PLAN_GRAMMAR)
                    if (typeof output === "string")
                        err("plan", `Invalid: (${output})`, errors)
                }
                if (forecast && forecast.trim() !== "") {
                    const output = parseGrammar(plan, PLAN_GRAMMAR)
                    if (typeof output === "string")
                        err("forecast", `Invalid: (${output})`, errors)
                }
                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
            validateCallout: (properties) => {
                const { value, category } = properties
                if (value !== "category") return {}
                const cats = category
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v !== "")
                const error = {
                    errors: {
                        category:
                            "Required 2 values; first is date|report-date",
                    },
                }
                if (cats.length !== 2) return { error }
                const firstCat = cats[0]
                if (firstCat.toLowerCase() === "report-date") return {}
                if (_.isValidDate(firstCat)) return {}
                return { error }
            },
            // getCallout: (properties, chartProperties, data) => {
            //     //validate when available
            //     const { errors } =
            //         chartTypes["Trend"].validateCallout(properties)
            //     if (errors) {
            //         const bottom = Object.keys(errors)
            //             .map((key) => key + " " + errors[key])
            //             .join(", ")
            //         return { top: "ERR", bottom }
            //     }
            //     const { chartType, x_column, x_label } = chartProperties
            //     const { chartNumber, value, category, message } = properties
            //     if (value === "category") {
            //         const cat = category
            //         const d = data.find((v) => v.x === cat)
            //         const top = d ? d.v : "NA"
            //         const bottom =
            //             message ?? `${d.type} Value for ${x_column} = ${cat}`
            //         return { top, bottom }
            //     }
            //     const extent = d3.extent(data, (d) => d.v)
            //     const top = value === "max" ? extent[1] : extent[0]
            //     const cats = data.filter((v) => v.v === top).map((v) => v.x)
            //     const bottom =
            //         message ??
            //         (value === "max" ? "Maximum" : "Minimum") +
            //             ` at ${x_column} = ${cats[0]}`
            //     // ` at ${x_column} = ${cats.join(", ")}`

            //     return { top, bottom }
            //     return {
            //         top: chartNumber,
            //         // bottom: `Not yet implemented for chart type "${chartType}"`,
            //         bottom: value,
            //     }
            // },
        },
        "Trend OC": {
            cannotFilter: true,
            orderedValues: (chartProp, trendEndDate) => {
                const { trendStartDate } = chartProp

                const datePoints = []
                const dateDifference = _.dateTimeDiff(
                    trendStartDate,
                    trendEndDate,
                    "Days"
                ) //+ 1
                const maxDataPoints = 30
                const millisecondsInDay = 24 * 60 * 60 * 1000
                const deltaMilliseconds =
                    millisecondsInDay *
                    Math.max(1.0, dateDifference / maxDataPoints)

                let date = new Date(trendEndDate)
                let YYYYMMDD = date.toISOString().substring(0, 10)

                while (YYYYMMDD >= trendStartDate) {
                    datePoints.unshift(YYYYMMDD)
                    date.setMilliseconds(
                        date.getMilliseconds() - deltaMilliseconds
                    )
                    YYYYMMDD = date.toISOString().substring(0, 10)
                }

                return datePoints
            },
            validate: (properties, config) =>
                chartTypes["Trend"].validate(properties, config),
            // getCallout: (properties, chartProperties, data) => {
            //     return chartTypes["Trend"].getCallout(
            //         properties,
            //         chartProperties,
            //         data
            //     )
            // },
        },
        Bar: {
            validate: (properties) => {
                const {
                    x_column,
                    x_dataType,
                    x_dateFormat,
                    x_order,
                    x_bin,
                    x_separator,
                    chartFilter,
                    countType,
                    colOver,
                } = properties
                const errors = {}

                if (x_dataType === "String") {
                    //no validation
                }
                if (x_dataType === "Number") {
                    const checkBinValue = () => {
                        if (!x_bin) return
                        if (x_bin.trim() === "") return
                        const binError =
                            "Required: integer > 1 or list of increasing numbers"
                        if (!isNaN(x_bin)) {
                            if (_.isInteger(x_bin))
                                if (Number(x_bin) > 1) return
                            return err("x_bin", binError, errors)
                        }
                        const binArray = x_bin.split(",")
                        if (!Array.isArray(binArray))
                            return err("x_bin", binError, errors)
                        if (binArray.length < 2)
                            return err("x_bin", binError, errors)
                        for (let i = 0; i <= binArray.length - 1; i++) {
                            const v = Number(binArray[i])
                            if (isNaN(v)) return err("x_bin", binError, errors)
                            if (i > 0 && v <= Number(binArray[i - 1]))
                                return err("x_bin", binError, errors)
                        }
                    }
                    checkBinValue()
                }
                if (x_dataType === "Date") {
                    //no validation
                }
                if (x_dataType === "List") {
                    //no validation
                }
                if (x_dataType === "List Members") {
                    //no validation
                }
                const chartFilterError = validateGrammar(
                    chartFilter,
                    CHART_FILTER_GRAMMAR
                )
                if (chartFilterError)
                    err("chartFilter", chartFilterError, errors)

                const isValid = Object.keys(errors).length === 0
                return { isValid, errors }
            },
            validateCallout: (properties) => {
                const { value, category } = properties
                if (value == "category") {
                    if (category.trim() === "") {
                        return { errors: { category: "Required" } }
                    }
                }
                return {}
            },
            getCallout: (properties, chartProperties, data) => {
                const { errors, output } =
                    chartTypes["Bar"].validateCallout(properties)
                // const errors = { category: "Required", chartNumber: "Required" }
                if (errors) {
                    const bottom = Object.keys(errors)
                        .map((key) => key + " " + errors[key])
                        .join(", ")
                    return { top: "ERR", bottom }
                }
                const { chartType, x_column } = chartProperties
                const { value, category, message } = properties
                if (value === "category") {
                    const cat = category
                    const d = data.find((v) => v.x === cat)
                    const top = d ? d.v : "NA"
                    const bottom = message ?? `Value for ${x_column} = ${cat}`
                    return { top, bottom }
                }
                const extent = d3.extent(data, (d) => d.v)
                const top = value === "max" ? extent[1] : extent[0]
                const cats = data.filter((v) => v.v === top).map((v) => v.x)
                const bottom =
                    message ??
                    (value === "max" ? "Maximum" : "Minimum") +
                        ` at ${x_column} = ${cats.join(", ")}`

                return { top, bottom }
            },
        },
    }
    function validateChart(chartType, properties, config) {
        const error = {
            isValid: false,
            errors: { chartType: "Invalid chart type" },
        }
        if (!chartType) return error
        if (!chartTypes[chartType]) return error
        if (!chartTypes[chartType].validate) return { isValid: true }
        return chartTypes[chartType].validate(properties, config)
    }
    function validateCallout(chartType, properties, config) {
        const error = {
            isValid: false,
            errors: {
                chartNumber: "No callout for chart type of this chart number",
            },
        }
        if (!chartType) return error
        if (!chartTypes[chartType]) return error
        if (!chartTypes[chartType].validateCallout) return error
        return chartTypes[chartType].validateCallout(properties, config)
    }
    /////////// chartTypes functions
    function getChartDescription() {
        const chartDescription = {}
        for (const key in chartTypes) {
            chartDescription[key] = {
                cannotFilter: chartTypes[key].cannotFilter,
                isChart: true,
            }
        }
        chartDescription.dateFormats = dataTypes["Date"].formats
        return chartDescription
    }
    function getChartDataTypes() {
        return JSON.stringify({ dataTypes, chartTypes })
    }
    //////////////////////////////////////chartTypes functions
    function logMessage(message, severity, key, allCounts, filteredRowCounts) {
        if (!allCounts.memo[key]) allCounts.memo[key] = {}
        const memo = allCounts.memo[key]
        if (!memo.log) memo.log = {}
        const memoLog = memo.log
        if (!memoLog[message]) {
            memoLog[message] = { first: filteredRowCounts, count: 0 }
        }
        const ml = memoLog[message]
        ml.severity = severity
        ml.last = filteredRowCounts
        ml.count++
    }
    function makeChartData(allCounts, config) {
        allCounts.data = {}
        for (let i = 0; i < config.chartProperties.length; i++) {
            allCounts.data[i] = createChartData(i)
        }

        function createChartData(i) {
            const oneCount = allCounts.counts[i]
            const oneConfig = config.chartProperties[i]
            const memo = allCounts.memo[i]
            const { countType, chartType } = oneConfig
            //to do move createChartData to chartTypes??
            if (chartType === "Note") return
            if (chartType === "Bar") {
                // x_sortOn : category | value, x_sortOrder: ascending | descending
                //available only for dataType = String or number without bin
                const { x_dataType } = oneConfig
                const cats = memo
                    ? dataTypes[x_dataType].getCategories(memo)
                    : []

                const specialCats = [
                    DISPLAY_SPACES,
                    DISPLAY_INVALID_DATE,
                    DISPLAY_INVALID_NUMBER,
                    SYMBOL_OTHERS,
                ]

                const mustCats = cats.map((v) => {
                    const count = oneCount[v] ? oneCount[v].filteredCount : 0
                    const sum = oneCount[v] ? oneCount[v].filteredSum : 0
                    return { x: v, count, sum }
                })
                const specials = specialCats
                    .map((v) => {
                        const includeInCount = (v) => {
                            if (!oneCount[v]) return false
                            if (oneCount[v].totalCount == 0) return false
                            return true
                        }
                        const count = includeInCount(v)
                            ? oneCount[v].filteredCount
                            : 0
                        const sum = includeInCount(v)
                            ? oneCount[v].filteredSum
                            : 0
                        return { x: symbolToDisplay(v), count, sum }
                    })
                    .filter((v) => v.count > 0)

                const optionals = Object.keys(oneCount)
                    .filter(
                        (v) => !(specialCats.includes(v) || cats.includes(v))
                    )
                    .map((v, i) => {
                        const count = oneCount[v].filteredCount
                        const sum = oneCount[v].filteredSum
                        const totalCount = oneCount[v].totalCount
                        const totalSum = oneCount[v].totalSum
                        return { x: v, count, sum, totalCount, totalSum }
                    })

                const { x_sortOn = "v", x_sortOrder = "a" } = oneConfig //TODO parametrise ths

                const getSortKey = () => {
                    if (
                        x_sortOn === undefined ||
                        x_sortOn === "none" ||
                        x_sortOn === ""
                    )
                        return ""
                    if (x_sortOn === "cat") return "x"
                    if (countType === "Count") return "totalCount"
                    if (countType === "Sum") return "totalSum"
                    return (d) =>
                        d.totalCount > 0 ? d.totalSum / d.totalCount : 0
                }

                const sortKey = getSortKey()

                const sortedOptionals =
                    sortKey === ""
                        ? [...optionals]
                        : _.sortArrayOrObjects(optionals, {
                              key: sortKey,
                              order: x_sortOrder,
                          })

                const optionalCount = sortedOptionals.length

                const maxOptionals =
                    MAX_BAR_CATS - (cats.length + specials.length)

                if (optionalCount > maxOptionals) {
                    const others = { x: DISPLAY_OTHERS, count: 0, sum: 0 }
                    const countToRemove = optionalCount - maxOptionals
                    let countOfRemoved = 0

                    for (let i = optionalCount - 1; i >= 0; i--) {
                        const so = sortedOptionals[i]
                        if (countOfRemoved >= countToRemove) break
                        others.count += so.count
                        others.sum += so.sum
                        countOfRemoved++
                        so.remove = true
                    }
                    // console.log(sortedOptionals)
                    //update the others
                    const othersInSpecialsIndex = specials.findIndex(
                        (v) => v.x === DISPLAY_OTHERS
                    )
                    if (othersInSpecialsIndex != -1) {
                        const existingOthers = specials[othersInSpecialsIndex]
                        // console.log(others, existingOthers)
                        existingOthers.count += others.count
                        existingOthers.sum += others.sum
                        // console.log(existingOthers)
                    } else specials.push(others)
                }

                const data = [
                    ...mustCats,
                    ...sortedOptionals.filter((v) => !v.remove),
                    ...specials,
                ].map((d) => {
                    return { x: d.x, v: getDisplayValue(countType, d) }
                })
                return { data }
            }
            if (chartType == "Data Table") {
                const data = [],
                    labels = []

                for (const key in oneCount) {
                    labels.push(key)
                    data.push({ "#": key, ...oneCount[key].filteredValue })
                }
                return { labels, data }
            }
            if (chartType == "Data Description") {
                let data = [],
                    labels = []
                const headers = {
                    spaceCount: "Spaces: #",
                    stringCount: "Strings: #",
                    maxString: "String: Max",
                    minString: "String: Min",
                    dateCount: "Date: #",
                    maxDate: "Date: Max",
                    minDate: "Date: Min",
                    numberCount: "Number: #",
                    maxNumber: "Number: Max",
                    minNumber: "Number: Min",
                }

                for (const head of Object.keys(headers)) {
                    const entry = {}
                    entry["Attributes"] = headers[head]
                    for (const key of Object.keys(oneCount)) {
                        entry[key] = oneCount[key][head] ?? ""
                    }
                    data.push(entry)
                    labels.push(i++)
                }
                return { labels, data }
            }
            if (chartType == "2X2" || chartType == "State Change") {
                const { x_labels, y_labels, countLabels } = oneConfig

                const data = Object.keys(oneCount).map((key) => ({
                    x: oneCount[key].x,
                    y: oneCount[key].y,
                    v: getDisplayValue(countType, oneCount[key]),
                }))
                const extent = d3.extent(data, (d) => d.v)
                const xDomain = x_labels ? _.getArray(x_labels) : []
                const yDomain = y_labels ? _.getArray(y_labels) : []
                const countDomain = _.getArray(countLabels)
                data.forEach((v) => {
                    if (!xDomain.includes(v.x)) xDomain.push(v.x)
                    if (!yDomain.includes(v.y)) yDomain.push(v.y)
                    v.fill = fill(v.v)
                })
                const domain = { countDomain, xDomain, yDomain }
                return { domain, data }

                function fill(d) {
                    const min = extent[0]
                    if (!extent[1]) console.log("Y")
                    const step = (extent[1] - min) / (countDomain.length - 1)
                    const index = step === 0 ? 0 : Math.floor((d - min) / step)
                    return countDomain[index]
                }
            }
            if (chartType == "Risk") {
                const { x_labels, y_labels, countLabels } = oneConfig

                const xDomain = _.getArray(x_labels)
                const yDomain = _.getArray(y_labels)
                const countDomain = _.getArray(countLabels)

                const colorValue = (count) => {
                    const value = Number(count.x) * Number(count.y)
                    if (value <= 2) return countDomain[0]
                    if (value <= 6) return countDomain[1]
                    if (value <= 12) return countDomain[2]
                    if (value <= 16) return countDomain[3]
                    return countDomain[4]
                }
                const data = Object.keys(oneCount).map((key) => ({
                    x: xDomain[Number(oneCount[key].x) - 1],
                    y: yDomain[Number(oneCount[key].y) - 1],
                    fill: colorValue(oneCount[key]),
                    v: getDisplayValue(countType, oneCount[key]),
                }))
                const domain = {
                    countDomain,
                    xDomain,
                    yDomain: yDomain.reverse(),
                }
                return { domain, data }
            }
            if (chartType == "Plan") {
                return { labels: [], data: oneCount }
            }
            if (chartType == "Trend OC" || chartType == "Trend") {
                const { x_label } = oneConfig
                const isCumulative = true
                let cumulativeCount = 0
                const data = Object.keys(oneCount).map((date) => {
                    const count =
                        chartType === "Trend OC"
                            ? oneCount[date].open - oneCount[date].close
                            : oneCount[date].count
                    cumulativeCount += count
                    return {
                        x: new Date(date),
                        v: isCumulative ? cumulativeCount : count,
                        type: x_label,
                    }
                })
                const domain = { timeline: x_label }
                addPlan(data)
                addForecast(data)
                return { domain, data }

                function addPlan(plotData) {
                    const { plan } = oneConfig
                    if (!plan) return
                    if (plan.trim() === "") return
                    const output = parseGrammar(plan, PLAN_GRAMMAR)
                    if (typeof output === "string") return
                    const {
                        start,
                        end,
                        scopeFrom,
                        scopeTo,
                        points,
                        label = "Plan",
                    } = output
                    const sigmoid = [
                        0, 0.02, 0.05, 0.12, 0.27, 0.5, 0.73, 0.88, 0.95, 0.98,
                        1,
                    ]
                    const line = [0, 1]
                    const planPoints =
                        points === "line"
                            ? line
                            : points === "sigmoid"
                            ? sigmoid
                            : points

                    function getModifiedScope() {
                        const modifiedFrom = scopeFrom
                        const { filteredRowCounts } = memo
                        const modifiedTo =
                            scopeTo === "max" ? filteredRowCounts : scopeTo
                        return { modifiedFrom, modifiedTo }
                    }
                    const { modifiedFrom, modifiedTo } = getModifiedScope()

                    const deltaScope = modifiedTo - modifiedFrom
                    const dateSteps =
                        _.dateTimeDiff(start, end, "Days") /
                        (planPoints.length - 1)
                    for (let i = 0; i < planPoints.length; i++) {
                        // console.log(Math.round(i * dateSteps))
                        const x = _.addDays(start, Math.round(i * dateSteps))
                        const v = Math.round(
                            modifiedFrom + deltaScope * planPoints[i]
                        )
                        plotData.push({ x, v, type: label })
                    }
                    domain.plan = label
                }
                function addForecast(plotData) {
                    //forecast
                    if (!memo) return
                    if (!memo.forecast) return
                    const {
                        count,
                        lookBack,
                        lookBackValues,
                        cutoffDate,
                        forecastTo,
                        label,
                    } = memo.forecast

                    if (lookBack <= 0) return

                    let slope = count / lookBack
                    // const intercept = value - slope * valueAtPoint // the point matches actual
                    // const intercept = (cumSum -count) - slope * 0 //first point matches actual
                    const intercept =
                        cumulativeCount - slope * (lookBackValues.length - 1) //last point matches actual
                    // const intercept =
                    //     cumSum - count / 2 - (slope * (lookBackValues.length - 1)) / 2 //mid point matches actual
                    const { filteredRowCounts } = memo
                    const linear = { slope, intercept }

                    const forecastStart = {
                        x: new Date(cutoffDate),
                        v: cumulativeCount - count,
                        type: label,
                    }
                    const endX = getX(filteredRowCounts, linear)
                    let endXModified = endX
                    const fallback = 100
                    if (endX > 0 && endX > fallback) {
                        logMessage(
                            `Forecast limited to ${fallback} days`,
                            "warning",
                            i,
                            allCounts,
                            0
                        )
                        endXModified = fallback
                    }
                    const endPoint = () => {
                        const endDate =
                            forecastTo === "max"
                                ? _.addDays(cutoffDate, endXModified)
                                : _.isValidDate(forecastTo)
                                ? forecastTo
                                : _.addDays(cutoffDate, forecastTo)

                        const endCount =
                            forecastTo === "max"
                                ? filteredRowCounts
                                : getY(
                                      _.dateTimeDiff(cutoffDate, endDate),
                                      linear
                                  )

                        return {
                            x: new Date(endDate),
                            v: Math.round(endCount),
                            type: label,
                        }
                    }

                    plotData.push(forecastStart)
                    plotData.push(endPoint())

                    domain.forecast = label
                    function getY(x, { intercept, slope }) {
                        return intercept + slope * x
                    }
                    //TODO check if the forecast end is too far away
                    function getX(y, { intercept, slope }) {
                        const delta = y - intercept
                        if (slope === 0) return delta > 0 ? Infinity : -Infinity
                        const x = delta / slope
                        return x
                    }
                }
            }
        }
    }
    function makeCallOuts(allCounts, config) {
        allCounts.callOuts = {}
        // const charts = config.chartProperties
        const { callOuts } = config
        if (!callOuts) return
        for (let i = 0; i < callOuts.length; i++) {
            const error = (bottom) => {
                allCounts.callOuts[i] = { top: "ERR", bottom }
            }
            const chartNumber = callOuts[i].chartNumber
            if (chartNumber === undefined) {
                error(`Chart number missing`)
                continue
            }
            const chartProperties = config.chartProperties[chartNumber]
            if (!chartProperties) {
                error(`No chart for chart number: ${chartNumber}`)
                continue
            }
            const { chartType } = chartProperties
            if (!chartType) {
                error(`No chart type for chart number: ${chartNumber}`)
                continue
            }

            const getCallout = chartTypes[chartType].getCallout
            if (!getCallout) {
                error(`No callout for chart type: ${chartType}`)
                continue
            }
            const data = allCounts.data[chartNumber]?.data
            const { top, bottom } = getCallout(
                config.callOuts[i],
                chartProperties,
                data
            )
            allCounts.callOuts[i] = { top, bottom }
        }
    }

    exports.getFirstRecord = getFirstRecord
    exports.getCountsFromFile = getCountsFromFile

    exports.getChartDataTypes = getChartDataTypes
    exports.getChartDescription = getChartDescription

    exports.validateChart = validateChart
    exports.validateCallout = validateCallout
})
// import { Papa } from "./papaparse.js"
//export $p

//////////////////////////////////////////////////// allCounts current
// allCounts =  {memo, counts}
// memo = {dataDescription, {0: value}, {1: value}, ...}
// counts = {0: oneCount, 1: oneCount, ...}
// oneCount =
// {
//      cat1: {
//          include: true|false,
//          totalSumV: sum of column over without filter
//          filteredSum: sum of column over with filter
//          totalCount: count of records without filter
//          filteredCount: count of records with filter
//      }
//      cat2: {...},
//      ....
// }

//////////////////////////////////////////////////// allCounts proposed
// counts =  {global: memoCount, 0: memoCount, 1: memoCount, ...}
// memoCount = {memo: {}, count: oneCount}
// oneCount =
// {
//      cat1: {
//          include: true|false,
//          totalSumV: sum of column over without filter
//          filteredSum: sum of column over with filter
//          totalCount: count of records without filter
//          filteredCount: count of records with filter
//      }
//      cat2: {...},
//      ....
// }

///////////////////////////////////////////////////// remove $p comments

///////////////////////////////////////////////////////////// values in memo
// dataDescription (filtered and raw)
//  chartType   types of data in memo
//  trend       forecast, start, end
//  number      bin
//  date
//
