'use strict'
////////////////////////////////////////////////////////////main popup
function showChartMenus(chartID) {

    const elements = [
        { type: "button", label: "Filter Chart", onclick: `$dialog.close();filterChart("${chartID}")` },
        { type: "button", label: "Config Chart", onclick: `$dialog.close();configChart("${chartID}")` },
        { type: "button", label: "Remove Chart", onclick: `$dialog.close();removeChart("${chartID}")` },
        { type: "button", label: "Clone Chart", onclick: `$dialog.close();cloneChart("${chartID}")` },
        { type: "button", label: "Close", onclick: "$dialog.close()" },
    ]

    const key = getKey(chartID)
    const { type } = $p.getColProperties(key)
    const cannotFilter = $p.cannotFilter(type)
    if (cannotFilter) elements.shift()
    $dialog.make({ elements }).show()

}

/////////////////////////////////////////////////////////////layout dialog
function showLayoutDialog() {
    const { reportTitle, reportDate } = $p.getConfig()
    const layoutDialog = {
        elements: [
            { type: "div", cssclass: "maas-very-light", label: `Config main title & report date` },
            {
                type: "input text",
                label: "Main title: ",
                initialvalue: reportTitle,
                returnvalue: "reportTitle"
            },
            {
                type: "input date",
                label: "Report date: ",
                initialvalue: reportDate,
                returnvalue: "reportDate"
            },
            { type: 'hr' },
            { type: "button", label: "Apply", onclick: `layoutApply()`, },
            { type: "button", label: "Cancel", onclick: "$dialog.close()", },
        ]
    }
    if (!reportDate) return
    $dialog.make(layoutDialog)
    $dialog.show()
}

function layoutApply() {
    const { reportTitle, reportDate } = $dialog.data()
    $dialog.error()
    let errorFound = false
    if (reportTitle.trim() == "") {
        $dialog.error("Report title is absent")
        errorFound = true
    }
    if (reportDate.trim() == "") {
        $dialog.error("Report date is absent", false)
        errorFound = true
    }
    if (errorFound) return
    $p.setConfig({ reportTitle, reportDate })
    $dialog.close()
    reCreateCharts()
}
///////////////////////////////
function removeChart(chartID) {
    const key = getKey(chartID)
    const { title } = $p.getColProperties(key)

    const removeAlert = {
        elements: [
            { type: "p", label: `Are you sure to remove Chart: ${title}?` },
            { type: "button", label: "Keep", onclick: "$dialog.close()", },
            { type: "button", label: "Remove", onclick: `$dialog.close(); if ($p.removeCol(${key})) reCreateCharts()`, },
        ]
    }

    $dialog.make(removeAlert).show()

}
function cloneChart(chartID) {
    const key = getKey(chartID)
    if ($p.cloneCol(key)) reCreateCharts(chartID)

}
////////////////////////////////////////helpers

// function setElementValue(dialog, selector, value) {
//     const element = dialog.querySelector(selector)
//     element.value = value
// }

// function getElementValue(dialog, selector) {
//     const element = dialog.querySelector(selector)
//     return element.value
// }

// function isValidArray(arrayValue, typeToCheck, maxValue, noDuplicates) {
//     function isValidType(value) {
//         if (typeToCheck = "integer") return Number.isInteger(value)
//         if (typeToCheck = "number") return !Number.isNaN(value)
//         if (maxValue) return value <= maxValue
//         return true

//     }
//     if (!Array.isArray(arrayValue)) return false

//     let entriesValid = true

//     arrayValue.forEach(v => { if (!isValidType) entriesValid = false })

//     if (!entriesValid) return false

//     if (noDuplicates) {
//         for (const i = 0; i < arrayValue.length; i++) {
//             for (const j = i; j < arrayValue.length; j++) {
//                 if (arrayValue[i] == arrayValue[j]) entriesValid = false
//             }

//         }
//     }
//     return entriesValid
// }

// function createOptions(div, label, optionId, optionValues, initialValue) {

//     div.innerHTML = ""

//     const labelEl = document.createElement('label')
//     labelEl.textContent = label
//     labelEl.setAttribute("for", optionId)

//     const selectEl = document.createElement('select')
//     selectEl.setAttribute("id", optionId)

//     optionValues.forEach(v => {
//         const option = document.createElement('option')
//         option.textContent = v
//         selectEl.appendChild(option)
//     })
//     if (initialValue) selectEl.value = initialValue
//     div.appendChild(labelEl)
//     div.appendChild(selectEl)

// }
///////////////////////////////////////////////////////////////// paste config

function loadConfigDialog() {
    const dialog = {
        elements: [
            { type: "maintitle", cssclass: "maas-very-light", label: `Load configuration` },
            {
                type: "p",
                label: "Paste the config JSON below:",
            },
            {
                type: "textarea",
                id: "configtext",
                //label: "Paste the JSON below: ",
                initialvalue: "",
                returnvalue: "configtext"
            },

            { type: 'hr' },
            { type: "button", label: "Cancel", onclick: "$dialog.close()", },
            { type: "button", label: "Apply", onclick: "loadConfig()", },
        ]
    }
    $dialog.make(dialog)
    $dialog.show()
}

function loadConfig() {
    $dialog.error()
    const { configtext } = $dialog.data()
    let newConfig
    try {
        newConfig = JSON.parse(configtext);
    } catch (e) {
        $dialog.error("The string is not valid JSON")
        return
    }
    //set the config
    $p.setNewConfig(configtext)
    $dialog.close()
    reCreateCharts()
}

//////////////////////////////////////////////////////////////////// config dialog
// const autoTitleMessage = " Set title automatically"
// const autoTitle = [{}]
// autoTitle[0][autoTitleMessage] = true
const CONFIG_DIALOG_HEADER = [
    { type: "div", cssclass: "maas-background", label: "TBC" },
    { type: "group", label: "Basic config items" },
    { type: "input text", id: "charttitle", label: "Chart title: ", initialvalue: "TBC", returnvalue: "title" },
    { type: "check", label: "Auto title: ", initialvalue: "TBC", returnvalue: "autoTitle" },
    { type: "select", label: "Chart size: ", initialvalue: "TBC", selectvalues: ["Small", "Medium", "Large"], returnvalue: "chartSize" },
    { type: "input number", label: "Chart position ", initialvalue: "TBC" + 1, min: 1, max: "TBC", returnvalue: "position" },
    { type: "select", label: "Chart type: ", initialvalue: "TBC", onchange: "showDialogOptions()", selectvalues: "TBC", returnvalue: "type" },
    { type: "ungroup" },
    { type: "overlay" },
]
const CONFIG_DIALOG_BUTTONS = [
    { type: 'hr' },
    { type: "button", label: "Cancel", onclick: "$dialog.close()", },
    { type: "button", label: "Apply", onclick: "TBC", },
]
function configChart(chartID) {
    const key = getKey(chartID)

    const { type, title, chartSize, titleWOIndex, colname, autoTitle } = $p.getColProperties(key)

    CONFIG_DIALOG_HEADER[0].label = `${title}. Config chart`
    CONFIG_DIALOG_HEADER[2].initialvalue = titleWOIndex
    CONFIG_DIALOG_HEADER[3].initialvalue = autoTitle ?? true
    CONFIG_DIALOG_HEADER[4].chartSize = chartSize
    CONFIG_DIALOG_HEADER[5].initialvalue = Number(key) + 1
    CONFIG_DIALOG_HEADER[5].max = $p.getNoOfCharts()
    CONFIG_DIALOG_HEADER[6].initialvalue = type
    CONFIG_DIALOG_HEADER[6].selectvalues = $p.getChartTypes()

    CONFIG_DIALOG_BUTTONS[2].onclick = `configChartApply("${chartID}")`

    const configDialog = {
        elements: [
            { type: "maintitle", cssclass: "maas-very-light", label: `Config chart` },
            // {
            //     type: "p",
            //     label: "Input data column header: " + colname,
            //     returnvalue: "col"
            // },
            // { type: "group", label: "Group 1" },
            {
                type: "input text",
                id: "charttitle",
                label: "Chart title: ",
                initialvalue: titleWOIndex,
                returnvalue: "title"
            },
            {
                type: "check",
                label: "Auto title: ",
                initialvalue: autoTitle ?? true,
                returnvalue: "autoTitle"
            },
            {
                type: "select",
                label: "Chart size: ",
                initialvalue: chartSize,
                selectvalues: ["Small", "Medium", "Large"],
                returnvalue: "chartSize"
            },
            {
                type: "input number",
                label: "Chart position ",
                initialvalue: Number(key) + 1,
                min: 1,
                max: $p.getNoOfCharts(),
                returnvalue: "position"
            },
            {
                type: "select",
                label: "Chart type: ",
                initialvalue: type,
                onchange: "showDialogOptions()",
                selectvalues: $p.getChartTypes(),
                returnvalue: "type"
            },
            // { type: "ungroup" },
            { type: "overlay" },
            { type: 'hr' },
            { type: "button", label: "Cancel", onclick: "$dialog.close()", },
            { type: "button", label: "Apply", onclick: `configChartApply("${chartID}")`, },
        ]
    }

    $dialog.make(configDialog).position(chartID)
    // $dialog.make({ elements: [...CONFIG_DIALOG_HEADER, ...CONFIG_DIALOG_BUTTONS] })
    showDialogOptions(key)
    $dialog.show()
}

function setConfigOptions(key) {

}

function showDialogOptions(key) {
    const dataSource = key ? $p.getColProperties(key) : $dialog.data()

    function showCountType() {
        const { countType } = dataSource
        const countOverlay = {
            type: "select",
            //cssclass: "w3-light-grey",
            label: "Count type: ",
            initialvalue: countType ? countType : "Count",
            onchange: "showDialogOptions()",
            selectvalues: ['Count', 'Sum', 'Average'],
            returnvalue: "countType"
        }

        if (countType && countType != "Count") {
            const { colOver } = dataSource
            return [
                countOverlay,
                {
                    type: "select",
                    //cssclass: "w3-light-grey",
                    label: "Column over: ",
                    initialvalue: colOver ?? "",
                    selectvalues: columns,
                    returnvalue: "colOver"
                }
            ]
        }
        return [countOverlay]
    }
    const { type } = dataSource
    const columns = $p.getConfig().colNames

    if (type == "Note") {
        const { message } = dataSource
        $dialog.overlay([
            {
                type: "p",
                label: "Type the message below:",
            },
            {
                type: "textarea",
                //label: "From col: ",
                initialvalue: message || "",
                returnvalue: "message"
            }])
        return
    }
    if (type == "List") {
        const { separator, colname } = dataSource
        $dialog.overlay([
            {
                type: "select",
                initialvalue: colname,
                selectvalues: columns,
                label: "Column header: ",
                returnvalue: "colname"
            },
            {
                type: "input text",
                label: "Tag seprator:  ",
                initialvalue: separator ?? ",",

                returnvalue: "separator"
            }])
        return
    }
    if (type == "State Change") {
        const { fromCol, toCol, timestampCol, stateChangeCountType } = dataSource

        $dialog.overlay([
            {
                type: "select",
                //cssclass: "w3-light-grey",
                label: "Count type: ",
                initialvalue: stateChangeCountType ?? "Count of Transitions",
                onchange: "showDialogOptions()",
                selectvalues: ['Count of Transitions', 'Sum of Transition Duration', 'Average of Transition Duration'],
                returnvalue: "stateChangeCountType"
            },
            {
                type: "select",
                label: "From col: ",
                initialvalue: fromCol || "",
                selectvalues: columns,
                returnvalue: "fromCol"
            },
            {
                type: "select",
                label: "To col: ",
                initialvalue: toCol || "",
                selectvalues: columns,
                returnvalue: "toCol"
            },
            {
                group: "Plan",
                type: "select",
                label: "Timestamp col: ",
                initialvalue: timestampCol || "",
                selectvalues: columns,
                returnvalue: "timestampCol"
            },])
        return
    }
    if (type == "Data Table") {
        const { maxEntries } = dataSource
        $dialog.overlay([{
            type: "input number",
            label: "Number of rows to display: ",
            initialvalue: maxEntries ?? 10,
            max: 100,
            min: 1,
            returnvalue: "maxEntries"
        }])
        return
    }
    if (type == "Plan") {
        const { descriptionCol, startDateCol, endDateCol } = dataSource
        $dialog.overlay([{
            type: "select",
            label: "Description col: ",
            initialvalue: descriptionCol || "",
            selectvalues: columns,
            returnvalue: "descriptionCol"
        },
        {
            type: "select",
            label: "Start date col: ",
            initialvalue: startDateCol || "",
            selectvalues: columns,
            returnvalue: "startDateCol"
        },
        {
            group: "Plan",
            type: "select",
            label: "End date col: ",
            initialvalue: endDateCol || "",
            selectvalues: columns,
            returnvalue: "endDateCol"
        },])
        return
    }
    if (type == "Trend") {
        const { trendStartDate, forecastDays, forecastBasis, forecastFactors, plan, dateCol, countCol, countValues } = dataSource
        const { reportDate } = $p.getConfig()
        $dialog.overlay([
            {
                type: "select",
                label: "Date column: ",
                initialvalue: dateCol,
                selectvalues: ["", ...columns],
                returnvalue: "dateCol"
            },
            {
                type: "input text",
                label: "Count if values: ",
                initialvalue: countValues,
                returnvalue: "countValues"
            },
            {
                type: "select",
                label: "Count if column: ",
                initialvalue: countCol,
                selectvalues: ["", ...columns],
                returnvalue: "countCol"
            },
            {
                type: "input date",
                label: "Start trend from: ",
                initialvalue: trendStartDate ?? addDays(reportDate, -28),
                selectvalues: columns,
                returnvalue: "trendStartDate"
            },
            {
                type: "input number",
                label: "Forecast based on past days: ",
                initialvalue: forecastBasis ?? 14,
                min: 0,
                max: 8 * 7,
                returnvalue: "forecastBasis"
            },
            {
                type: "input number",
                label: "Forecast in days: ",
                initialvalue: forecastDays ?? 28,
                min: 0,
                max: 120 * 4 * 7,
                returnvalue: "forecastDays"
            },
            {
                type: "input",
                label: "Forecast factors: ",
                initialvalue: forecastFactors ?? "",
                returnvalue: "forecastFactors"
            },
            {
                type: "input",
                label: "Plan: ",
                initialvalue: plan ?? "",
                returnvalue: "plan"
            }
        ])

        return
    }
    if (type == "Trend OC") {
        const { trendStartDate, openDateCol, closeDateCol, forecastDays, forecastBasis, forecastFactors } = dataSource
        const { reportDate } = $p.getConfig()
        $dialog.overlay([{
            type: "select",
            label: "Open date col: ",
            initialvalue: openDateCol || "",
            selectvalues: columns,
            returnvalue: "openDateCol"
        },
        {
            type: "select",
            label: "Close date col: ",
            initialvalue: closeDateCol || "",
            selectvalues: columns,
            returnvalue: "closeDateCol"
        },
        {
            type: "input date",
            label: "Start trend from: ",
            initialvalue: trendStartDate ?? addDays(reportDate, -28),
            selectvalues: columns,
            returnvalue: "trendStartDate"
        },
        {
            type: "input number",
            label: "Forecast based on past days: ",
            initialvalue: forecastBasis ?? 14,
            min: 0,
            max: 8 * 7,
            returnvalue: "forecastBasis"
        },
        {
            type: "input number",
            label: "Forecast in days: ",
            initialvalue: forecastDays ?? 28,
            min: 0,
            max: 120 * 4 * 7,
            returnvalue: "forecastDays"
        },
        {
            type: "input",
            label: "Forecast factors: ",
            initialvalue: forecastFactors ?? "",
            returnvalue: "forecastFactors"
        }
        ])

        return
    }
    if (type == "Risk") {
        const { likelihoodCol, likelihoodValues, impactCol, impactValues } = dataSource

        $dialog.overlay([
            ...showCountType(),
            {
                type: "select",
                label: "Likelihood col: ",
                initialvalue: likelihoodCol ? likelihoodCol : "",
                selectvalues: columns,
                returnvalue: "likelihoodCol"
            },
            {
                type: "input text",
                label: "Likelihood values: ",
                initialvalue: likelihoodValues ? likelihoodValues : "Rare, Unlikely, Likely, Very Likely, Most Likely",
                returnvalue: "likelihoodValues"
            },
            {
                type: "select",
                label: "Impact col: ",
                initialvalue: impactCol ? impactCol : "",
                selectvalues: columns,
                returnvalue: "impactCol"
            },
            {
                type: "input text",
                label: "Impact values: ",
                initialvalue: impactValues ? impactValues : "Very Low, Low, Medium, High, Very High",
                returnvalue: "impactValues"
            },])
        return
    }
    if (type == "2X2") {
        const { xCol, yCol } = dataSource
        $dialog.overlay([
            ...showCountType(),
            {
                type: "select",
                label: "X col: ",
                initialvalue: xCol ? xCol : "",
                selectvalues: columns,
                returnvalue: "xCol"
            },
            {
                type: "select",
                label: "Y col: ",
                initialvalue: yCol ? yCol : "",
                selectvalues: columns,
                returnvalue: "yCol"
            },])
        return
    }
    if (type == "String") {
        const { order, colname } = dataSource
        $dialog.overlay([
            {
                type: "select",
                initialvalue: colname,
                selectvalues: columns,
                label: "Column header: ",
                returnvalue: "colname"
            },
            ...showCountType(),
            {
                type: "input text",
                label: "Order: ",
                initialvalue: order ? order : "",
                selectvalues: columns,
                returnvalue: "order"
            },
        ])
        return
    }
    if (type == "Number") {
        const { bin, colname } = dataSource
        $dialog.overlay([
            {
                type: "select",
                initialvalue: colname,
                selectvalues: columns,
                label: "Column header: ",
                returnvalue: "colname"
            },
            {
                type: "input text",
                label: "Bin values: ",
                initialvalue: bin ? bin.join(", ") : "",
                selectvalues: columns,
                returnvalue: "bin"
            },
        ])
        return
    }
    if (type == "Date") {
        const { dateFormat, colname } = dataSource
        const dateFormats = $p.getDateFormats()
        $dialog.overlay([
            {
                type: "select",
                initialvalue: colname,
                selectvalues: columns,
                label: "Column header: ",
                returnvalue: "colname"
            },
            ...showCountType(),
            {
                type: "select",
                label: "Date formats: ",
                initialvalue: dateFormat ?? "MMM",
                selectvalues: dateFormats,
                returnvalue: "dateFormat"
            },
        ])
        return
    }
    console.assert(true, `charttype ${type} not covered in dialog`)
}

function configChartApply(chartID) {
    const titlePrefix = (countType, colOver) => {
        if (countType == "Count") return "Count"
        if (countType == "Sum") return `Sum of ${colOver}`
        return `Av ${colOver}`
    }
    $dialog.error()
    const key = getKey(chartID)
    const { type, title, autoTitle, chartSize, position } = $dialog.data()
    const newCol = { type, title, countType: "Count", chartSize, position, autoTitle }
    //const setAutoTitle = autoTitle//[0][autoTitleMessage]

    if (type == "Note") {
        const { message } = $dialog.data()
        if (!message) {
            $dialog.error('message is blank')
            return
        }
        if (message.trim() == "") {
            $dialog.error('message is blank')
            return
        }
        $dialog.close()
        newCol.message = message.trim()
        if (autoTitle) {
            newCol.title = "NOTE"
        }
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "State Change") {
        const { fromCol, toCol, timestampCol, stateChangeCountType } = $dialog.data()
        let errorFound = false
        if (fromCol == toCol) {
            $dialog.error('From and To columns same')
            errorFound = true
        }
        if (fromCol == timestampCol) {
            $dialog.error('From and Timestamp columns same', false)
            errorFound = true
        }
        if (toCol == timestampCol) {
            $dialog.error('To and Timestamp columns same', false)
            errorFound = true
        }
        if (errorFound) return

        $dialog.close()
        Object.assign(newCol, { stateChangeCountType, toCol, fromCol, timestampCol })
        // newCol.stateChangeCountType = stateChangeCountType
        // newCol.toCol = toCol
        // newCol.fromCol = fromCol
        // newCol.timestampCol = timestampCol
        if (autoTitle) {
            newCol.title = stateChangeCountType
        }
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }

    if (type == "Data Table") {
        const { maxEntries } = $dialog.data()
        if (autoTitle) {
            newCol.title = "DATA TABLE"
        }
        $dialog.close()
        newCol.maxEntries = maxEntries
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Plan") {
        const { descriptionCol, startDateCol, endDateCol } = $dialog.data()
        if (startDateCol == endDateCol) {
            $dialog.error("Start and end date cols same")
            return
        }
        Object.assign(newCol, { descriptionCol, startDateCol, endDateCol, /* colname: startDateCol */ })
        // newCol.descriptionCol = descriptionCol
        // newCol.startDateCol = startDateCol
        // newCol.colname = startDateCol
        // newCol.endDateCol = endDateCol

        if (autoTitle) {
            newCol.title = "Plan"
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "List") {
        const { separator, colname } = $dialog.data()

        Object.assign(newCol, { colname, separator })

        if (autoTitle) {
            //const { colname } = $p.getColProperties(key)
            newCol.title = `Count by ${colname}`.toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Trend") {
        const { trendStartDate, forecastDays, forecastBasis, forecastFactors, plan, dateCol, countCol, countValues } = $dialog.data()
        const { reportDate } = $p.getConfig()
        let errorFound = false
        $dialog.error()
        if (dateCol == "") {
            $dialog.error("date column not selected")
            errorFound = true
        }
        if (countValues.trim() != "") {
            if (countCol == "") {
                $dialog.error("Count column not selected", false)
                errorFound = true
            }
        }
        if (plan.trim() != "") {
            const { isValid, error } = parseInput(plan, PLAN_GRAMMAR)

            if (!isValid) {
                $dialog.error(`Plan invalid: ${error}`, false)
                errorFound = true
            }
        }

        if (trendStartDate > reportDate) {
            $dialog.error("Start of trend after report date", false)
            errorFound = true
        }
        if (forecastFactors.trim() != "") {
            const { isValid, error } = parseInput(forecastFactors, TREND_FORECAST_GRAMMAR)//parseDateOpenClose(forecastFactors)
            if (!isValid) {
                $dialog.error(`Forecast factor invalid: ${error}`, false)//errors.forEach(v => $dialog.error(v, false))
                errorFound = true
            }
        }
        if (errorFound) return

        Object.assign(newCol, {
            plan, dateCol, countCol, countValues: countValues.trim(),
            trendStartDate,
            forecastDays: Number(forecastDays), forecastBasis: Number(forecastBasis),
            forecastFactors: forecastFactors.trim()
        })
        // newCol.trendStartDate = trendStartDate
        // newCol.forecastDays = Number(forecastDays)
        // newCol.forecastBasis = Number(forecastBasis)
        // newCol.forecastFactors = forecastFactors.trim()

        if (autoTitle) {
            if (newCol.countValues == "")
                newCol.title = `TREND (${dateCol.toUpperCase()})`
            else
                newCol.title = `TREND (${countCol.toUpperCase()} OVER ${dateCol.toUpperCase()})`
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Trend OC") {
        const { trendStartDate, openDateCol, closeDateCol, forecastDays, forecastBasis, forecastFactors } = $dialog.data()
        const { reportDate } = $p.getConfig()
        let errorFound = false
        $dialog.error()
        if (trendStartDate > reportDate) {
            $dialog.error("Start of trend after report date")
            errorFound = true
        }
    }
    if (forecastFactors.trim() != "") {

        const { isValid, error } = parseInput(forecastFactors, TRENDOC_FORECAST_GRAMMAR)
        if (!isValid) {
            $dialog.error(`Forecast factor invalid: ${error}`, false)
            errorFound = true
        }
        if (errorFound) return

        Object.assign(newCol, {
            trendStartDate, openDateCol, closeDateCol,
            forecastDays: Number(forecastDays), forecastBasis: Number(forecastBasis),
            forecastFactors: forecastFactors.trim()
        })

        if (autoTitle) {
            newCol.title = "Trend using open/close dates".toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "String") {
        const { countType, colOver, order, colname } = $dialog.data()

        Object.assign(newCol, { countType, colOver, colname })
        newCol.order = []
        if (order.trim() != "") {
            const orderArray = order.split(",")
            orderArray.forEach(v => { newCol.order.push(v.trim()) })
        }

        $dialog.close()
        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${colname}`.toUpperCase()
        }

        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Number") {
        let msg
        function checkandconvertbins(binArray) {
            for (let i = 0; i <= binArray.length - 1; i++) {
                if (isNaN(binArray[i])) {
                    msg = `Bin values not numeric; position(${i})`
                    break
                }
                binArray[i] = Number(binArray[i])

                if ((i > 0) && (binArray[i]) <= (binArray[i - 1])) {
                    msg = `Bin values not in increasing order; position(${i})`
                    break
                }
            }//)
        }
        const { bin, colname } = $dialog.data()
        if (bin.trim() == "")
            newCol.bin = undefined
        else {
            const binArray = bin.split(",")
            checkandconvertbins(binArray)
            if (msg) {
                $dialog.error(msg, false)
                return
            }
            newCol.bin = binArray
        }
        newCol.colname = colname
        if (autoTitle) {
            newCol.title = newCol.bin ? `Binned count by ${colname}` : `Count by ${colname}`.toLowerCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Risk") {
        const { countType, colOver, impactCol, impactValues, likelihoodCol, likelihoodValues } = $dialog.data()
        let errorFound = false
        if (impactCol == likelihoodCol) {
            $dialog.error("Impact and likelihood cols same")
            errorFound = true
        }
        const impactValuesArray = impactValues.split(",")
        impactValuesArray.forEach((v, i) => { impactValuesArray[i] = v.trim() })

        if (impactValuesArray.length != 5) {
            $dialog.error("Number of impact values not five", false)
            errorFound = true
        }
        const likelihoodValuesArray = likelihoodValues.split(",")
        likelihoodValuesArray.forEach((v, i) => { likelihoodValuesArray[i] = v.trim() })
        if (likelihoodValuesArray.length != 5) {
            $dialog.error("Number of likelihood values not five", false)
            errorFound = true
        }
        if (errorFound) return
        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by Risk`.toLocaleUpperCase()
        }

        Object.assign(newCol, {
            countType, colOver,
            impactCol, impactValues: impactValuesArray,
            likelihoodCol, likelihoodValues: likelihoodValuesArray,
        })

        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "2X2") {
        const { countType, colOver, xCol, yCol } = $dialog.data()
        let errorFound = false
        if (xCol == yCol) {
            $dialog.error("X and Y cols same")
            errorFound = true
        }
        if (errorFound) return
        Object.assign(newCol, {
            countType, colOver,
            xCol, yCol,
        })
        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${xCol} and ${yCol}`.toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }

    if (type == "String") {
        const { countType, colOver, colname } = $dialog.data()
        Object.assign(newCol, { countType, colOver, colname })

        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${colname}`.toLocaleUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Date") {
        const { countType, colOver, dateFormat, colname } = $dialog.data()
        Object.assign(newCol, { countType, colOver, dateFormat, colname })

        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${colname}`.toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }

    console.assert(true, `charttype ${type} not covered in dialog`)
}

async function reCreateCharts(scrollToChartID) {
    clearCounts()
    destroyAllCharts()
    const { file } = $p.getConfig()
    await countNow(file, undefined, false, "Keep Config")
    const elementToScroll = document.getElementById(scrollToChartID)
    if (elementToScroll) elementToScroll.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
}
/////////////////////////////////////////////////////////////////////// filter dialog

function filterChart(chartID) {

    const key = getKey(chartID)
    const chartCategories = getApexChartCategories(chartID)
    const allCounts = getCounts()
    const theCount = allCounts[key]
    let filteredValues = []
    chartCategories.forEach(v => {
        const o = {}
        o[v] = theCount[v] ? theCount[v].include : 'disable'
        filteredValues.push(o)
    })
    const { title } = $p.getColProperties(key)
    const filterDialog = {
        elements: [
            { type: "maintitle", cssclass: "maas-very-light", label: `Filter items` },
            {
                type: "check",
                //cssclass: "w3-check",
                initialvalue: filteredValues,
                returnvalue: "filteredValues"

            },
            { type: 'hr' },
            { type: "button", label: "Cancel", onclick: "$dialog.close()", },
            { type: "button", label: "Apply", onclick: `closeFilterDialog("${chartID}")`, },
        ]
    }
    // $dialog.make(filterDialog).position(chartID).show()
    $dialog.make(filterDialog).show()
}

async function closeFilterDialog(chartID) {
    const { filteredValues } = $dialog.data()
    const key = getKey(chartID)
    const allCounts = getCounts()
    const theCount = allCounts[key]


    let someValueChecked = false

    filteredValues.forEach(v => {
        const label = Object.keys(v)[0]
        if (theCount[label]) {
            theCount[label].include = v[label]
            if (v[label]) someValueChecked = true
        }
    })

    if (someValueChecked) {
        $dialog.close()
        const { file } = $p.getConfig()//document.querySelector('#file').files;
        await countNow(file, allCounts)
    }
    else {
        $dialog.error(["At least one value must be selected"])
        return
    }
}

const $dialog = (function () {
    'use strict'
    const specials = { type: 1, label: 1, initialvalue: 1, returnvalue: 1, id: 1, }
    //onchange, onclick, style as {width: "300px"}
    let $ = {};// public object - returned at end of module
    let dialog, idcounter, error, overlay, alertButtonPressed
    let groupDivId = ""
    let defaultAttrs = {
        dialog: { class: "w3-container w3-padding", },
        input: { class: "w3-light-grey w3-border", },
        select: { class: "w3-light-grey", },
        button: { class: "maas-button-light" }//"w3-button w3-border w3-margin"
    }
    let defaultscssclass = {
        DIALOG: "w3-container w3-padding",
        INPUT: "w3-light-grey w3-border",
        SELECT: "w3-light-grey",
        BUTTON: "maas-button-light"//"w3-button w3-border w3-margin"
    }
    function isSpecial(attr) {
        return specials[attr] ? true : false
    }
    function setAttrs(e, param) {
        if (!e) return

        function setStyles(styles) {
            if (!styles) return
            if (typeof styles !== "Object") return
            for (const [styleType, stylevalue] in Object.entries(styles))
                e.styles[styleType] = stylevalue
        }
        function setDefaults() {
            const tagname = e.tagName.toLowerCase()
            const defaulAtt = defaultAttrs[tagname]
            if (defaulAtt) {
                const classvalue = defaulAtt.class
                if (classvalue) e.setAttribute("class", classvalue)
            }
            const styles = defaultAttrs.style
            setStyles(styles)
        }
        function overrideDefaults() {
            for (const [attr, attrvalue] in Object.entries(param))
                if (attr == "style")
                    setStyles(attrvalue)
                else
                    if (!isSpecial(attr)) e.setAttribute(param[attr], param[attrvalue])
        }
        setDefaults()
        overrideDefaults()
        return e
    }
    function setCSS(e, cssclass) {
        if (!e) return

        if (cssclass) {
            e.setAttribute("class", cssclass)
            return e
        }

        const defaultcss = defaultscssclass[e.tagName]
        if (defaultcss) {
            e.setAttribute("class", defaultcss)
            return e
        }
        return e
    }

    function createElemnt(param) {
        const { type, id, cssclass, group, label, onclick, onchange, selectvalues, initialvalue, returnvalue, min, max } = param

        function setCommonAttributes(e, forElement) {
            if (min) e.min = min
            if (max) e.max = max
            if (returnvalue) e.setAttribute("returnvalue", returnvalue)
            if (initialvalue) e.value = initialvalue
            const idToUse = id ?? idcounter++
            e.setAttribute("id", idToUse)
            //e.setAttribute("for", idcounter)
            setCSS(e, cssclass) //if (cssclass) input.setAttribute("class", cssclass)
            if (onchange) e.setAttribute("onchange", onchange)
            if (onclick) e.setAttribute("onclick", onclick)
            if (forElement) forElement.setAttribute("for", idToUse)
        }
        if (!type) return
        if (type == "maintitle") {
            if (!label) return
            const div = document.createElement('div')
            div.style.fontWeight = 'bold'
            setCSS(div, cssclass)
            // div.innerHTML = `${label}<span style="float:right; cursor:pointer;" onclick="$dialog.close()">&#10006;</span>`
            div.textContent = label
            return div
        }
        if (type == "group") {
            if (!label) return
            const div = document.createElement('div')
            const l = document.createElement("label")
            l.style.fontWeight = 'bold'
            l.textContent = label
            groupDivId = "group-" + idcounter++
            l.setAttribute("onclick", `$dialog.togglegroup("${groupDivId}")`)
            const group = document.createElement('div')
            group.setAttribute("id", groupDivId)
            group.style.display = "none"
            div.appendChild(l)
            div.appendChild(group)
            return div

        }
        if (type == "ungroup") {
            groupDivId = ""
            return

        }
        if (type.substring(0, 5) == "input") {
            const div = document.createElement('div')
            if (group) div.setAttribute("group", group)
            const l = document.createElement("label")
            l.style.fontWeight = 'bold'
            l.textContent = label


            const input = document.createElement("input")
            const inputType = type.replace("input ", "")
            input.type = inputType
            setCommonAttributes(input, l)
            div.appendChild(l)
            div.appendChild(input)
            return div
        }
        if (type == "check") {
            function setupchecks() {
                initialvalue.forEach(v => {
                    const key = Object.keys(v)[0]
                    const l = document.createElement("label")
                    l.textContent = key
                    const input = document.createElement("input")
                    input.type = "checkbox"
                    setCSS(input, cssclass)
                    if (v[key] == "disable")
                        input.setAttribute("disabled", true)
                    else if (v[key]) input.setAttribute("checked", "checked")
                    div.appendChild(input)
                    div.appendChild(l)
                    const br = document.createElement('br')
                    div.appendChild(br)
                })
                if (returnvalue) div.setAttribute("returnvalue", returnvalue)
            }
            function setuponecheck() {
                const input = document.createElement("input")
                input.type = "checkbox"
                setCSS(input, cssclass)
                if (Boolean(initialvalue)) input.setAttribute("checked", "checked")
                if (returnvalue) input.setAttribute("returnvalue", returnvalue)
                const l = document.createElement("label")
                l.style.fontWeight = 'bold'
                l.textContent = label
                setCommonAttributes(input, l)
                div.appendChild(l)
                div.appendChild(input)
            }
            //if (!initialvalue) return
            const div = document.createElement('div')
            if (Array.isArray(initialvalue))
                setupchecks()
            else {
                setuponecheck()
            }
            return div
        }
        if (type == "overlay") {
            overlay = document.createElement('div')
            return overlay
        }

        if (type == "select") {
            if (!selectvalues) return
            const div = document.createElement('div')
            if (group) div.setAttribute("group", group)
            const e = document.createElement("label")
            e.style.fontWeight = 'bold'
            e.textContent = label


            const select = document.createElement("select")

            selectvalues.forEach(v => {
                const o = document.createElement("option")
                o.setAttribute("value", v)
                o.textContent = v
                select.appendChild(o)
            })
            setCommonAttributes(select, e)
            div.appendChild(e)
            div.appendChild(select)
            return div
        }

        const e = document.createElement(type)
        setCommonAttributes(e)
        e.textContent = label
        return e
    }
    $.togglegroup = function (id) {
        const group = document.getElementById(id)
        if (group.style.display === "block") {
            group.style.display = "none";
        } else {
            group.style.display = "block";
        }
    }
    $.error = function (message, startNew = true) {
        if (!dialog) return
        if (startNew) {
            error.innerHTML = ""
        }
        if (!message) return

        if (Array.isArray(message)) {
            message.forEach(m => {
                const p = document.createElement('p')
                p.textContent = m
                error.appendChild(p)
            })
        }
        else {
            const p = document.createElement('p')
            p.textContent = message
            error.appendChild(p)
        }
    }
    function getcss() {

    }
    $.overlay = function (elements) {
        if (!dialog) return
        overlay.innerHTML = ""
        elements.forEach(e => {
            const overlayElement = createElemnt(e)
            overlayElement.style.paddingBottom = "10px" //do we really need this fudge?
            overlay.appendChild(overlayElement)
        });
        return this
    }
    $.setDefault = function (param) {
        if (!param) return
        defaultscssclass = param
    }
    $.make = function (params) {
        if (dialog) this.close()

        dialog = document.createElement('dialog')
        this.width("")
        const body = document.querySelector('body')
        body.insertBefore(dialog, body.firstChild)
        setCSS(dialog, params.cssclass)
        error = createElemnt({ type: "div", cssclass: "w3-text-red" })
        dialog.appendChild(error)

        idcounter = 0
        params.elements.forEach(e => {
            const groupExists = groupDivId != ""
            const newE = createElemnt(e)
            if (!newE) return
            if (groupExists) {

                const group = document.getElementById(groupDivId)
                group.appendChild(newE)
                return
            }
            dialog.appendChild(newE)
        });
        return this
    }
    $.show = function (modal = true) {
        if (!dialog) return
        if (dialog.open) dialog.close()
        if (modal)
            dialog.showModal()
        else
            dialog.show()
        return this
    }

    $.close = function () {
        if (!dialog) return
        dialog.close()
        dialog.innerHTML = ""
        dialog.remove()
        error.remove()
    }

    $.data = function () {
        let data = {}
        const returnvalues = dialog.querySelectorAll("[returnvalue]")
        for (let i = 0; i < returnvalues.length; i++) {
            const e = returnvalues[i]
            const key = e.getAttribute("returnvalue")
            if (e.tagName == "INPUT" && e.type == "checkbox") {
                data[key] = e.checked
                continue
            }
            if (e.tagName == "DIV") {
                let chckedArray = []
                const inputs = e.querySelectorAll('input')
                const labels = e.querySelectorAll('label')

                for (let i = 0; i < inputs.length; i++) {
                    const o = {}
                    o[labels[i].textContent] = inputs[i].checked
                    chckedArray.push(o)
                }
                data[key] = chckedArray
                continue
            }
            data[key] = e.value
        }
        return data
    }

    $.alert = function (message, buttons) {
        const alertDialog = {
            elements: [
                { type: "div", cssclass: "maas-background", label: `Alert` },
                {
                    type: "p",
                    label: typeof message == "string" ? message : "?"
                },
                { type: 'hr' },
            ]
        }

        let buttoncount = 0
        if (Array.isArray(buttons))
            buttons.forEach(button => {
                if (typeof button == "string") {
                    buttoncount++
                    alertDialog.elements.push({ type: "button", label: button, onclick: `$dialog.alertResponse("${button}")` })
                }
            })
        if (buttoncount == 0)
            alertDialog.elements.push({ type: "button", label: "Close", onclick: `$dialog.alertResponse("Close")` })

        alertButtonPressed = ""
        this.make(alertDialog)
        this.show()

        return new Promise(function (resolve, reject) {
            dialog.addEventListener("close", (event) => {
                resolve(alertButtonPressed)
            });
        })
    }
    $.alertResponse = function (response) {
        alertButtonPressed = response
        this.close()
    }
    $.width = function (w) {
        if (!dialog) return
        dialog.style.width = w ? w : ""
        return dialog
    }
    $.position = function (divId) {
        //return dialog
        if (!dialog) return
        this.width("300px")
        return dialog

        const div = document.getElementById(divId)
        if (!div) return dialog
        const { right, left, top, bottom, width } = div.getBoundingClientRect()

        // const top = div.getBoundingClientRect().top
        console.log({ left, top, width })
        dialog.style.position = "absolute"
        dialog.style.top = div.offsetTop + "px" //top + "px"
        dialog.style.left = (left + window.scrollX) + "px" //left + "px"
        dialog.style.width = div.offsetWidth + "px"//(right - left) + "px"
        console.log(dialog.style.left, dialog.style.top, dialog.style.width)
        // dialog.style.left = div.offsetLeft //+ "px"
        // console.log({ left: div.style.left, top: div.offsetTop, dtop: dialog.style.top, dleft: dialog.style.left})
        //dialog.style.zorder = 0
        return dialog
    }
    return $; // expose externally
}());


function parseInput(inputstring, grammar) {
    function tokenize(inputstring) {
        function isDelim(char) {
            const delims = " ()"
            return delims.indexOf(char) != -1
        }
        let ptr = -1, token = ""
        const tokens = []
        while (ptr < inputstring.length - 1) {
            ptr++
            //token = tokens[ptr].trim()
            const char = inputstring[ptr].toUpperCase()
            if (isDelim(char)) {
                if (token != "") tokens.push(token)
                if (char != " ") tokens.push(char)
                token = ""
            }
            else {
                token += char
            }
        }
        if (token != "") tokens.push(token)
        return tokens
    }
    // phrase = {keyword: type} or {keyword: [type, defaultValue]} // type = number | string | array | date
    // phrase = {must: ["x","y"]} i.e. must have a x oy y in input
    // grammar = [ phrase1, phase2, ...]
    const output = {}
    const tokens = tokenize(inputstring)
    let error = ''
    function evalPhrase(keyword, type, defaultValue) {

        const tokenFound = tokens.findIndex(token => token == keyword.trim().toUpperCase())
        if (tokenFound == -1) {
            output[keyword] = defaultValue
            return
        }

        tokens[tokenFound] = ""
        const valueToken = tokens[tokenFound + 1]

        if (!valueToken) {
            error = `No data after ${keyword}`
            return
        }
        tokens[tokenFound + 1] = ""
        const typeupper = type.toUpperCase()

        if (typeupper == "NUMBER") {

            if (isNaN(valueToken)) {
                error = `Not number after ${keyword}; token=${valueToken}`
                return
            }
            output[keyword] = Number(valueToken)
            return
        }
        if (typeupper == "DATE") {

            if (!isValidDate(valueToken)) {
                error = `Not date after ${keyword}; (token=${valueToken})`
                return
            }
            output[keyword] = formatDate(valueToken, "YYYY-MM-DD")
            return
        }
        if (typeupper == "STRING") {
            output[keyword] = valueToken
            return
        }
        if (typeupper == "ARRAY" || typeupper == "ARRAYNUM") {
            if (valueToken != "(") {
                error = `Not open bracket after ${keyword}`
                return
            }
            const inputArray = []
            for (let i = tokenFound + 2; i < tokens.length; i++) {
                const token = tokens[i]
                tokens[i] = ""
                if (token != ")") {
                    if (typeupper == "ARRAYNUM") {
                        if (isNaN(token)) {
                            error = `Not number in array for ${keyword}; token=${token}`
                            return
                        }
                        inputArray.push(Number(token))
                    }
                    else
                        inputArray.push(token)
                }

                if (token == ")") {
                    output[keyword] = inputArray
                    return
                }
            }
            error = `No close bracket for ${keyword}`
            // }
        }
    }
    grammar.forEach(phrase => {
        console.assert(Object.keys(phrase).length == 1, `Too many keys in phrase ${phrase}`)
        const keyword = Object.keys(phrase)[0]
        const type = phrase[keyword]
        if (Array.isArray(type)) {
            console.assert(type.length == 2, `Too many keys in type ${type}`)
            evalPhrase(keyword, type[0], type[1])
        }
        else
            evalPhrase(keyword, type)

        if (error == "" && output[keyword] === undefined) {
            error = `No data for ${keyword}`
            return
        }
    })
    if (error != "") return { isValid: false, error }
    const remainingTokenIndex = tokens.findIndex(v => v != "")
    if (remainingTokenIndex != -1) {
        error = `Extra tken found: ${tokens[remainingTokenIndex]}`
        return { isValid: false, error }
    }

    return { isValid: true, output }
}

const PLAN_GRAMMAR = [{ start: "date" }, { end: "date" }, { scopefrom: ["Number", 0] }, { scopeto: "Number" }, { points: "arraynum" }]
const TREND_FORECAST_GRAMMAR = [{ from: "date" }, { count: "Number" }]
const TRENDOC_FORECAST_GRAMMAR = [{ from: "date" }, { open: ["Number", 1] }, { close: ["Number", 1] }]

function maketemplate(grammar) {
    let template = ""
    grammar.forEach(phrase => {
        console.assert(Object.keys(phrase).length == 1, `Too many keys in phrase ${phrase}`)
        const keyword = Object.keys(phrase)[0]
        template += keyword + " "
        const type = phrase[keyword]
        if (Array.isArray(type)) {
            console.assert(type.length == 2, `Too many keys in type ${type}`)
            template += "<" + type[0] + "> "
        }
        else
            template += "<" + type + "> "
    })
    return template
}

function test_parseInput() {
    function displayResult(input, grammar, valid) {
        const { isValid, error, output } = parseInput(input, grammar)
        const result = isValid == valid
        if (isValid)
            console.log({ result, isValid, output })
        else
            console.log({ result, isValid, error })

        tests++
        result ? pass++ : fail++

    }
    let tests = 0, pass = 0, fail = 0
    //PLAN_GRAMMAR////////////////////////////////////////
    let input = "start 21-Apr-23 end 12-Nov-23 scopeto 300 points (0 1)"
    displayResult(input, PLAN_GRAMMAR, true)
    input = " end 12-Nov-23 scopeto 300 points (0 .2 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, true)
    input = " end 12-Nov-23 scopeto 300 scopefrom 10 points (0 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, true)

    input = " xxx end 12-Nov-23 scopeto 300 scopefrom 10 points (0 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    input = " end 12-Nov-23 scopeto 300 scopefrom 10 points (0 x 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    input = "start 21-Apr-23 end 12-Nov-23x scopeto 300 points (0 1)"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " scopeto 300 points (0 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " end 12-Nov-23 scopeto 30x0 scopefrom 10 points (0 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " xxx end 12-Nov-23 scopeto 30x0 scopefrom 10 points (0 1) start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    //TRENDOC_FORECAST_GRAMMAR/////////////////////////////////
    input = "from 21-Apr-23 open 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)
    input = "from 21-Apr-23 close 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)
    input = "from 21-Apr-23"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)

    input = "from 21-Apr-23 open"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)
    input = " 21-Apr-23 open 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)
    input = "from 21-xApr-23 open"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)

    //TREND_FORECAST_GRAMMAR/////////////////////////////////
    input = "from 21-Apr-23 count 2"
    displayResult(input, TREND_FORECAST_GRAMMAR, true)
    input = "count 3.2 from 21-Apr-23"
    displayResult(input, TREND_FORECAST_GRAMMAR, true)

    input = "from 21-Apr-23 count 2x"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)
    input = " 21-Apr-23 count 2"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)
    input = "from 21-xApr-23 open"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)

    return { tests, pass, fail }

}
