"use strict"
//import Dialog, common, Counter, Param
const subheading = (label) => [{ tag: "hr" }, { tag: "h3", label: label }]
const chartDescription = Counter.getChartDescription()

function getChartTypes() {
    return Object.keys(chartDescription)
        .filter((v) => chartDescription[v].isChart)
        .sort()
}
function getDateFormats() {
    return chartDescription.dateFormats
}
function cannotFilter(chartType) {
    if (!chartType) return false
    if (!chartDescription[chartType]) return false
    return chartDescription[chartType].cannotFilter
}
function showChartMenus(chartID) {
    const button = (l, f) => {
        return {
            tag: "button",
            label: l,
            onclick: `Dialog.close();${f}("${chartID}")`,
        }
    }
    const elements = [
        button("Filter Chart", "filterChart"),
        { tag: "br" },
        button("Config Chart", "configChart"),
        { tag: "br" },
        button("Remove Chart", "removeChart"),
        { tag: "br" },
        button("Clone Chart", "cloneChart"),
        { tag: "br" },
        button("Add callout", "addCallout"),
        { tag: "br" },
        { tag: "button", label: "Close", onclick: "Dialog.close()" },
    ]
    const key = getKey(chartID)
    const { chartType } = Param.getChartProps(key)
    if (cannotFilter(chartType)) elements[0].disabled = true
    Dialog.make(elements, { className: "small" }).show()
}

/////////////////////////////////////////////////////////////layout dialog
function showLayoutDialog() {
    const { reportTitle, reportDate } = Param.getConfig()
    const layoutDialog = [
        {
            tag: "legend",
            label: `Config main title & report date`,
        },
        {
            tag: "textarea",
            name: "reportTitle",
        },
        {
            tag: "input",
            type: "date",
            name: "reportDate",
        },
        { tag: "hr" },
        {
            tag: "button",
            label: "Apply",
            onclick: `layoutApply()`,
        },
        {
            tag: "button",
            label: "Cancel",
            onclick: "Dialog.close()",
        },
    ]

    if (!reportDate) return
    Dialog.make(layoutDialog).show()
}

function layoutApply() {
    const { reportTitle, reportDate } = Dialog.data()
    Dialog.error()
    if (reportTitle.trim() == "") {
        Dialog.error("Required", "reportTitle")
    }
    if (reportDate.trim() == "") {
        Dialog.error("Required", "reportDate")
    }
    if (Dialog.hasErrors) return
    const config = Param.getConfig()
    config.reportTitle = reportTitle.trim()
    config.reportDate = reportDate
    Param.setConfig(config)
    Dialog.close()
    reCreateCharts()
}
///////////////////////////////
async function removeChart(chartID) {
    const key = getKey(chartID)
    const { chartTitle } = Param.getChartProps(key)

    const calloutProperties = Param.getConfig().callOuts
    if (calloutProperties) {
        const callOutsWithSameKey = calloutProperties
            .map((v, i) => ({ chartNumber: v.chartNumber, position: i }))
            .filter((v) => v.chartNumber === key)
            .map((v) => Number(v.position) + 1)
        if (callOutsWithSameKey.length > 0) {
            const list =
                (callOutsWithSameKey.length === 1 ? " (" : "s (") +
                callOutsWithSameKey.join(", ") +
                ")"
            await Dialog.alert(
                `Remove dependent callout${list} before removing this chart`,
                ["Close"]
            )
            return
        }
    }

    const confirm = "Yes remove"
    const reply = await Dialog.alert(
        `Are you sure to remove chart: "${chartTitle}"?`,
        [confirm, "No keep"]
    )
    if (reply === confirm) if (Param.remove("chart", key)) reCreateCharts()
}
function cloneChart(chartID) {
    const key = getKey(chartID)
    if (Param.cloneChart(key)) reCreateCharts()
}

//////////////////////////////////////////////////////////////////// config dialog helpers
//// rules for validate:
/// return true if OK
/// return false in error
///update Dialog.error is error
function displayGrammarTemplate(e, grammar) {
    const template = getTemplate(grammar)
    if (e.value.trim() == "") e.value = template
}

const validateChartFilterGrammar = (input) => {
    if (!input) return true
    if (input.trim() === "") return true
    const output = parseGrammar(input.trim(), CHART_FILTER_GRAMMAR)
    if (typeof output === "object") return true

    Dialog.error(output, "chartFilter")
    return false
}
//////////////////////////////////////////////////////////////////// config dialog
function configChart(chartID) {
    const key = getKey(chartID)

    const { chartType, chartTitle, chartSize } = Param.getChartProps(key)

    const configDialog = [
        { tag: "h2", label: `Configure chart` },
        { tag: "hr" },
        {
            tag: "input",
            type: "number",
            // label: "Position",
            value: Number(key) + 1,
            min: 1,
            max: Param.getCountOf("chart"),
            name: "position",
        },
        {
            tag: "input",
            // label: "Chart title",
            value: chartTitle ?? "",
            placeHolder: Param.getAutoTitle(key),
            name: "chartTitle",
        },
        {
            tag: "select",
            // label: "Chart size",
            value: chartSize,
            options: ["Small", "Medium", "Large"],
            name: "chartSize",
        },

        {
            tag: "select",
            // label: "Chart type",
            value: chartType,
            options: getChartTypes(),
            name: "chartType",
        },
        { tag: "overlay" },
        { tag: "hr" },
        {
            tag: "button",
            label: "Cancel",
            onclick: "Dialog.close()",
        },
        {
            tag: "button",
            label: "Apply",
            "disable-on-error": true,
            onclick: `configChartApply("${chartID}")`,
        },
    ]
    Dialog.make(configDialog, { onchange: "showDialogOptions()" })

    showDialogOptions(key)
    Dialog.show()
}

function showDialogOptions(key) {
    const dataSource = key ? Param.getChartProps(key) : Dialog.data()
    const chartFilterElements = (chartFilter) => {
        return {
            tag: "textarea",
            placeholder: "Click for template",
            onclick: "displayGrammarTemplate(this, CHART_FILTER_GRAMMAR)",
            value: chartFilter ?? "",
            name: "chartFilter",
        }
    }

    const selectElement = (label, value, name, addSpace = false) => {
        return {
            tag: "select",
            label,
            value: value,
            options: addSpace ? ["", ...columns] : columns,
            name: name,
        }
    }

    function showCountType(types = ["Count", "Sum", "Average"]) {
        const { countType, colOver } = dataSource
        const countTypeToDisplay = types.includes(countType)
            ? countType
            : types[0]

        const options =
            countTypeToDisplay.substring(0, 5) == "Count" ? [] : columns

        return [
            {
                tag: "select",
                // label: "Count type",
                value: countTypeToDisplay,
                // onchange: "showDialogOptions()",
                options: types,
                name: "countType",
            },
            {
                tag: "select",
                label: "Column over",
                value: colOver ?? "",
                options: options,
                name: "colOver",
            },
        ]
    }
    function showDataType(
        { dataType, bin, order, dateFormat, separator },
        prefix
    ) {
        // const { dateFormat, order, bin } = dataSource
        const dateFormats = getDateFormats()
        if (dataType === "Date")
            return [
                {
                    tag: "select",
                    label: "Date formats",
                    value: dateFormat ?? "MMM",
                    options: dateFormats,
                    name: prefix + "dateFormat",
                },
            ]
        if (dataType === "Number")
            return [
                {
                    tag: "input",
                    label: "Bin values",
                    value: bin ?? "",
                    options: columns,
                    name: prefix + "bin",
                },
            ]
        if (dataType === "List" || dataType === "List Members")
            return [
                {
                    tag: "input",
                    label: "List separator",
                    value: separator ?? ",",
                    name: prefix + "separator",
                },
            ]
        return [
            {
                tag: "textarea",
                label: "Order",
                value: order ?? "",
                options: columns,
                name: prefix + "order",
            },
        ]
    }
    const { chartType } = dataSource
    const columns = Param.getConfig().columnNames
    Dialog.error()
    {
        const chartTile = Dialog.getElement("chartTitle")
        chartTile.placeholder = Param.getAutoTitle(dataSource)
    }

    if (chartType == "Note") {
        // const { message } = dataSource
        Dialog.overlay(
            [
                { tag: "hr" },
                {
                    tag: "textarea",
                    rows: 10,
                    // value: message || "",
                    name: "message",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }

    if (chartType == "Data Table") {
        const { maxEntries } = dataSource
        Dialog.overlay(
            [
                { tag: "hr" },
                {
                    tag: "input",
                    type: "number",
                    label: "Rows to display",
                    value: maxEntries ?? 10,
                    max: 100,
                    min: 1,
                    name: "maxEntries",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }
    if (chartType == "Data Description") {
        Dialog.overlay([])
        return
    }
    if (chartType == "Plan") {
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
        } = dataSource
        Dialog.overlay(
            [
                { tag: "hr" },
                selectElement(
                    "Description column",
                    descriptionCol,
                    "descriptionCol"
                ),
                ...subheading("First set of dates..."),
                selectElement(
                    "Start date column",
                    startDateCol,
                    "startDateCol"
                ),
                selectElement("End date column", endDateCol, "endDateCol"),
                {
                    tag: "input",
                    label: "Label",
                    // value: firstLabel,
                    name: "firstLabel",
                },
                ...subheading("Second set of dates..."),
                selectElement(
                    "Start date column",
                    secondStartDateCol,
                    "secondStartDateCol",
                    true
                ),
                selectElement(
                    "End date column",
                    secondEndDateCol,
                    "secondEndDateCol",
                    true
                ),
                {
                    tag: "input",
                    label: "Label",
                    // value: secondLabel,
                    name: "secondLabel",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...subheading("Others..."),
                selectElement("RAG column", RAGCol, "RAGCol", true),
                {
                    tag: "textarea",
                    // label: "Annotations",
                    // value: annotations,
                    name: "annotations",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }
    if (chartType == "Trend" || chartType == "Trend OC") {
        const {
            //common
            trendStartDate,
            forecast,
            plan,
            x_label,
            chartFilter,
            annotations,
            //trend
            x_column,
            //trend oc
            openDateCol,
            closeDateCol,
        } = dataSource
        const trendDates = () => {
            if (chartType === "Trend")
                return [selectElement("Date column", x_column, "x_column")]
            return [
                selectElement("Open date column", openDateCol, "openDateCol"),
                selectElement(
                    "Close date column",
                    closeDateCol,
                    "closeDateCol"
                ),
            ]
        }
        const { reportDate } = Param.getConfig()
        // future:
        // const xxx =
        //     [{
        //         type: "h3",
        //         label: "X axis...",
        //     },{
        //         name: "x_value",
        //         type: "text",
        //         label: "Label",
        //     },
        //     {
        //         name: "trendStartDate",
        //         type: "date",
        //         fallback: _addDays(reportDate, -28),
        //     },]

        Dialog.overlay(
            [
                ...subheading("X axis..."),
                ...trendDates(),
                {
                    tag: "input",
                    label: "Label",
                    name: "x_label",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...subheading("Others..."),
                {
                    tag: "input",
                    type: "date",
                    value: trendStartDate ?? _.addDays(reportDate, -28),
                    name: "trendStartDate",
                },
                {
                    tag: "textarea",
                    name: "annotations",
                },
                {
                    tag: "textarea",
                    placeholder: "Click for template",
                    onclick: "displayGrammarTemplate(this, TREND_GRAMMAR)",
                    name: "forecast",
                },
                {
                    tag: "textarea",
                    // label: "Plan",
                    placeholder: "Click for template",
                    onclick: "displayGrammarTemplate(this, PLAN_GRAMMAR)",
                    // value: plan ?? "",
                    name: "plan",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }
    if (
        chartType == "State Change" ||
        chartType == "Risk" ||
        chartType == "2X2"
    ) {
        const {
            //2X2
            x_column,
            x_label,
            x_labels,
            y_column,
            y_label,
            y_labels,
            countType,
            chartFilter,
            countLabels,
            //State Change
            timestampCol,
            idCol,
        } = dataSource
        const countTypeInDialog =
            chartType == "State Change"
                ? showCountType([
                      "Count of Transitions",
                      "Sum of Transition Duration",
                      "Average of Transition Duration",
                  ])
                : showCountType()
        Dialog.overlay(
            [
                { tag: "hr" },
                chartType == "State Change"
                    ? selectElement("Id column", idCol, "idCol")
                    : {},
                chartType == "State Change"
                    ? selectElement(
                          "Timestamp column",
                          timestampCol,
                          "timestampCol"
                      )
                    : {},
                ...subheading("X axis..."),
                selectElement("Column", x_column, "x_column"),
                {
                    tag: "input",
                    label: "Label",
                    value: x_label ?? x_column,
                    name: "x_label",
                },
                {
                    tag: "textarea",
                    label: "Labels",
                    // placeHolder: "Rare, Unlikely, Likely, Very Likely, Most Likely",
                    name: "x_labels",
                },
                ...subheading("Y axis..."),
                selectElement("Column", y_column, "y_column"),
                {
                    tag: "input",
                    label: "Label",
                    value: y_label ?? y_column,
                    name: "y_label",
                },
                {
                    tag: "textarea",
                    label: "Labels",
                    // placeHolder: "Very Low, Low, Medium, High, Very High",
                    name: "y_labels",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...countTypeInDialog,
                {
                    tag: "input",
                    // placeHolder: "VL,L,M.H,VH",
                    name: "countLabels",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }
    if (chartType == "Bar") {
        const {
            x_column,
            x_dataType,
            x_bin,
            x_order,
            x_dateFormat,
            x_separator,
            chartFilter,
        } = dataSource
        Dialog.overlay(
            [
                ...subheading("X axis..."),
                selectElement("Column", x_column, "x_column"),
                {
                    tag: "select",
                    label: "Data type",
                    value: x_dataType ?? "String",
                    options: [
                        "Date",
                        "String",
                        "Number",
                        "List",
                        "List Members",
                    ].sort(),
                    name: "x_dataType",
                },
                ...showDataType(
                    {
                        dataType: x_dataType,
                        bin: x_bin,
                        order: x_order,
                        dateFormat: x_dateFormat,
                        separator: x_separator,
                    },
                    "x_"
                ),
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...showCountType(),
            ],
            dataSource
        )
        validateConfig()
        return
    }
    Dialog.error(`Invalid value: ${chartType}`, "chartType")
}
const validateAnnotations = (annotations, dialog) => {
    if (annotations.trim() === "") return
    const annotationArray = annotations.split(",")

    const styles = ["th", "tv", "mh", "mv", "bh", "bv"]
    const msg = "Required triplets (date, label, style): " + styles.join(",")

    const error = () => {
        dialog.error(msg, "annotations")
        return false
    }

    if (annotationArray.length % 3 !== 0) return error()

    for (let i = 0; i < annotationArray.length; i += 3) {
        const date = annotationArray[i].trim()
        if (!_.isValidDate(date)) return error()

        if (!annotationArray[i + 1]) return error()

        const style = annotationArray[i + 2].trim().toLowerCase()

        if (!styles.includes(style)) return error()
    }
    return true
}

const checkStringType = () => {
    const { countType, colOver, chartFilter } = Dialog.data()

    validateChartFilterGrammar(chartFilter)

    if (Dialog.hasErrors) return

    Object.assign(newCol, { countType, colOver, chartFilter })
    const placeHolder = Param.getAutoTitle(newCol)
}
function validateConfig() {
    Dialog.error()
    const properties = Dialog.data()
    const { chartType } = Dialog.data()

    if (
        chartType == "Note" ||
        chartType == "Data Description" ||
        chartType == "Plan" ||
        chartType == "Data Table" ||
        chartType == "Trend" ||
        chartType == "Trend OC" ||
        chartType == "Risk" ||
        chartType == "State Change" ||
        chartType == "2X2" ||
        chartType == "Bar"
    ) {
        const { reportDate } = Param.getConfig()

        const { isValid, errors, warnings } = Counter.validateChart(
            chartType,
            properties,
            { reportDate }
        )
        if (warnings) for (const key in warnings) Dialog.error(errors[key], key)

        if (!isValid) for (const key in errors) Dialog.error(errors[key], key)
    } else Dialog.error(`Invalid value: ${chartType}`, "chartType")
}
function configChartApply(chartID) {
    const key = getKey(chartID)
    const properties = Dialog.data()
    validateConfig()
    if (Dialog.hasErrors) return
    Dialog.close()
    if (Param.setChartProps(key, properties)) reCreateCharts(key)
}

async function reCreateCharts(key) {
    const scrollY = window.scrollY
    clearCounts()
    destroyAllCharts()
    const { file } = Param.getConfig()
    await countNow()
    window.scroll(0, scrollY)
    scrollToChart(key)
    // if (key) {
    //     const chart = _.select("#" + getChartId(key))
    //     if (chart) {
    //         chart.scrollIntoView(false)
    //         return
    //     }
    // }
    // window.scroll(0, scrollY)
}
function scrollToChart(key) {
    if (!key) return
    const chart = _.select(`#${getChartContainer(key)}`)
    if (chart) chart.scrollIntoView(false)
}
/////////////////////////////////////////////////////////////////////// filter chart
function getChartCategories(key) {
    const allCounts = getCounts()
    return allCounts.data[key].data.map((v) => v.x)
}
function filterChart(chartID) {
    const key = getKey(chartID)
    const allCounts = getCounts()
    const chartCategories = getChartCategories(key)
    const oneCount = allCounts.counts[key]
    const filterTags = chartCategories.map((v) => ({
        tag: () => {
            const checked = oneCount[v]
                ? oneCount[v].include
                    ? "checked"
                    : ""
                : "disabled"
            return _.createElements(
                `<p>
                <input type="checkbox" id="${v}" name="${v}" ${checked} data-error="p">
                <label for="${v}">${v}</label>
                </p>`
            )
        },
    }))
    const filterDialog = [
        { tag: "h3", label: `Filter items` },
        { tag: "hr" },
        ...filterTags,
        { tag: "hr" },
        {
            tag: "button",
            label: "Cancel",
            onclick: "Dialog.close()",
        },
        {
            tag: "button",
            label: "Apply",
            "disable-on-error": true,
            onclick: `applyFilter("${chartID}")`,
        },
    ]

    Dialog.make(filterDialog, {
        onchange: "checkFilterDialog()",
        className: "small",
    }).show()
}
function checkFilterDialog() {
    const data = Dialog.data()
    Dialog.error()
    const someChecked = Object.keys(data).some((key) => data[key])
    if (someChecked) return
    const keys = Object.keys(data)
    Dialog.error("Required some checked", keys[keys.length - 1])
}
async function applyFilter(chartID) {
    checkFilterDialog()
    if (Dialog.hasErrors) return
    const key = getKey(chartID)
    const allCounts = getCounts()
    const oneCount = allCounts.counts[key]
    const data = Dialog.data()
    for (const key in data) {
        if (oneCount[key] !== undefined) {
            oneCount[key].include = data[key]
        }
    }
    Dialog.close()
    // const { file } = Param.getConfig()
    /* await */ countNow(allCounts)
}

// function autoChartTitle(key) {}
//////////////////////////////////////////////////////////////call out
function showCalloutMenu(key) {
    const button = (l, f) => {
        return {
            tag: "button",
            label: l,
            onclick: `Dialog.close();${f}("${key}")`,
        }
    }
    const elements = [
        button("Config callout", "showCalloutConfigDialog"),
        { tag: "br" },
        button("Remove callout", "removeCallout"),
        { tag: "br" },
        { tag: "button", label: "Close", onclick: "Dialog.close()" },
    ]
    Dialog.make(elements, { className: "small" }).show()
}
//////////////////////////////////////////////////////////////////// callout config

function showCalloutConfigDialog(key, addNew = false) {
    const { chartNumber, value, category, message } = addNew
        ? { chartNumber: key, value: "max" }
        : Param.getCallOutProps(key)

    // const { chartNumber, value, category, message } = Param.getCallOutProps(key)
    const calloutConfigDialog = [
        { tag: "h2", label: `Configure callout` },
        { tag: "hr" },
        addNew
            ? {}
            : {
                  tag: "input",
                  type: "number",
                  value: Number(key) + 1,
                  min: 1,
                  max: Param.getCountOf("callout"),
                  name: "position",
              },
        {
            tag: "input",
            type: "number",
            value: Number(chartNumber) + 1,
            min: 1,
            max: Param.getCountOf("chart"),
            name: "chartNumber",
        },
        { tag: "overlay" },
        {
            tag: "select",
            label: "Value",
            value: value,
            options: ["max", "min", "category"],
            name: "value",
        },
        {
            tag: "input",
            value: category,
            name: "category",
        },
        {
            tag: "input",
            value: message,
            name: "message",
        },
        { tag: "hr" },
        {
            tag: "button",
            label: "Cancel",
            onclick: "Dialog.close()",
        },
        {
            tag: "button",
            label: addNew ? "Add" : "Apply",
            onclick: `applyConfigCallout(${key})`,
        },
    ]

    Dialog.make(calloutConfigDialog, { onchange: "overlayCallout()" })
    Dialog.show()
    overlayCallout()
}
function overlayCallout() {
    const { chartNumber } = Dialog.data()
    const { chartType } = Param.getChartProps(chartNumber - 1)
    const overlayElements = [
        {
            tag: "p",
            label: `Chart type for the chart is: ${chartType}`,
        },
    ]
    Dialog.overlay(overlayElements, {})
    const value = Dialog.getElement("value").value
    const category = Dialog.getElement("category")
    category.disabled = value !== "category"
    const { errors } = validateCalloutConfig()
    if (errors) for (const key in errors) Dialog.error(errors[key], key)
}
function validateCalloutConfig() {
    Dialog.error()
    const properties = Dialog.data()
    const chartNumber = Dialog.getElement("chartNumber").value
    const { chartType } = Param.getChartProps(chartNumber - 1)
    const { errors, output } = Counter.validateCallout(
        chartType,
        properties,
        {}
    )
    if (errors) return { errors }
    if (output) Object.assign(properties, output)
    return { output: properties }
}
function applyConfigCallout(key) {
    const { output, errors } = validateCalloutConfig()

    if (errors) {
        for (const e in errors) Dialog.error(errors[e], e)
        return
    }

    const { chartNumber, position } = output
    output.chartNumber = Number(chartNumber) - 1
    Dialog.close()
    // const calloutPosition = Number(position) - 1
    console.log(output)
    if (Param.setCallOutProps(key, output)) reCreateCharts()
}
function getDefaultCalloutMessage({
    value,
    category,
    chartType,
    x_column,
    y_column,
}) {
    const cats = `${x_column} = ...` + y_column ? `, ${y_column} = ...` : ""

    return value === "max"
        ? "Maximum at " + cats
        : value === "min"
        ? "Minimum at " + cats
        : `Value for ... = ${category}`
}
//////////////////////////////////////////////////////////////////// callout remove
async function removeCallout(key) {
    const confirm = "Yes remove"
    const reply = await Dialog.alert("Are you sure to remove the callout?", [
        confirm,
        "No keep",
    ])
    if (reply === confirm) if (Param.remove("callout", key)) reCreateCharts()
}
function addCallout(chartId) {
    const key = getKey(chartId)
    showCalloutConfigDialog(key, true)
}
/* 

Strategy for error handling:

validate will return {errors, output}
on return 
    if (errors) then process errors
    else use output

function validateOuter(valueToValidate, {param1, param2...}) {
    const outputObject = {}
    const {errors, output} = validateInner(value)
    if (errors){
        handleError()
        return {errors}
    }
    outputObject.ObjectAssign(output)
    validate next...


    return {output: outputObject}
}

*/
