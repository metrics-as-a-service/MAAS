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
    $dialog.bettererror()
    let errorFound = false
    if (reportTitle.trim() == "") {
        $dialog.bettererror("Report title is absent", "reportTitle")
        errorFound = true
    }
    if (reportDate.trim() == "") {
        $dialog.bettererror("Report date is absent", "reportDate")
        errorFound = true
    }
    if ($dialog.hasErrors()) return

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
///////////////////////////////////////////////////////////////// paste config

function loadConfigDialog() {
    const dialog = {
        elements: [
            { type: "maintitle", cssclass: "maas-very-light", label: `Load configuration` },
            // {
            //     type: "p",
            //     label: "Paste the config JSON below:",
            // },
            {
                type: "textarea",
                label: "Paste the config JSON below:",
                //id: "configtext",
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
    $dialog.bettererror()
    const { configtext } = $dialog.data()
    let newConfig
    try {
        newConfig = JSON.parse(configtext)
    } catch (e) {
        $dialog.bettererror("The string is not valid JSON", "configtext")
        return
    }
    //set the config
    $p.setNewConfig(configtext)
    $dialog.close()
    reCreateCharts()
}

//////////////////////////////////////////////////////////////////// config dialog helpers
function displayGrammerTemplate(e, grammar) {
    const template = maketemplate(grammar)
    if (e.value.trim() == "") e.value = template
}

const validategrammer = (input, dialogvariable, grammar) => {

    if (input.trim() == "") return

    const { isValid, error } = parseInput(input.trim(), grammar)
    console.log({ isValid, error }, `'${input}'`)
    if (!isValid) $dialog.bettererror(`Count if is not valid (${error})`, dialogvariable)
}

//////////////////////////////////////////////////////////////////// config dialog
function configChart(chartID) {
    const key = getKey(chartID)

    const { type, title, chartSize, titleWOIndex, colname, autoTitle } = $p.getColProperties(key)

    const configDialog = {
        elements: [
            { type: "maintitle", cssclass: "maas-very-light", label: `Config chart` },
            {
                type: "accordian",
                label: `Common chart attributes`,
                elements: [

                    {
                        type: "input text",
                        // id: "charttitle",
                        label: "Chart title: ",
                        initialvalue: titleWOIndex,
                        returnvalue: "title"
                    },
                    {
                        type: "check",
                        label: "Auto title",
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
                ],
            },
            {
                type: "select",
                label: "Chart type: ",
                initialvalue: type,
                focus: true,
                onchange: "showDialogOptions()",
                selectvalues: $p.getChartTypes(),
                returnvalue: "type"
            },
            { type: "overlay" },
            { type: 'hr' },
            { type: "button", label: "Cancel", onclick: "$dialog.close()", },
            { type: "button", label: "Apply", onclick: `configChartApply("${chartID}")`, },
        ]
    }

    $dialog.make(configDialog).position(chartID)

    showDialogOptions(key)
    $dialog.show()
}

// function setConfigOptions(key) {

// }

function showDialogOptions(key) {
    const dataSource = key ? $p.getColProperties(key) : $dialog.data()
    const { colname } = dataSource
    function showCountType() {
        const { countType, colOver } = dataSource
        const countTypeModified = countType ? countType : "Count"

        const initialvalue = countTypeModified == "Count" ? "" : colOver ?? ""
        const diable = countTypeModified == "Count"
        const selectvalues = countTypeModified == "Count" ? [""] : columns //countType ? columns : [""]

        return [
            {
                type: "select",
                label: "Count type: ",
                initialvalue: countTypeModified,
                onchange: "showDialogOptions()",
                selectvalues: ['Count', 'Sum', 'Average'],
                returnvalue: "countType"
            },
            {
                type: "select",
                label: "Column over: ",
                initialvalue: initialvalue,
                disable: diable,
                selectvalues: selectvalues,
                returnvalue: "colOver"
            }
        ]
    }
    const { type } = dataSource
    const columns = $p.getConfig().colNames
    $dialog.bettererror()
    if (type == "Note") {
        const { message } = dataSource
        $dialog.overlay([
            {
                type: "textarea",
                label: "Message:",
                initialvalue: message || "",
                returnvalue: "message"
            }])
        return
    }
    if (type == "List Count" || type == "List Members") {
        const { separator, colname, countif } = dataSource
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
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
            },
        ])
        return
    }
    if (type == "State Change") {
        const { fromCol, toCol, timestampCol, stateChangeCountType, countif, idCol } = dataSource

        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            {
                type: "select",
                label: "Count type: ",
                initialvalue: stateChangeCountType ?? "Count of Transitions",
                onchange: "showDialogOptions()",
                selectvalues: ['Count of Transitions', 'Sum of Transition Duration', 'Average of Transition Duration'],
                returnvalue: "stateChangeCountType"
            },
            {
                type: "select",
                label: "Id col: ",
                initialvalue: idCol ?? colname,
                selectvalues: columns,
                returnvalue: "idCol"
            },
            {
                type: "select",
                label: "From col: ",
                initialvalue: fromCol ?? colname,
                selectvalues: columns,
                returnvalue: "fromCol"
            },
            {
                type: "select",
                label: "To col: ",
                initialvalue: toCol ?? colname,
                selectvalues: columns,
                returnvalue: "toCol"
            },
            {
                type: "select",
                label: "Timestamp col: ",
                initialvalue: timestampCol ?? colname,
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
    if (type == "Data Description") {
        $dialog.overlay([])
        return
    }
    if (type == "Plan") {
        const { descriptionCol, startDateCol, endDateCol, actualStartDateCol, actualEndDateCol, countif } = dataSource
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            {
                type: "select",
                label: "Description col: ",
                initialvalue: descriptionCol ?? colname,
                selectvalues: columns,
                returnvalue: "descriptionCol"
            },
            {
                type: "select",
                label: "Start date col: ",
                initialvalue: startDateCol ?? colname,
                selectvalues: columns,
                returnvalue: "startDateCol"
            },
            {
                type: "select",
                label: "End date col: ",
                initialvalue: endDateCol ?? colname,
                selectvalues: columns,
                returnvalue: "endDateCol"
            },
            {
                type: "select",
                label: "Actual start date col: ",
                initialvalue: actualStartDateCol ?? "",
                selectvalues: ["", ...columns],
                returnvalue: "actualStartDateCol"
            },
            {
                type: "select",
                label: "Actual/Estimaed end date col: ",
                initialvalue: actualEndDateCol ?? "",
                selectvalues: ["", ...columns],
                returnvalue: "actualEndDateCol"
            },
        ])
        return
    }
    if (type == "Trend") {
        const { trendStartDate, forecast, plan, dateCol, countif, } = dataSource
        const { reportDate } = $p.getConfig()
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            {
                type: "select",
                label: "Date column: ",
                initialvalue: dateCol ?? colname,
                selectvalues: columns,
                returnvalue: "dateCol"
            },
            {
                type: "input date",
                label: "Start trend from: ",
                initialvalue: trendStartDate ?? addDays(reportDate, -28),
                selectvalues: columns,
                returnvalue: "trendStartDate"
            },
            {
                type: "input text",
                label: "Forecast: ",
                initialvalue: forecast ?? "",
                onclick: "displayGrammerTemplate(this, TREND_FORECAST_GRAMMAR)",
                returnvalue: "forecast"
            },
            {
                type: "input text",
                label: "Plan: ",
                onclick: "displayGrammerTemplate(this, PLAN_GRAMMAR)",
                initialvalue: plan ?? "",
                returnvalue: "plan"
            }
        ])

        return
    }
    if (type == "Trend OC") {
        const { trendStartDate, openDateCol, closeDateCol, forecast, countif } = dataSource
        const { reportDate } = $p.getConfig()
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            {
                type: "select",
                label: "Open date col: ",
                initialvalue: openDateCol ?? colname,
                selectvalues: columns,
                returnvalue: "openDateCol"
            },
            {
                type: "select",
                label: "Close date col: ",
                initialvalue: closeDateCol ?? colname,
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
                type: "input text",
                label: "Forecast: ",
                initialvalue: forecast ?? "",
                onclick: "displayGrammerTemplate(this, TRENDOC_FORECAST_GRAMMAR)",
                returnvalue: "forecast"
            }
        ])

        return
    }
    if (type == "Risk") {
        const { likelihoodCol, likelihoodValues, impactCol, impactValues, countif } = dataSource

        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            ...showCountType(),
            {
                type: "select",
                label: "Likelihood col: ",
                initialvalue: likelihoodCol ?? colname,
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
                initialvalue: impactCol ?? colname,
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
        const { xCol, yCol, countif } = dataSource
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            ...showCountType(),
            {
                type: "select",
                label: "X col: ",
                initialvalue: xCol ?? colname,
                selectvalues: columns,
                returnvalue: "xCol"
            },
            {
                type: "select",
                label: "Y col: ",
                initialvalue: yCol ?? colname,
                selectvalues: columns,
                returnvalue: "yCol"
            },])
        return
    }
    if (type == "String") {
        const { order, colname, countif } = dataSource
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
            {
                type: "select",
                initialvalue: colname,
                selectvalues: columns,
                label: "Column header: ",
                returnvalue: "colname"
            },
            ...showCountType(),
            // {
            //     type: "select",
            //     initialvalue: orderby,
            //     selectvalues: ["X increasing", "X decreasing", "Y increasing", "Y decreasing"],
            //     label: "Order by: ",
            //     returnvalue: "orderby"
            // },
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
        const { bin, colname, countif } = dataSource
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
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
        const { dateFormat, colname, countif } = dataSource
        const dateFormats = $p.getDateFormats()
        $dialog.overlay([
            {
                type: "input text",
                label: "Count if: ",
                onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
                initialvalue: countif ?? "",
                returnvalue: "countif"
            },
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
    console.assert(false, `charttype ${type} not covered in dialog`)
}

function configChartApply(chartID) {
    const titlePrefix = (countType, colOver) => {
        if (countType == "Count") return "Count"
        if (countType == "Sum") return `Sum of ${colOver}`
        return `Av ${colOver}`
    }

    $dialog.bettererror()
    const key = getKey(chartID)
    const { type, title, autoTitle, chartSize, position } = $dialog.data()
    // const newCol = { type, title, countType: "Count", chartSize, position, autoTitle }
    const newCol = { type, title, chartSize, position, autoTitle }

    if (type == "Note") {
        const { message } = $dialog.data()

        if (message.trim() == "") {
            $dialog.bettererror('Message cannot be blank', "message")
        }
        if ($dialog.hasErrors()) return
        $dialog.close()
        newCol.message = message.trim()
        if (autoTitle) {
            newCol.title = "NOTE"
        }
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "State Change") {
        const { fromCol, toCol, timestampCol, stateChangeCountType, idCol } = $dialog.data()

        const errormessage = 'These columns cannot be same'
        const allerrors = {}
        const storeerror = (x, y) => { allerrors[x] = 1; allerrors[y] = 1 }

        if (idCol == fromCol) storeerror("idCol", "fromCol")
        if (idCol == toCol) storeerror("idCol", "toCol")
        if (idCol == timestampCol) storeerror("idCol", "timestampCol")
        if (fromCol == toCol) storeerror("fromCol", "toCol")
        if (fromCol == timestampCol) storeerror("fromCol", "timestampCol")
        if (toCol == timestampCol) storeerror("toCol", "timestampCol")
        for (const key in allerrors) $dialog.bettererror(errormessage, key)

        if ($dialog.hasErrors()) return

        $dialog.close()
        Object.assign(newCol, { stateChangeCountType, toCol, fromCol, timestampCol, idCol })

        if (autoTitle) {
            newCol.title = stateChangeCountType
        }
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }

    if (type == "Data Table") {
        const { maxEntries } = $dialog.data()
        if (autoTitle) {
            newCol.title = type.toUpperCase()
        }
        $dialog.close()
        newCol.maxEntries = maxEntries
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Data Description") {
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Plan") {
        const { descriptionCol, startDateCol, endDateCol, actualStartDateCol, actualEndDateCol, countif } = $dialog.data()

        const errormessage = 'These columns cannot be same'
        const allerrors = {}
        const storeerror = (x, y, msg) => { allerrors[x] = msg; allerrors[y] = msg }

        if (descriptionCol == startDateCol) storeerror("descriptionCol", "startDateCol", errormessage)
        if (descriptionCol == endDateCol) storeerror("descriptionCol", "endDateCol", errormessage)
        if (descriptionCol == actualStartDateCol) storeerror("descriptionCol", "actualStartDateCol", errormessage)
        if (descriptionCol == actualEndDateCol) storeerror("descriptionCol", "actualEndDateCol", errormessage)

        if (startDateCol == endDateCol) storeerror("startDateCol", "endDateCol", errormessage)
        if (startDateCol == actualStartDateCol) storeerror("startDateCol", "actualStartDateCol", errormessage)
        if (startDateCol == actualEndDateCol) storeerror("startDateCol", "actualEndDateCol", errormessage)

        if (endDateCol == actualStartDateCol) storeerror("endDateCol", "actualStartDateCol", errormessage)
        if (endDateCol == actualEndDateCol) storeerror("endDateCol", "actualEndDateCol", errormessage)

        if ((actualStartDateCol != "" && actualEndDateCol == "") ||
            (actualStartDateCol == "" && actualEndDateCol != "")) {
            storeerror("actualStartDateCol", "actualEndDateCol", "Both must be present or absent")
        }

        if (actualStartDateCol == actualEndDateCol) {
            if (actualStartDateCol != "")
                storeerror("actualStartDateCol", "actualEndDateCol", errormessage)
        }

        for (const key in allerrors) $dialog.bettererror(allerrors[key], key)

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)

        if ($dialog.hasErrors()) return

        Object.assign(newCol, { descriptionCol, startDateCol, endDateCol, actualStartDateCol, actualEndDateCol, countif })

        if (autoTitle) {
            newCol.title = "PLAN"
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "List Count" || type == "List Members") {
        const { separator, colname, countif } = $dialog.data()

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, { colname, separator, countif })

        if (autoTitle) {
            newCol.title = type == "List Count" ? `Count by ${colname}`.toUpperCase() : `Count of Members in ${colname}`.toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Trend") {
        const { trendStartDate, forecast, plan, dateCol, countif, } = $dialog.data()
        const { reportDate } = $p.getConfig()

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        validategrammer(plan, "plan", PLAN_GRAMMAR)

        if (trendStartDate > reportDate) {
            $dialog.bettererror("Start of trend must be before report date", "trendStartDate")
        }
        if (forecast.trim() != "") {
            const { isValid, error, output } = parseInput(forecast, TREND_FORECAST_GRAMMAR)//parseDateOpenClose(forecast)
            if (!isValid) {
                $dialog.bettererror(`Forecast invalid: ${error}`, "forecast")
            }
        }
        if ($dialog.hasErrors()) return

        Object.assign(newCol, {
            dateCol,
            countif,
            trendStartDate,
            forecast: forecast.trim(),
            plan,
        })

        if (autoTitle) {
            newCol.title = `TREND (${dateCol.toUpperCase()})`
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))

        return
    }
    if (type == "Trend OC") {
        const { trendStartDate, openDateCol, closeDateCol, forecast, countif } = $dialog.data()
        const { reportDate } = $p.getConfig()

        if (trendStartDate > reportDate) {
            $dialog.bettererror("Start of trend must be before report date", "trendStartDate")
        }

        if (forecast.trim() != "") {

            const { isValid, error } = parseInput(forecast, TRENDOC_FORECAST_GRAMMAR)
            if (!isValid) {
                $dialog.bettererror(`Forecast invalid: ${error}`, "trendStartDate")
            }
        }
        validategrammer(countif, "countif", COUNTIF_GRAMMAR)

        if ($dialog.hasErrors()) return

        Object.assign(newCol, {
            trendStartDate, openDateCol, closeDateCol, countif,
            forecast: forecast.trim()
        })

        if (autoTitle) {
            newCol.title = "Trend using open/close dates".toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "String") {
        const { countType, colOver, order, colname, countif } = $dialog.data()

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, { countType, colOver, colname, countif })
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
                    msg = `Bin values not numeric (position: ${i})`
                    break
                }
                binArray[i] = Number(binArray[i])

                if ((i > 0) && (binArray[i]) <= (binArray[i - 1])) {
                    msg = `Bin values not in increasing order (position: ${i})`
                    break
                }
            }//)
        }
        const { bin, colname, countif } = $dialog.data()
        if (bin.trim() == "")
            newCol.bin = undefined
        else {
            const binArray = bin.split(",")
            checkandconvertbins(binArray)
            if (msg) {
                $dialog.bettererror(msg, "bin")
            }
            newCol.bin = binArray
        }
        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, { colname, countif })
        if (autoTitle) {
            newCol.title = (newCol.bin ? `Binned count by ${colname}` : `Count by ${colname}`).toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Risk") {
        const { countType, colOver, impactCol, impactValues, likelihoodCol, likelihoodValues, countif } = $dialog.data()

        if (impactCol == likelihoodCol) {
            const errormessage = 'Impact and likelihood cols cannot be same'
            $dialog.bettererror(errormessage, "impactCol")
            $dialog.bettererror(errormessage, "likelihoodCol")
        }
        const impactValuesArray = impactValues.split(",")
        impactValuesArray.forEach((v, i) => { impactValuesArray[i] = v.trim() })

        if (impactValuesArray.length != 5) {
            $dialog.bettererror("Number of impact values must be five", "impactValues")
        }
        const likelihoodValuesArray = likelihoodValues.split(",")
        likelihoodValuesArray.forEach((v, i) => { likelihoodValuesArray[i] = v.trim() })
        if (likelihoodValuesArray.length != 5) {
            $dialog.bettererror("Number of likelihood values must be five", "likelihoodValues")
        }
        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by Risk`.toLocaleUpperCase()
        }

        Object.assign(newCol, {
            countType, colOver, countif,
            impactCol, impactValues: impactValuesArray,
            likelihoodCol, likelihoodValues: likelihoodValuesArray,
        })

        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "2X2") {
        const { countType, colOver, xCol, yCol, countif } = $dialog.data()

        if (xCol == yCol) {
            const errormessage = 'X and Y cols cannot be same"'
            $dialog.bettererror(errormessage, "xCol")
            $dialog.bettererror(errormessage, "yCol")
        }
        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, {
            countType, colOver, countif,
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
        const { countType, colOver, colname, countif } = $dialog.data()

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, { countType, colOver, colname, countif })


        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${colname}`.toLocaleUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }
    if (type == "Date") {
        const { countType, colOver, dateFormat, colname, countif } = $dialog.data()

        validategrammer(countif, "countif", COUNTIF_GRAMMAR)
        if ($dialog.hasErrors()) return

        Object.assign(newCol, { countType, colOver, dateFormat, colname, countif })

        if (autoTitle) {
            newCol.title = `${titlePrefix(countType, colOver)} by ${colname}`.toUpperCase()
        }
        $dialog.close()
        if ($p.setColProperties(key, newCol)) reCreateCharts(getChartId(key))
        return
    }

    console.assert(false, `Charttype "${type}" not covered in dialog`)
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
    if (!someValueChecked) {
        $dialog.bettererror("At least one value must be selected", "filteredValues")
        return
    }
    $dialog.close()
    const { file } = $p.getConfig()//document.querySelector('#file').files;
    await countNow(file, allCounts)
}

const $dialog = (function () {
    'use strict'
    const UPSPAN = `<span style="float: right;font-wigth:900">-</span>` //`<span style="float: right;">&#9651;</span>`
    const DOWNSPAN = `<span style="float: right;font-wigth:900">+</span>` //`<span style="float: right;">&#9661;</span>`
    const specials = { type: 1, label: 1, initialvalue: 1, returnvalue: 1, cssclass: 1, elements: 1, selectvalues: 1, focus: 1, disable: 1 }
    //onchange, onclick, style as {width: "300px"}
    const $ = {}// public object - returned at end of module
    let dialog, idcounter, /* error, */ overlay, alertButtonPressed

    let hasErrors = false
    // let groupDivId = ""
    let defaultAttrs = {
        dialog: { class: "w3-container w3-padding", },
        // input: { class: "w3-input maas-input", }, //input: { class: "w3-input w3-light-grey", },
        select: { class: "w3-select maas-input", }, //select: { class: "w3-select w3-light-grey", },
        button: { class: "w3-button maas-button-light" },
        textarea: { class: "w3-input maas-input", },
        "input check": { class: "w3-check maas-input", },
        "input text": { class: "w3-input maas-input", },
        "input number": { class: "w3-input maas-input", },
        "input date": { class: "w3-input maas-input", },
    }

    function isSpecial(attr) {
        return specials[attr] ? true : false
    }
    // function setAttrs(e, param) {
    //     if (!e) return

    //     function setStyles(styles) {
    //         if (!styles) return
    //         if (typeof styles !== "Object") return
    //         for (const [styleType, stylevalue] in Object.entries(styles))
    //             e.styles[styleType] = stylevalue
    //     }
    //     function setDefaults() {
    //         const tagname = e.tagName.toLowerCase()
    //         const defaulAtt = defaultAttrs[tagname]
    //         if (defaulAtt) {
    //             const classvalue = defaulAtt.class
    //             if (classvalue) e.setAttribute("class", classvalue)
    //         }
    //         const styles = defaultAttrs.style
    //         setStyles(styles)
    //     }
    //     function overrideDefaults() {
    //         for (const [attr, attrvalue] in Object.entries(param))
    //             if (attr == "style")
    //                 setStyles(attrvalue)
    //             else
    //                 if (!isSpecial(attr)) e.setAttribute(param[attr], param[attrvalue])
    //     }
    //     setDefaults()
    //     overrideDefaults()
    //     return e
    // }
    function setCSS(e, cssclass, type) {
        if (!e) return

        if (cssclass) {
            e.setAttribute("class", cssclass)
            return e
        }
        const tagname = e.tagName.toLowerCase()
        const deaultAttr = tagname == "input" ? defaultAttrs[type.toLowerCase()] : defaultAttrs[tagname]//defaultscssclass[e.tagName]
        if (deaultAttr) {
            const defaultclass = deaultAttr.class
            if (defaultclass) e.setAttribute("class", defaultclass)
            return e
        }
        return e
    }
    // function setCommonAttributes(e, param) {
    //     const { type, id, cssclass, /* group, */ label, onclick, onchange, selectvalues, initialvalue, returnvalue, min, max } = param
    //     if (min) e.min = min
    //     if (max) e.max = max
    //     if (returnvalue) e.setAttribute("returnvalue", returnvalue)
    //     if (initialvalue) e.value = initialvalue
    //     const idToUse = id ?? idcounter++
    //     e.setAttribute("id", idToUse)
    //     //e.setAttribute("for", idcounter)
    //     setCSS(e, cssclass) //if (cssclass) input.setAttribute("class", cssclass)
    //     if (onchange) e.setAttribute("onchange", onchange)
    //     if (onclick) e.setAttribute("onclick", onclick)
    //     // if (forElement) forElement.setAttribute("for", idToUse)
    // }
    function createElemnt(param) {
        const { type, /* id, */ cssclass, /* group, */ label, focus, /* onclick, onchange, */ selectvalues, initialvalue, returnvalue, /* min, max, */ disable } = param

        function setCommonAttributes(e) {
            if (focus) e.focus()
            if (disable) e.disabled = true
            if (returnvalue) e.setAttribute("returnvalue", returnvalue)
            if (initialvalue) e.value = initialvalue
            const idToUse = idcounter++ //id ?? idcounter++
            e.setAttribute("id", idToUse)

            setCSS(e, cssclass, type)

            for (const key in param) {
                if (!isSpecial(key)) {
                    try {
                        e.setAttribute(key, param[key])
                    }
                    catch (error) {
                        console.assert(false, "Invalid attribute Name in dialog spec")
                    }
                }
            }
            // if (min) e.min = min
            // if (max) e.max = max
            // if (onchange) e.setAttribute("onchange", onchange)
            // if (onclick) e.setAttribute("onclick", onclick)
            // if (forElement) forElement.setAttribute("for", idToUse)
        }
        function getlabel(label) {
            const l = document.createElement("label")
            setCSS(l)
            l.textContent = label
            return l
        }
        if (!type) return

        if (type == "maintitle") {
            if (!label) return
            const div = document.createElement('div')
            div.style.fontWeight = 'bold'
            setCommonAttributes(div)
            // div.innerHTML = `${label}<span style="float:right; cursor:pointer;" onclick="$dialog.close()">&#10006;</span>`
            div.textContent = label
            return div
        }

        if (type.substring(0, 5) == "input") {

            // const tempalte = document.querySelector("#input-template")
            // const div = tempalte.content.cloneNode(true)

            // div.querySelector("label").textContent = label

            // const input = div.querySelector("input")
            // const inputType = type.replace("input ", "")
            // input.type = inputType
            // setCommonAttributes(input)

            // return div

            const div = document.createElement('div')
            const l = getlabel(label)
            const input = document.createElement("input")
            const inputType = type.replace("input ", "")
            input.type = inputType
            setCommonAttributes(input)
            div.appendChild(l)
            div.appendChild(input)
            return div
        }

        if (type == "textarea") {
            const div = document.createElement('div')
            const l = getlabel(label)
            const input = document.createElement("textarea")
            setCommonAttributes(input)
            div.appendChild(l)
            div.appendChild(input)
            return div
        }
        if (type == "check") {
            function onecheckbox(label, checked, disabled) {
                const tempalte = document.querySelector("#checkbox-template")
                const checkentry = tempalte.content.cloneNode(true)

                const input = checkentry.querySelector("input")
                if (disabled) input.setAttribute("disabled", true)
                if (checked) input.setAttribute("checked", "checked")

                checkentry.querySelector("label").textContent = label

                return checkentry
            }
            function setupchecks() {
                initialvalue.forEach(v => {
                    const key = Object.keys(v)[0]
                    const disabled = v[key] == "disable"
                    const checked = v[key]
                    const checkentry = onecheckbox(key, checked, disabled)
                    div.appendChild(checkentry)

                    // const l = getlabel(key)
                    // const input = document.createElement("input")
                    // input.type = "checkbox"
                    // setCSS(input, cssclass, type)
                    // if (v[key] == "disable") input.setAttribute("disabled", true)
                    // if (v[key] == true) input.setAttribute("checked", "checked")
                    // div.appendChild(input)
                    // div.appendChild(l)
                    // const br = document.createElement('br')
                    // div.appendChild(br)
                })
                if (returnvalue) div.setAttribute("returnvalue", returnvalue)
            }
            function setuponecheck() {
                const checked = Boolean(initialvalue)
                const checkentry = onecheckbox(label, checked, false)
                if (returnvalue) {
                    const input = checkentry.querySelector("input")
                    input.setAttribute("returnvalue", returnvalue)
                }
                div.appendChild(checkentry)


                // const input = document.createElement("input")
                // input.type = "checkbox"
                // setCSS(input, cssclass, type)
                // if (Boolean(initialvalue)) input.setAttribute("checked", "checked")
                // if (returnvalue) input.setAttribute("returnvalue", returnvalue)
                // const l = getlabel(label)
                // div.appendChild(l)
                // div.appendChild(input)
                // const br = document.createElement('br')
                // div.appendChild(br)
            }
            //if (!initialvalue) return
            const div = document.createElement('div')
            if (Array.isArray(initialvalue))
                setupchecks()
            else {
                setuponecheck()
            }
            // const parent = document.createElement('div')
            // parent.appendChild(div)
            return div//parent
        }
        if (type == "overlay") {
            overlay = document.createElement('div')
            return overlay
        }

        if (type == "select") {
            if (!selectvalues) return
            const div = document.createElement('div')
            const l = getlabel(label)
            const select = document.createElement("select")
            selectvalues.forEach(v => {
                const o = document.createElement("option")
                o.setAttribute("value", v)
                o.textContent = v
                select.appendChild(o)
            })
            setCommonAttributes(select)
            div.appendChild(l)
            div.appendChild(select)
            return div
        }
        if (type == "accordian") {
            const div = document.createElement("div")
            const details = document.createElement("details")
            const summary = document.createElement("summary")
            summary.textContent = label
            details.appendChild(summary)
            // const wrapper = document.createElement("div")
            const { elements } = param
            elements.forEach(e => {
                const newE = createElemnt(e)
                if (!newE) return
                details.appendChild(newE)
            })
            // details.appendChild(wrapper)

            div.style.border = "1px solid var(--maas-color-info)"
            div.appendChild(details)

            return div


            // const accordian = document.createElement("div")
            // const button = document.createElement("button")
            // button.innerHTML = label + DOWNSPAN
            // setCommonAttributes(button)
            // button.style.width = "100%"
            // button.style.textAlign = "left"
            // button.setAttribute("onclick", "$dialog.toggleAccordian(this)")
            // accordian.appendChild(button)
            // const accordianmembers = document.createElement("div")
            // //ease open accodian
            // accordianmembers.style.overflow = "hidden"
            // accordianmembers.style.transition = "max-height 0.2s ease-out"
            // accordianmembers.style.maxHeight = 0

            // const { elements } = param
            // elements.forEach(e => {
            //     const newE = createElemnt(e)
            //     if (!newE) return
            //     accordianmembers.appendChild(newE)
            // })
            // accordian.appendChild(accordianmembers)
            // return accordian
        }
        const e = document.createElement(type)
        setCommonAttributes(e)
        e.textContent = label
        return e
    }

    $.hasErrors = function () { return hasErrors }

    $.bettererror = function (errormessage, erroritem) {
        if (!dialog) return

        const returnvalues = dialog.querySelectorAll("[returnvalue]")
        if (!errormessage) {
            for (let i = 0; i < returnvalues.length; i++) {
                const e = returnvalues[i]
                const parent = e.parentElement
                while (parent.lastChild.tagName == "MARK") parent.lastChild.remove()
            }
            hasErrors = false
            return this
        }

        if (erroritem) {
            for (let i = 0; i < returnvalues.length; i++) {
                const e = returnvalues[i]
                const key = e.getAttribute("returnvalue")
                if (key == erroritem) {
                    const parent = e.parentElement
                    const mark = document.createElement("mark")
                    mark.setAttribute('class', 'maas-dialog-error')
                    mark.textContent = errormessage + " "
                    parent.appendChild(mark)
                    hasErrors = true
                    return this
                }
            }
        }
    }
    // TO DO remove $.error...
    // $.error = function (message, startNew = true) {
    //     if (!dialog) return
    //     if (startNew) {
    //         error.innerHTML = ""
    //     }
    //     if (!message) {
    //         return
    //     }

    //     if (Array.isArray(message)) {
    //         message.forEach(m => {
    //             const p = document.createElement('p')
    //             p.textContent = m
    //             error.appendChild(p)
    //         })
    //     }
    //     else {
    //         const p = document.createElement('p')
    //         p.textContent = message
    //         error.appendChild(p)
    //     }
    // }
    // function getcss() {

    // }
    $.overlay = function (elements) {
        if (!dialog) return
        overlay.innerHTML = ""
        if (!elements) return
        elements.forEach(e => {
            const overlayElement = createElemnt(e)
            // overlayElement.style.paddingTop= "10px" //do we really need this fudge?
            overlay.appendChild(overlayElement)
        })
        return this
    }
    $.setDefault = function (param) {
        if (!param) return
        defaultscssclass = param
    }

    // $.toggleAccordian = function (e) {
    //     function addsymbol(status) {
    //         const newspan = status == "up" ? UPSPAN : DOWNSPAN
    //         const span = e.querySelector("span")
    //         if (span) span.remove()
    //         e.innerHTML = e.textContent + newspan
    //     }
    //     var accordian = e.nextElementSibling

    //     if (accordian.style.maxHeight != "0px") {
    //         accordian.style.maxHeight = "0px"
    //         addsymbol("down")
    //         return
    //     }
    //     accordian.style.maxHeight = accordian.scrollHeight + "px"
    //     addsymbol("up")
    // }

    $.make = function (params) {
        if (dialog) this.close()

        dialog = document.createElement('dialog')
        this.width("")
        const body = document.querySelector('body')
        body.insertBefore(dialog, body.firstChild)
        setCSS(dialog)
        // error = createElemnt({ type: "div", cssclass: "w3-text-red" })
        // dialog.appendChild(error)

        idcounter = 0
        params.elements.forEach(e => {
            const newE = createElemnt(e)
            if (!newE) return
            dialog.appendChild(newE)
        })
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
        // error.remove()
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
                    label: typeof message == "string" ? message : DISPLAY_INVALID
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
            })
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
        //TO DO position dialog better
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
    return $ // expose externally
}())

