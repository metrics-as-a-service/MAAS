////common functions
'use strict'
const DISPLAY_OTHERS = "..."
const DISPLAY_INVALID = "?"
const DISPLAY_LESS = "<"
const DISPLAY_MORE = ">"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WORKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function formatDate(date, format) {
    const newDate = new Date(date)
    const dateparts = newDate.toDateString().split(" ") //datepart = Thu Jul 13 2023 (DDD MMM DD YYYY)

    const DDD = dateparts[0]
    if (DDD == "Invalid") return DISPLAY_INVALID
    if (!format) return true
    const MMM = dateparts[1]
    const monthNumber = newDate.getMonth() + 1
    const MM = (monthNumber < 10 ? "0" : "") + monthNumber.toString()
    const DD = dateparts[2]
    const YYYY = dateparts[3]
    const YY = YYYY.substring(2, 4)

    let fomatedDate = format.replace("DDD", DDD)
    fomatedDate = fomatedDate.replace("DD", DD)
    fomatedDate = fomatedDate.replace("MMM", MMM)
    fomatedDate = fomatedDate.replace("MM", MM)
    fomatedDate = fomatedDate.replace("YYYY", YYYY)
    fomatedDate = fomatedDate.replace("YY", YY)
    return fomatedDate
}
function isValidDate(date) {// checks for "YYYY-MM-DD" or DD-MMM-YY {
    function isOK(DD, MM, YYYY) {
        if (YYYY < 2000) return false
        if (MM > 12) return false
        const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        if (MM != 2) return DD <= days[MM - 1]
        if (DD <= 28) return true
        const leapyear = (YYYY % 100 == 0) ? (YYYY % 400 == 0) : (YYYY % 4 == 0)
        if (leapyear && DD == 29) return true
        return false
    }
    if (!date) return false

    // const dateWithHyphen = date.toUpperCase().replaceAll("/", "-") // allow for / as a separater 
    const dateWithHyphen = date

    const YYYY_MM_DD = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;
    if (dateWithHyphen.search(YYYY_MM_DD) == 0) {
        if (date.length != 10) return false
        const dateparts = date.split("-")
        const YYYY = Number(dateparts[0])
        const MM = Number(dateparts[1])
        const DD = Number(dateparts[2])
        return isOK(DD, MM, YYYY)
    }

    const DD_MMM_YY = /[0-9]{2}-[A-Z]{3}-[0-9]{2}/ig;
    if (dateWithHyphen.search(DD_MMM_YY) == 0) {
        if (date.length != 9) return false
        const dateparts = dateWithHyphen.split("-")
        const YYYY = 20 + Number(dateparts[3])
        const MMM = dateparts[1]
        const DD = Number(dateparts[0])
        const MM = MONTHS.findIndex(v => v.toUpperCase() == MMM) + 1
        if (MM == 0) return false
        return isOK(DD, MM, YYYY)
    }
    const DD_MMM_YYYY = /[0-9]{2}-[A-Z]{3}-[0-9]{4}/ig;
    if (dateWithHyphen.search(DD_MMM_YYYY) == 0) {
        if (date.length != 11) return false
        const dateparts = dateWithHyphen.split("-")
        const YYYY = Number(dateparts[3])
        const MMM = dateparts[1]
        const DD = Number(dateparts[0])
        const MM = MONTHS.findIndex(v => v.toUpperCase() == MMM) + 1
        if (MM == 0) return false
        return isOK(DD, MM, YYYY)
    }
    return false

}
const dateTimeDiff = function (dateTimeStart, dateTimeEnd, format = "Days") {
    function workdays(startDate, endDate) {
        let workdays = 0
        let currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const dayofweek = currentDate.toDateString().substring(0, 3)
            if (WORKDAYS.findIndex(v => v == dayofweek) != -1)
                workdays++
            currentDate = new Date(currentDate.getTime() + millisecondsinday)
        }

        return workdays - 1
    }
    const start = new Date(dateTimeStart)
    const end = new Date(dateTimeEnd)
    const diffTimeMilliseconds = end - start;
    const formatUC = format.toUpperCase()
    if (formatUC == "MILLISECONDS") return diffTimeMilliseconds
    const millisecondsinday = 1000 * 60 * 60 * 24
    if (formatUC == "DAYS") return Math.ceil(diffTimeMilliseconds / millisecondsinday)
    if (formatUC == "WEEKS") return Math.ceil((diffTimeMilliseconds / millisecondsinday) / 7)
    if (formatUC == "WORKDAYS") return workdays(start, end)
}

const addDays = function (dateTimeStart, days) {
    const start = new Date(dateTimeStart)
    start.setDate(start.getDate() + days);
    return start.toISOString().substring(0, 10)
}
const _getCSSVar = function (v) {
    const style = getComputedStyle(document.body)
    return style.getPropertyValue(v)
}

//////////////////////////////////////////////////////////////
let $p = (function () {
    'use strict'
    var $ = {};// public object - returned at end of module
    let config = {}
    let demoDate = ""
    const chartTypes = {
        "Date": {
            formats: ["YYYY", "MMM", "MMM-YY", "DDD", "DD", "W-8", "W-4+4", "W+8"],
            getminmax: (dateFormat) => {
                const hasMinus = dateFormat.indexOf("-")
                const min = hasMinus == -1 ? 0 : -Number(dateFormat[hasMinus + 1])
                const hasPlus = dateFormat.indexOf("+")
                const max = hasPlus == -1 ? 0 : Number(dateFormat[hasPlus + 1])
                return { min, max }
            },
            orderedValues: (col) => {
                const { dateFormat } = col
                if (!dateFormat) return []
                if (dateFormat == "MMM") return MONTHS
                if (dateFormat == "DDD") return WEEKDAYS
                if (dateFormat == "DD") {
                    const days = []
                    for (let i = 1; i < 32; i++) days.push(i)
                    return days
                }
                if (dateFormat.substring(0, 1) == "W") {
                    const { min, max } = chartTypes['Date'].getminmax(dateFormat)
                    const weeks = ["<"]
                    for (let i = min; i <= max; i++) weeks.push(i + "W")
                    weeks.push(">")
                    return weeks
                }
                return []
            },
            sortKey: (v, col) => {
                const { dateFormat } = col
                if (v == DISPLAY_INVALID) return v
                if (dateFormat == "MMM") {
                    const m = MONTHS.findIndex((val) => val == v)
                    console.assert(m != -1, `MMM failed value: ${v}`)
                    return m
                }
                if (dateFormat == "DDD") {
                    const wd = WEEKDAYS.findIndex((val) => val == v)
                    console.assert(wd != -1, `DDD failed value: ${v}`)
                    return wd
                }
                if (dateFormat == "MMM-YY") {
                    const MMMYY = v.split("-")
                    const MMM = MMMYY[0]
                    const YY = MMMYY[1]
                    const m = MONTHS.findIndex((val) => val == MMM) + 1
                    console.assert(m >= 1 && m <= 12, `MMM-YY failed value: ${v}, ${m}`)
                    const mm = m < 10 ? "0" + m : m.toString()
                    return `20${YY}-${mm}-01`
                }
                if (dateFormat == "W4") {
                    return v.replace("W", "")
                }
                return v
            },
            formatValue: (v, col) => {
                if (!isValidDate(v)) return "?"

                const { dateFormat } = col
                if (dateFormat.substring(0, 1) != "W") {
                    const fomateddate = formatDate(v, dateFormat)
                    return { formatedValue: fomateddate, unFormatedValue: chartTypes['Date'].sortKey(fomateddate, col) }
                }
                function formatWeek(w, min, max) {
                    if (w < min) return "<"
                    if (w > max) return ">"
                    return w.toString() + "W"
                }
                const { min, max } = chartTypes['Date'].getminmax(dateFormat)

                const weeks = Math.floor(dateTimeDiff(config.reportDate, v, "Days") / 7)
                const fomateddate = formatWeek(weeks, min, max)

                return { formatedValue: fomateddate, unFormatedValue: chartTypes['Date'].sortKey(fomateddate, col) }
            }
        },
        "Note": {
            cannotFilter: true,
            hasSpecialCounter: true,
        },
        'Number': {
            formatValue: (v, col) => {
                function returnValue(f, uf) {
                    return { formatedValue: f, unFormatedValue: uf }
                }
                function binnedValues(v, bin) {
                    if (v <= bin[0]) {
                        return {
                            formatedValue: "<" + bin[0],
                            unFormatedValue: v
                        }
                    }
                    if (v > bin[bin.length - 1]) {
                        return {
                            formatedValue: ">",
                            unFormatedValue: v
                        }
                    }
                    const binIndex = bin.findIndex((e => e >= v))
                    if (binIndex == -1) {
                        return {
                            formatedValue: bin[bin.length - 1] + ">",
                            unFormatedValue: v//bin[bin.length - 1] + 1
                        }
                    }

                    return {
                        formatedValue: bin[binIndex - 1] + "-" + bin[binIndex],
                        unFormatedValue: v//bin[binIndex - 1] + 0
                    }
                }
                if (isNaN(v)) return returnValue(DISPLAY_INVALID, v)
                const { bin } = col
                if (!bin) returnValue(v, v)

                if (Array.isArray(bin))
                    return binnedValues(parseFloat(v), bin)
                else {
                    const numberVal = parseFloat(v, 10)
                    return returnValue(numberVal, numberVal)
                }
            },
            orderedValues: (col) => {
                const { bin } = col
                if (!bin) return []
                const binValues = []
                const getBin = chartTypes['Number'].formatValue
                bin.forEach(v => binValues.push(getBin(v, col).formatedValue))
                binValues.push(getBin(bin[bin.length - 1] + 1, col).formatedValue)
                return binValues
            },
        },
        'List Members': {
            cannotFilter: true,
            hasSpecialCounter: true,
        },
        'List Count': {
            formatValue: (v, col) => {
                function countMembers() {
                    let count = 0
                    listmembers.forEach(v => {
                        if (v.trim() != "") count++
                    })
                    return count
                }
                const { separator } = col
                const list = v.trim()
                const listmembers = list.split(separator)
                const listmembersCounts = countMembers()
                return { formatedValue: listmembersCounts, unFormatedValue: listmembersCounts }
            }
        },
        'String': {
            orderedValues: (col) => {
                const { order } = col
                if (!order) return []
                return order
            },
        },
        'Risk': {
            cannotFilter: true,
            formatValue: (v, col, row) => {
                function reformat(x) {
                    if (!x) return DISPLAY_INVALID
                    if (isNaN(x)) return DISPLAY_INVALID
                    if (x < 1 || x > 5) return DISPLAY_INVALID
                    return x.toString()
                }
                if (!col || !row) return { formatedValue: DISPLAY_INVALID, unFormatedValue: DISPLAY_INVALID }
                const { impactCol, likelihoodCol } = col
                const impact = row[impactCol]
                const likelihood = row[likelihoodCol]
                const xy = reformat(likelihood) + "|" + reformat(impact)
                return { formatedValue: xy, unFormatedValue: xy }
            }
        },
        '2X2': {
            cannotFilter: true,
            formatValue: (v, col, row) => {
                if (!col || !row) return { formatedValue: DISPLAY_INVALID, unFormatedValue: DISPLAY_INVALID }
                const { xCol, yCol } = col
                const x = row[xCol].trim()
                const y = row[yCol].trim()
                const xy = x + "|" + y
                return { formatedValue: xy, unFormatedValue: xy }
            }
        },
        'State Change': {
            cannotFilter: true,
            hasSpecialCounter: true,
            formatValue: (v, col, row) => {
                if (!col || !row) return { formatedValue: DISPLAY_INVALID, unFormatedValue: DISPLAY_INVALID }
                const { fromCol, toCol } = col
                const to = row[toCol].trim()
                const from = row[fromCol].trim()
                const tofrom = to + "|" + from
                return { formatedValue: tofrom, unFormatedValue: tofrom }
            }
        },
        'Data Table': { cannotFilter: true, hasSpecialCounter: true },
        'Data Description': { cannotFilter: true, hasSpecialCounter: true },
        'Plan': { cannotFilter: true, hasSpecialCounter: true },
        'Trend': {
            cannotFilter: true,
            hasSpecialCounter: true,
            orderedValues: (col) => { return chartTypes['Trend OC'].orderedValues(col) },
            formatValue: (v, col) => { return chartTypes['Trend OC'].formatValue(v, col) }
        },
        'Trend OC': {
            cannotFilter: true,
            hasSpecialCounter: true,
            orderedValues: (col) => {
                const { trendStartDate, } = col
                const trendEndDate = config.reportDate
                const returnValue = []
                const datasteps = 30
                const dateDiference = dateTimeDiff(trendStartDate, trendEndDate, "Days") + 1
                const deltaMilliseconds = (24 * 60 * 60 * 1000) * (dateDiference > datasteps ? dateDiference / datasteps : 1)
                let date = new Date(trendStartDate)
                for (let i = 0; i <= datasteps; i++) {
                    returnValue.push(date.toISOString().substring(0, 10))
                    date.setMilliseconds(date.getMilliseconds() + deltaMilliseconds)
                }
                return returnValue
            },
            formatValue: (v, col) => {
                const datasteps = 30
                const { trendStartDate } = col
                const trendEndDate = config.reportDate
                if (!isValidDate(v)) {
                    return { formatedValue: DISPLAY_INVALID, unFormatedValue: DISPLAY_INVALID }
                }
                // let date = dateparts[4]
                if (v <= trendStartDate) return { formatedValue: trendStartDate, unFormatedValue: trendStartDate }
                if (v > trendEndDate) return { formatedValue: trendEndDate, unFormatedValue: trendEndDate }

                const dateDiference = dateTimeDiff(trendStartDate, trendEndDate, "Days") + 1
                const deltaMilliseconds = (24 * 60 * 60 * 1000) * (dateDiference > datasteps ? dateDiference / datasteps : 1)

                const startToMapMilliseconds = (dateTimeDiff(trendStartDate, v, "Days") + 1) * (24 * 60 * 60 * 1000)
                const datastep = Math.floor(startToMapMilliseconds / deltaMilliseconds) + 1
                const date = new Date(trendStartDate)
                date.setMilliseconds(date.getMilliseconds() + datastep * deltaMilliseconds)
                //return date.toISOString.substring(0, 10)
                return { formatedValue: date.toISOString().substring(0, 10), unFormatedValue: date.toISOString().substring(0, 10) }
            }
        }
    }

    //////////////////////////////////////chartTypes Functionbs
    $.getChartTypes = function () {
        return Object.keys(chartTypes).sort()
    }
    $.getDateFormats = function () {
        return chartTypes["Date"].formats.sort()
    }
    $.getFotmattedValue = function (col, value, row) {
        const { type } = col
        const invalidvalues = { formatedValue: DISPLAY_INVALID, unFormatedValue: DISPLAY_INVALID }

        if (!type) return invalidvalues
        if (!chartTypes[type]) return invalidvalues
        if (chartTypes[type].formatValue) return chartTypes[type].formatValue(value, col, row)

        return { formatedValue: value, unFormatedValue: value }
    }
    $.getOrderedValues = function (type, col) {
        if (!type) return []
        if (!chartTypes[type]) return []

        const orderedValues = chartTypes[type].orderedValues
        if (orderedValues) return orderedValues(col)
        return []
    }
    $.cannotFilter = function (type) {
        if (!type) return false
        if (!chartTypes[type]) return false
        if (!chartTypes[type].cannotFilter) return false
        return chartTypes[type].cannotFilter
    }
    $.hasSpecialCounter = function (type) {
        if (!type) return false
        if (!chartTypes[type]) return false
        if (!chartTypes[type].hasSpecialCounter) return false
        return chartTypes[type].hasSpecialCounter
    }
    ///////////////////////////////////////////////////////////////////////////


    $.transformRow = function (row) {
        function trimandchangedates() {
            for (const [key, value] of Object.entries(row)) {
                let trimmedValue = value.trim()
                if (isValidDate(trimmedValue)) {
                    if (demoDate != "") {
                        //const today = new Date().toISOString().substring(0, 10)
                        const daysToAdd = dateTimeDiff(demoDate, config.reportDate, "Days")
                        trimmedValue = addDays(value, daysToAdd)
                    }
                    trimmedValue = formatDate(trimmedValue, "YYYY-MM-DD")
                }
                row[key] = trimmedValue
            }
        }
        function addNewColumns() {
            //include insertion of calculated columns
        }

        trimandchangedates()
        addNewColumns()
        let transformedRow = {}
        config.cols.forEach((e, i) => {
            transformedRow[i] = this.getFotmattedValue(e, row[e.colname], row) //transformCol(e, row[e.colname], row)//transformCol(e.type, row[e.colname], e.bins, row)
        })
        return transformedRow
    }
    $.getdemoDate = function () { return demoDate }
    $.getDisplayValue = function (countType, v) {

        if (countType == "Sum" || countType == "Sum of Transition Duration") return v.filteredSum
        if (countType == "Average" || countType == "Average of Transition Duration") {
            return v.filteredCount > 0 ? (v.filteredSum / v.filteredCount).toFixed(1) : 0
        }
        return v.filteredCount
    }
    $.transformDataAndLabels = function (i, dataIn) {
        const sortArrayOfObjects = (arr, sortparams) => { //propertyName, order = 'a') => {
            const { propertyName, order } = sortparams
            const sortedArr = arr.sort((a, b) => {
                const avalue = a[propertyName]
                const bvalue = b[propertyName]
                if (avalue < bvalue) return -1;
                if (avalue > bvalue) return 1;
                return 0;
            });

            if (order === 'd') {
                return sortedArr.reverse();
            }

            return sortedArr;
        };
        function appendToEnd(keys) {
            keys.forEach(key => {
                if (specials[key])
                    sortedCounts.push({
                        cat: key,
                        value: specials[key],
                    })
            })
        }

        const { countType, type, bin, order } = config.cols[i]

        const datapoints = Object.keys(dataIn).length

        // if (type == "Data") {
        //     function datatablevalues() {
        //         const data = [], labels = []
        //         const dataLength = Object.keys(dataIn).length
        //         for (i = 1; i <= dataLength; i++) {
        //             labels.push(i)
        //             data.push({ "": i, ...dataIn[i].filteredValue })
        //         }
        //         return { labels, data }
        //     }

        //     function datadescriptionvalues() {
        //         const data = [], labels = []
        //         const headers = {
        //             spaceCount: "Spaces: #",
        //             numberStringCount: "Strings: #", maxstring: "String: Max", minstring: "String: Min",
        //             numberDateCount: "Date: #", maxdate: "Date: Max", mindate: "Date: Min", avDate: "Date: Av",
        //             numberValueCount: "Number: #", maxnumber: "Number: Max", minnumber: "Number: Min", avnumber: "Number: Av",
        //         }

        //         let i = 0
        //         for (const head of Object.keys(headers)) {
        //             const entry = {}
        //             entry[""] = headers[head]
        //             for (const key of Object.keys(dataIn)) {
        //                 entry[key] = dataIn[key][head] ?? ""
        //             }
        //             data.push(entry)
        //             labels.push(i++)
        //         }
        //         return { labels, data }
        //     }

        //     const { dataformat } = config.cols[i]
        //     if (dataformat == "Table") return datatablevalues()
        //     return datadescriptionvalues()
        // }

        if (type == "Data Table") {
            let data = [], labels = []
            const dataLength = Object.keys(dataIn).length
            for (i = 1; i <= dataLength; i++) {
                labels.push(i)
                data.push({ "#": i, ...dataIn[i].filteredValue })
            }
            return { labels, data }
        }
        if (type == "Data Description") {
            let data = [], labels = []
            const headers = {
                spaceCount: "Spaces: #",
                numberStringCount: "Strings: #", maxstring: "String: Max", minstring: "String: Min",
                numberDateCount: "Date: #", maxdate: "Date: Max", mindate: "Date: Min", /* avDate: "Date: Av", */
                numberValueCount: "Number: #", maxnumber: "Number: Max", minnumber: "Number: Min", /* avnumber: "Number: Av", */
            }
            // const dataLength = Object.keys(dataIn).length
            // console.log(dataIn)
            const head = Object.keys(dataIn)
            let i = 0

            // for (const key of Object.keys(dataIn)) {
            //     const entry = {}
            //     entry[""] = key
            //     for (const head of Object.keys(headers)) {
            //         const h = headers[head]
            //         entry[h] = dataIn[key][head] ?? ""
            //     }
            //     data.push(entry)
            //     labels.push(i++)
            // }

            for (const head of Object.keys(headers)) {
                const entry = {}
                entry["Attributes"] = headers[head]
                for (const key of Object.keys(dataIn)) {
                    entry[key] = dataIn[key][head] ?? ""
                }
                data.push(entry)
                labels.push(i++)
            }
            return { labels, data }
        }
        if (type == "Risk" || type == "2X2" || type == "State Change") {
            return { labels: [], data: dataIn }
        }
        if (type == "Plan") {
            return { labels: [], data: dataIn }
        }
        if (type == "Trend OC" || type == "Trend") {
            const labels = this.getOrderedValues(type, config.cols[i])
            return { labels, data: dataIn }
            // return { labels: this.getOrderedValues(type, config.cols[i]), data: dataIn }
        }

        if (datapoints > 30) { ///move this to end of file processing????
            function addtoDISPLAY_OTHERS(x) {
                for (const key in x) {
                    const newvalue = x[key]
                    if (isNaN(newvalue)) return
                    dataIn[DISPLAY_OTHERS][key] += newvalue
                }
            }

            // if (dataIn[DISPLAY_OTHERS])
            //     $l.log(`100+ unique values present, larger values may be obscured`, "warning", i)

            //reduce the counts to 30
            if (!dataIn[DISPLAY_OTHERS]) {
                dataIn[DISPLAY_OTHERS] = {
                    totalSum: 0,
                    filteredSum: 0,
                    totalCount: 0,
                    filteredCount: 0
                }
            }
            const counts = []
            for (const [col, value] of Object.entries(dataIn)) {
                const displayValue = this.getDisplayValue(countType, value)
                counts.push({
                    col: col,
                    value: displayValue,
                })
            }
            const sortedCounts = sortArrayOfObjects(counts, { propertyName: "value", order: "d" })//"value", "d")
            for (let i = 0; i < sortedCounts.length; i++) {
                const col = sortedCounts[i].col
                if (col == DISPLAY_OTHERS || col == DISPLAY_INVALID) continue
                if (i > 30) {
                    addtoDISPLAY_OTHERS(dataIn[col])
                    delete dataIn[col]

                }
            }
        }

        const orderedValue = this.getOrderedValues(type, config.cols[i]) //bin ? getOrderedValues(type, config.cols[i]) : order ? order : getOrderedValues(type, config.cols[i])


        let counts = [], specials = {}, orderedCounts = []

        orderedValue.forEach(v => orderedCounts.push({ cat: v, value: 0 }))

        for (const [col, value] of Object.entries(dataIn)) {
            const displayValue = this.getDisplayValue(countType, value)
            if (col == DISPLAY_OTHERS || col == DISPLAY_INVALID)
                specials[col] = displayValue
            else {
                const i = orderedCounts.findIndex(v => v.cat == col)
                if (i == -1) //not in order
                    counts.push({
                        cat: col,
                        value: displayValue,
                        sortkey: value.sortkey
                    })
                else
                    orderedCounts[i].value = displayValue
            }
        }
        //if date type then insert all values and add a sort value
        const sortparam = type == "List Members" ? { propertyName: "value", order: "d" } : { propertyName: "sortkey", order: "a" }
        let sortedCounts = sortArrayOfObjects(counts, sortparam)//"sortkey")

        appendToEnd([DISPLAY_OTHERS, DISPLAY_INVALID])
        orderedCounts.toReversed().forEach(v => {
            sortedCounts.unshift(v)
        })

        let labels = [], data = []
        sortedCounts.forEach(e => { labels.push(e.cat); data.push(e.value) })

        return { labels, data }
    }
    $.getNoOfCharts = function () {
        if (!config.cols) return 0
        return config.cols.length
    }
    $.getColProperties = function (index) {
        if (!config.cols[index]) {
            $l.log(`Invalid call to getColProperties; index= ${index}`, "error")
            return
        }
        let returnCol = JSON.parse(JSON.stringify(config.cols[index]))
        returnCol.title = (Number(index) + 1).toString() + ". " + config.cols[index].title
        returnCol.titleWOIndex = config.cols[index].title
        return returnCol
    }

    $.setColProperties = function (index, newValues) {
        let updated = false
        const col = config.cols[index]

        for (const [key, value] of Object.entries(newValues)) {
            //if (col[key] == undefined) continue
            if ((col[key] != value)) {
                col[key] = value
                updated = true
            }
        }
        if (col.position) delete col.position

        for (const key of Object.keys(col)) {
            if (newValues[key] == undefined) delete col[key]
        }

        const position = Number(newValues.position) - 1
        if (position != index) {
            function arrayMove(arr, oldIndex, newIndex) {
                if (newIndex >= arr.length) {
                    let k = newIndex - arr.length + 1;
                    while (k--) {
                        arr.push(undefined);
                    }
                }
                arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
            };
            //console.log(index, position)
            arrayMove(config.cols, index, position)
            updated = true
        }

        return updated
    }
    $.configAction = async function (file) {
        if (!config) return "Reset Config"
        if (!config.file) return "Reset Config"
        const filename = typeof file == "string" ? file : file.name
        const configfilename = typeof config.file == "string" ? config.file : config.file.name

        if (!configfilename) {
            //TO DO check if same headers????????
            config.file = file
            return "Keep Config"
        }
        if (configfilename == filename) {
            //TO DO check if same headers????????
            config.file = file
            return "Keep Config"
        }

        const action = await $dialog.alert(
            `The current file is: "${filename}" but config is for file "${configfilename}". Override config`,
            ["Keep Config", "Reset Config", "Abort Load"])
        return action
    }
    $.autoCreateConfig = function (file, row, action) {
        function autoType(value) {
            if (value.trim() == "") return "String"
            if (!isNaN(value)) return "Number"
            //const d = new Date(value)
            if (isValidDate(value)) return "Date"
            return "String"
        }
        function createDeafult() {
            const d = new Date()
            config.reportDate = d.toISOString().substring(0, 10)
            config.reportTitle = 'Auto-generated Metrics'
            config.maxValues = 30
            config.file = file
            config.colNames = []
            config.colTypes = []
            config.callouts = [] //use in future
            const autoCols = []
            for (const [colName, value] of Object.entries(row.data)) {
                const type = autoType(value)
                const col = {
                    title: ("Count by " + colName).toUpperCase(),
                    autoTitle: true,
                    chartSize: "Small",
                    colname: colName,
                    countif: "",
                    countType: "Count",
                    autoType: type,
                    type: type,
                }
                if (type == "Date") col.dateFormat = "MMM"
                autoCols.push(col)


            }
            autoCols.forEach(v => {
                config.colNames.push(v.colname)
                config.colTypes.push(v.type)
            })
            //add table
            autoCols.push({
                col: autoCols[0].colname,
                title: "DATA TABLE",
                autoType: autoCols[0].autoType,
                type: "Data Table",
                countType: "Count",
                chartSize: "Small",
                maxEntries: 10

            })
            // autoCols.push({
            //     col: autoCols[0].colname,
            //     title: "DATA TABLE",
            //     autoType: autoCols[0].autoType,
            //     type: "Data",
            //     dataformat: "Table",
            //     countType: "Count",
            //     chartSize: "Small",
            //     maxEntries: 10

            // })
            //add decsription
            autoCols.push({
                col: autoCols[0].colname,
                title: "DATA DESCRIPTION",
                autoType: autoCols[0].autoType,
                type: "Data Description",
                countType: "Count",
                chartSize: "Small",
            })
            // autoCols.push({
            //     col: autoCols[0].colname,
            //     title: "DATA DESCRIPTION",
            //     autoType: autoCols[0].autoType,
            //     type: "Data",
            //     dataformat: "Description",
            //     countType: "Count",
            //     chartSize: "Samll",
            // })
            //add notes at the start

            const message = config.colNames.reduce(
                (message, col, i) => `${message}\n${i + 1}. ${col} (${config.colTypes[i]})`,
                "The input has the following data headers (value in bracket indicates type assumed):")

            autoCols.unshift({
                title: "AUTO GENERATED NOTE",
                type: "Note",
                chartSize: "Small",
                message: message,
            })

            config.cols = autoCols
        }

        if (action == "Keep Config") {
            console.assert(config.cols, `Action "${action}" is incorrect`)
            if (!config.cols) {
                createDeafult()
            }
            return
        }
        if (action == "Reset Config") {
            createDeafult()
            return
        }
        console.assert(fasle, `Action "${action}" is incorrect`)
    }

    // $.convertDemodDate = function (date) {
    //     return date
    //     if (!demoDate)
    //         return date
    //     else
    //         return date + Date() - demoDate

    // }

    $.removeCol = function (index) {
        if (!config.cols) return false

        let newCols = [], updated = false

        config.cols.forEach((v, i) => {
            if (i == index)
                updated = true
            else
                newCols.push(v)
        })

        if (updated) config.cols = newCols

        return updated

    }
    $.cloneCol = function (index) {
        if (!config.cols) return false
        if (!config.cols[index]) return false

        let newCols = [], updated = false

        config.cols.forEach((v, i) => {
            newCols.push(v)
            if (i == index) {
                updated = true
                const newValue = JSON.parse(JSON.stringify(v))
                newCols.push(newValue)
            }
        })
        if (updated) config.cols = newCols

        return updated

    }
    $.getTitleWOIndex = function (index) {
        return config.cols[index].title
    }

    $.getConfig = function () {
        let configWithoutCols = {}
        for (const [key, value] of Object.entries(config)) {
            if (key != "cols") configWithoutCols[key] = value
        }

        return configWithoutCols
    }

    $.setConfig = function (newConfig) {

        const { reportTitle, reportDate } = newConfig

        if (reportTitle)
            if (config.reportTitle != reportTitle) config.reportTitle = reportTitle


        if (reportDate)
            if (config.reportDate != reportDate) config.reportDate = reportDate

        return true
    }
    $.getConfigJSON = function () {
        try {
            const json = JSON.stringify(config, null, 2)
            return json
        } catch (e) {
            console.error(`Error while JSON.stringify(config). Cofig not copied. Error: ${e}`)
            return
        }
    }
    $.seConfigfromJSON = function (configtext) {
        if (config.cols) return
        try {
            config = JSON.parse(configtext)
            $dialog.alert("File loaded sucessfully", ["OK"])
            return true
        } catch (error) {
            const errormessage = `Config parse failed. Error: ${error}`
            //$.log("Config parse failed", "Error")
            console.log(false, errormessage)
            return false
        }
    }

    $.setDemoConfig = function (configstring, filename, date) {
        //if no data create new config execpt the report date; reportdate = today

        //validate the newConfig
        // function check(newValues, valuesMustExist) {
        //     valuesMustExist.forEach(v => {
        //         const isSame = newValues.find(p => p == v)
        //         if (!isSame) {
        //             errorsFound += `Proprty ${v} missing,`
        //         }
        //     })
        //     newValues.forEach(v => {
        //         const isSame = valuesMustExist.find(p => p == v)
        //         if (isSame == -1) {
        //             errorsFound += `Proprty ${v} extra,`
        //         }
        //     })
        // }
        //console.log(JSON.parse(configstring))
        if (!configstring) {
            $.log("Config missing", "Error")
            return false
        }
        if (!filename) {
            $.log("File name missing", "Error")
            return false
        }
        if (!date || date == "") {
            $.log("Date missing", "Error")
            return false
        }
        try {
            config = JSON.parse(configstring)
            config.file = filename
            demoDate = date
            return true
        } catch (error) {
            $.log("Config parse failed", "Error")
            console.assert(false, `Config parse failed`, configstring)
            return false
        }


        let errorsFound = ""
        const properties = ["reportDate", "reportTitle"]

        check(Object.keys(newConfig), properties)

        if (errorsFound != "") return errorsFound

        //if data present check if it matches the config
        const { colNames } = config
        if (colNames) {
            check(Object.keys(newConfig.colnames), colNames)
            if (errorsFound != "") return errorsFound
        }
    }
    return $; // expose externally
}());
//
//calculated column
//getCol(column) get(reportdate)
//calc (x,operator,y) + - / * = > >= 
//duration if closed the close-open else today-open IF contion THEN v ELSE V
//houurs, work hours, days workdays datetimediff
//map values to another MAP v1 k1 v2 m2 ....
//bin values

// function plan(x, d) {
//     const p = [0, .1, .2, .6, .8, .9, .95, 1]; //the planned path
//     const intervals = p.length - 1;
//     const ratio = Math.round(d / intervals, 0); //ratio of points i path to days in duration
//     const index = Math.floor(x / ratio); //return p[index] will give a step function
//     const delta = (p[index + 1] - p[index]) / ratio;
//     return 1.4 * (p[index] + Math.max(0, delta * (x % ratio)));
// }

