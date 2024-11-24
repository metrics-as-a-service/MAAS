"use strict"
const subheading = (label) => [
    { component: "hr" },
    { component: "h3", label: label },
]
////////////////////////////////////////////////////////////main popup
// function showChartMenusNew(chartID) {
//     const click = (f) => `$dialog.close();` + (f ? `${f}("${chartID}")` : "")
//     const elements = {
//         button_filter: {
//             label: "Filter chart",
//             onclick: click("filterChart"),
//         },
//         br_1: {},
//         button_config: {
//             label: "Config chart",
//             onclick: click("configChart"),
//         },
//         br_2: {},
//         button_remove: {
//             label: "Remove chart",
//             onclick: click("removeChart"),
//         },
//         br_3: {},
//         button_clone: {
//             label: "Clone chart",
//             onclick: click("cloneChart"),
//         },
//         br_4: {},
//         button_close: { label: "Close", onclick: click() },
//     }
//     const key = getKey(chartID)
//     const { chartType } = $p.getChartProps(key)
//     const cannotFilter = $p.cannotFilter(chartType)
//     if (cannotFilter) elements.button_1.disabled = "disabled"
//     // $dialog.make({ elements }, "small").position(chartID)
//     // $dialog.show()
// }
function showChartMenus(chartID) {
    const button = (l, f) => {
        return {
            component: "button",
            label: l,
            onclick: `$dialog.close();${f}("${chartID}")`,
        }
    }
    const elements = [
        button("Filter Chart", "filterChart"),
        { component: "br" },
        button("Config Chart", "configChart"),
        { component: "br" },
        button("Remove Chart", "removeChart"),
        { component: "br" },
        button("Clone Chart", "cloneChart"),
        { component: "br" },
        button("Add callout", "addCallout"),
        { component: "br" },
        { component: "button", label: "Close", onclick: "$dialog.close()" },
    ]
    const key = getKey(chartID)
    const { chartType } = $p.getChartProps(key)
    const cannotFilter = $p.cannotFilter(chartType)
    if (cannotFilter) elements[0].disabled = true
    $dialog.make(elements, { width: "small" })
    $dialog.show()
}

/////////////////////////////////////////////////////////////layout dialog
function showLayoutDialog() {
    const { reportTitle, reportDate } = $p.getConfig()
    const layoutDialog = [
        {
            component: "legend",
            label: `Config main title & report date`,
        },
        {
            component: "textarea",
            // initialValue: reportTitle,
            returnvalue: "reportTitle",
        },
        {
            component: "input date",
            // initialValue: reportDate,
            returnvalue: "reportDate",
        },
        { component: "hr" },
        {
            component: "button",
            label: "Apply",
            onclick: `layoutApply()`,
        },
        {
            component: "button",
            label: "Cancel",
            onclick: "$dialog.close()",
        },
    ]

    if (!reportDate) return
    $dialog.make(layoutDialog, {})
    $dialog.show()
}

function layoutApply() {
    const { reportTitle, reportDate } = $dialog.data()
    $dialog.error()
    if (reportTitle.trim() == "") {
        $dialog.error("Required", "reportTitle")
    }
    if (reportDate.trim() == "") {
        $dialog.error("Required", "reportDate")
    }
    if ($dialog.hasErrors()) return

    $p.setConfig({ reportTitle, reportDate })
    $dialog.close()
    reCreateCharts()
}
///////////////////////////////
async function removeChart(chartID) {
    const key = getKey(chartID)
    const { chartTitle } = $p.getChartProps(key)

    const calloutProperties = $p.getConfig().callOuts
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
            await $dialog.alert(
                `Remove dependent callout${list} before removing this chart`,
                ["Close"]
            )
            return
        }
    }

    const confirm = "Yes remove"
    const reply = await $dialog.alert(
        `Are you sure to remove chart: "${chartTitle}"?`,
        [confirm, "No keep"]
    )
    if (reply === confirm) if ($p.removeChart(key)) reCreateCharts()
}
function cloneChart(chartID) {
    const key = getKey(chartID)
    if ($p.cloneChart(key)) reCreateCharts()
}

//////////////////////////////////////////////////////////////////// config dialog helpers
//// rules for validate:
/// return true if OK
/// return false in error
///update $dialog.error is error
function displayGrammarTemplate(e, grammar) {
    const template = getTemplate(grammar)
    if (e.value.trim() == "") e.value = template
}

function _isUndefinedString(v) {
    if (v === undefined) return true
    if (typeof v !== "string") return true
    if (v.trim() === "") return true
    return false
}

const validateChartFilterGrammar = (input) => {
    if (!input) return true
    if (input.trim() === "") return true
    const output = parseGrammar(input.trim(), CHART_FILTER_GRAMMAR)
    if (typeof output === "object") return true

    $dialog.error(output, "chartFilter")
    return false
}
//////////////////////////////////////////////////////////////////// config dialog
function configChart(chartID) {
    const key = getKey(chartID)

    const { chartType, chartTitle, chartSize } = $p.getChartProps(key)

    const configDialog = [
        { component: "h2", label: `Configure chart` },
        { component: "hr" },
        {
            component: "input number",
            label: "Position: ",
            initialValue: Number(key) + 1,
            min: 1,
            max: $p.getNoOfCharts(),
            returnvalue: "position",
        },
        {
            component: "input text",
            label: "Chart title: ",
            initialValue: chartTitle ?? "",
            placeHolder: $p.getAutoTitle(key),
            returnvalue: "chartTitle",
        },
        {
            component: "select",
            label: "Chart size: ",
            initialValue: chartSize,
            options: ["Small", "Medium", "Large"],
            returnvalue: "chartSize",
        },

        {
            component: "select",
            label: "Chart type: ",
            initialValue: chartType,
            options: $p.getChartTypes(),
            returnvalue: "chartType",
        },
        { component: "overlay" },
        { component: "hr" },
        {
            component: "button",
            label: "Cancel",
            onclick: "$dialog.close()",
        },
        {
            component: "button",
            label: "Apply",
            class: "disable-on-error",
            onclick: `configChartApply("${chartID}")`,
        },
    ]
    $dialog.make(configDialog, { onchange: "showDialogOptions()" })

    showDialogOptions(key)
    $dialog.show()
}

function showDialogOptions(key) {
    const dataSource = key ? $p.getChartProps(key) : $dialog.data()
    const chartFilterElements = (chartFilter) => {
        return {
            component: "textarea",
            // label: "Chart filter: ",
            placeholder: "Click for template",
            onclick: "displayGrammarTemplate(this, CHART_FILTER_GRAMMAR)",
            initialValue: chartFilter ?? "",
            returnvalue: "chartFilter",
        }
    }

    const selectElement = (
        label,
        initialValue,
        returnvalue,
        addSpace = false
    ) => {
        return {
            component: "select",
            label,
            initialValue: initialValue,
            options: addSpace ? ["", ...columns] : columns,
            returnvalue: returnvalue,
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
                component: "select",
                // label: "Count type: ",
                initialValue: countTypeToDisplay,
                // onchange: "showDialogOptions()",
                options: types,
                returnvalue: "countType",
            },
            {
                component: "select",
                label: "Column over: ",
                initialValue: colOver ?? "",
                options: options,
                returnvalue: "colOver",
            },
        ]
    }
    function showDataType(
        { dataType, bin, order, dateFormat, separator },
        prefix
    ) {
        // const { dateFormat, order, bin } = dataSource
        const dateFormats = $p.getDateFormats()
        if (dataType === "Date")
            return [
                {
                    component: "select",
                    label: "Date formats: ",
                    initialValue: dateFormat ?? "MMM",
                    options: dateFormats,
                    returnvalue: prefix + "dateFormat",
                },
            ]
        if (dataType === "Number")
            return [
                {
                    component: "input text",
                    label: "Bin values: ",
                    initialValue: bin ?? "",
                    options: columns,
                    returnvalue: prefix + "bin",
                },
            ]
        if (dataType === "List" || dataType === "List Members")
            return [
                {
                    component: "input text",
                    label: "List separator: ",
                    initialValue: separator ?? ",",
                    returnvalue: prefix + "separator",
                },
            ]
        return [
            {
                component: "textarea",
                label: "Order: ",
                initialValue: order ?? "",
                options: columns,
                returnvalue: prefix + "order",
            },
        ]
    }
    const { chartType } = dataSource
    const columns = $p.getConfig().columnNames
    $dialog.error()
    {
        const chartTile = $dialog.getElement("chartTitle")
        chartTile.placeholder = $p.getAutoTitle(dataSource)
    }

    if (chartType == "Note") {
        // const { message } = dataSource
        $dialog.overlay(
            [
                { component: "hr" },
                { component: "p", label: "Message:" },
                {
                    component: "textarea",
                    label: "",
                    rows: 10,
                    // initialValue: message || "",
                    returnvalue: "message",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }

    if (chartType == "Data Table") {
        const { maxEntries } = dataSource
        $dialog.overlay(
            [
                { component: "hr" },
                {
                    component: "input number",
                    label: "Rows to display: ",
                    initialValue: maxEntries ?? 10,
                    max: 100,
                    min: 1,
                    returnvalue: "maxEntries",
                },
            ],
            dataSource
        )
        validateConfig()
        return
    }
    if (chartType == "Data Description") {
        $dialog.overlay([])
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
        $dialog.overlay(
            [
                { component: "hr" },
                selectElement(
                    "Description column: ",
                    descriptionCol,
                    "descriptionCol"
                ),
                ...subheading("First set of dates..."),
                selectElement(
                    "Start date column: ",
                    startDateCol,
                    "startDateCol"
                ),
                selectElement("End date column: ", endDateCol, "endDateCol"),
                {
                    component: "input text",
                    label: "Label: ",
                    initialValue: firstLabel,
                    returnvalue: "firstLabel",
                },
                ...subheading("Second set of dates..."),
                selectElement(
                    "Start date column: ",
                    secondStartDateCol,
                    "secondStartDateCol",
                    true
                ),
                selectElement(
                    "End date column: ",
                    secondEndDateCol,
                    "secondEndDateCol",
                    true
                ),
                {
                    component: "input text",
                    label: "Label: ",
                    initialValue: secondLabel,
                    returnvalue: "secondLabel",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...subheading("Others..."),
                selectElement("RAG column: ", RAGCol, "RAGCol", true),
                {
                    component: "textarea",
                    // label: "Annotations: ",
                    initialValue: annotations,
                    returnvalue: "annotations",
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
                return [selectElement("Date column: ", x_column, "x_column")]
            return [
                selectElement("Open date column: ", openDateCol, "openDateCol"),
                selectElement(
                    "Close date column: ",
                    closeDateCol,
                    "closeDateCol"
                ),
            ]
        }
        const { reportDate } = $p.getConfig()
        // future:
        // const xxx =
        //     [{
        //         type: "h3",
        //         label: "X axis...",
        //     },{
        //         name: "x_value",
        //         type: "text",
        //         label: "Label: ",
        //     },
        //     {
        //         name: "trendStartDate",
        //         type: "date",
        //         fallback: addDays(reportDate, -28),
        //     },]

        $dialog.overlay(
            [
                ...subheading("X axis..."),
                ...trendDates(),
                {
                    component: "input text",
                    label: "Label: ",
                    // initialValue: x_label,
                    returnvalue: "x_label",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...subheading("Others..."),
                {
                    component: "input date",
                    // label: "Start trend from: ",
                    initialValue: trendStartDate ?? addDays(reportDate, -28),
                    // options: columns,
                    returnvalue: "trendStartDate",
                },
                {
                    component: "textarea",
                    // label: "Annotations: ",
                    // initialValue: annotations,
                    returnvalue: "annotations",
                },
                {
                    component: "textarea",
                    // label: "Forecast: ",
                    // initialValue: forecast ?? "",
                    placeholder: "Click for template",
                    onclick: "displayGrammarTemplate(this, TREND_GRAMMAR)",
                    returnvalue: "forecast",
                },
                {
                    component: "textarea",
                    // label: "Plan: ",
                    placeholder: "Click for template",
                    onclick: "displayGrammarTemplate(this, PLAN_GRAMMAR)",
                    // initialValue: plan ?? "",
                    returnvalue: "plan",
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
        $dialog.overlay(
            [
                { component: "hr" },
                chartType == "State Change"
                    ? selectElement("Id column: ", idCol, "idCol")
                    : {},
                chartType == "State Change"
                    ? selectElement(
                          "Timestamp column: ",
                          timestampCol,
                          "timestampCol"
                      )
                    : {},
                ...subheading("X axis..."),
                selectElement("Column: ", x_column, "x_column"),
                {
                    component: "input text",
                    label: "Label: ",
                    initialValue: x_label ?? x_column,
                    returnvalue: "x_label",
                },
                {
                    component: "textarea",
                    label: "Labels: ",
                    // initialValue: x_labels ?? "",
                    // placeHolder: "Rare, Unlikely, Likely, Very Likely, Most Likely",
                    returnvalue: "x_labels",
                },
                ...subheading("Y axis..."),
                selectElement("Column: ", y_column, "y_column"),
                {
                    component: "input text",
                    label: "Label: ",
                    initialValue: y_label ?? y_column,
                    returnvalue: "y_label",
                },
                {
                    component: "textarea",
                    label: "Labels: ",
                    // initialValue: y_labels ?? "",
                    // placeHolder: "Very Low, Low, Medium, High, Very High",
                    returnvalue: "y_labels",
                },
                ...subheading("Count..."),
                chartFilterElements(chartFilter),
                ...countTypeInDialog,
                {
                    component: "input text",
                    // label: "Count labels: ",
                    // initialValue: countLabels ?? "",
                    // placeHolder: "VL,L,M.H,VH",
                    returnvalue: "countLabels",
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
        $dialog.overlay(
            [
                ...subheading("X axis..."),
                selectElement("Column: ", x_column, "x_column"),
                {
                    component: "select",
                    label: "Data type: ",
                    initialValue: x_dataType ?? "String",
                    options: [
                        "Date",
                        "String",
                        "Number",
                        "List",
                        "List Members",
                    ].sort(),
                    returnvalue: "x_dataType",
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
    $dialog.error(`Invalid value: ${chartType}`, "chartType")
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
        if (!_isValidDate(date)) return error()

        if (!annotationArray[i + 1]) return error()

        const style = annotationArray[i + 2].trim().toLowerCase()

        if (!styles.includes(style)) return error()
    }
    return true
}

const checkStringType = () => {
    const { countType, colOver, chartFilter } = $dialog.data()

    validateChartFilterGrammar(chartFilter)

    if ($dialog.hasErrors()) return

    Object.assign(newCol, { countType, colOver, chartFilter })
    const placeHolder = $p.getAutoTitle(newCol)
}
function validateConfig() {
    $dialog.error()
    const properties = $dialog.data()
    const { chartType } = $dialog.data()

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
        const { reportDate } = $p.getConfig()
        const { isValid, errors, warnings } = $c.validate(
            chartType,
            properties,
            { reportDate }
        )
        if (warnings)
            for (const key in warnings) $dialog.error(errors[key], key)

        if (!isValid) for (const key in errors) $dialog.error(errors[key], key)
    } else $dialog.error(`Invalid value: ${chartType}`, "chartType")
}
function configChartApply(chartID) {
    const key = getKey(chartID)
    const properties = $dialog.data()
    validateConfig()
    if ($dialog.hasErrors()) return
    $dialog.close()
    if ($p.setChartProps(key, properties)) reCreateCharts(key)
}

async function reCreateCharts(key) {
    const scrollY = window.scrollY
    clearCounts()
    destroyAllCharts()
    const { file } = $p.getConfig()
    await countNow(file, undefined, false, "Keep Config")
    window.scroll(0, scrollY)
    scrollToChart(key)
    // if (key) {
    //     const chart = _select("#" + getChartId(key))
    //     if (chart) {
    //         chart.scrollIntoView(false)
    //         return
    //     }
    // }
    // window.scroll(0, scrollY)
}
function scrollToChart(key) {
    if (!key) return
    const chart = _select(`#${getChartContainer(key)}`)
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
    const filteredValues = chartCategories.map((v) => ({
        [v]: oneCount[v] ? oneCount[v].include : "disable",
    }))

    const filterDialog = [
        { component: "h3", label: `Filter items` },
        { component: "hr" },
        {
            component: "check",
            initialValue: filteredValues,
            returnvalue: "filteredValues",
        },
        { component: "hr" },
        {
            component: "button",
            label: "Cancel",
            onclick: "$dialog.close()",
        },
        {
            component: "button",
            label: "Apply",
            class: "disable-on-error",
            onclick: `applyFilter("${chartID}")`,
        },
    ]
    $dialog
        .make(filterDialog, { onchange: "checkFilterDialog()", width: "small" })
        .show()
}
function checkFilterDialog() {
    const { filteredValues } = $dialog.data()
    $dialog.error()
    const someChecked = filteredValues.some((v) => Object.values(v)[0])
    if (!someChecked) $dialog.error("Required some checked", "filteredValues")
}
async function applyFilter(chartID) {
    checkFilterDialog()
    if ($dialog.hasErrors()) return
    const key = getKey(chartID)
    const allCounts = getCounts()
    const oneCount = allCounts.counts[key]

    filteredValues.forEach((v) => {
        const label = Object.keys(v)[0]
        if (oneCount[label]) {
            oneCount[label].include = v[label]
        }
    })
    $dialog.close()
    const { file } = $p.getConfig()
    /* await */ countNow(file, allCounts, true)
}

const $dialog = (function () {
    "use strict"
    const specials = {
        component: 1,
        label: 1,
        initialValue: 1,
        returnvalue: 1,
        elements: 1,
        options: 1,
        focus: 1,
        disable: 1,
    }
    const self = {}
    let dialog, idCounter, overlay, alertButtonPressed
    function getLabel(name) {
        if (!name) return "Undefined"
        const nameParts = name.split(/(?=[A-Z])/)
        let label = nameParts.join(" ").toLowerCase() + ": "
        return label[0].toUpperCase() + label.substring(1)
    }
    let hasErrors = false
    //TO DO remove all styles
    const HTMLs = {
        dialog: () =>
            `<dialog class="maas-dialog"><form><fieldset></fieldset></form></dialog>`, //class is OK
        legend: (label) => `<legend>${label}</legend>`,
        // mainTitle: (label) => `<h4>${label}</h4>`,
        input: (label, type, id, name) =>
            `<p>
                <label for="${id}">${label}</label>
                <input type="${type}" id="${id}" name=${name} tabindex="0">
            </p>`,
        button: (label) => `<button tabindex="0">${label}</button>`,
        textarea: (label, id, name) =>
            `<p>
                <label for="${id}">${label}</label>
                <textarea id="${id}" name=${name} tabindex="0" rows=1></textarea>
            </p>`,
        select: (label, id, name) =>
            `<p>
                <label for="${id}">${label}</label>
                <select id="${id}" name=${name} tabindex="0"> </select>
            </p>`,
        checkbox: (label, checked, id, name) =>
            `<p>
                <input type="checkbox" id="${id}" ${
                checked ? "checked" : ""
            } name=${name} tabindex="0">
                <label for="${id}">${label}</label>
            </p>`,

        error: (messages) => `<error>${messages}</error>`,
    }

    self.getElement = function (elementName) {
        return _select(`[name = ${elementName}]`, dialog)
    }

    function isSpecial(attr) {
        return specials[attr] ? true : false
    }

    function createElement(param) {
        const {
            component,
            options,
            initialValue,
            returnvalue,
            disable,
            disabled,
        } = param

        const label = param.label ?? getLabel(returnvalue)

        function setReturnAndInitialValues(e) {
            if (returnvalue) e.setAttribute("returnvalue", returnvalue)
            if (initialValue) e.value = initialValue

            for (const key in param) {
                if (!isSpecial(key)) {
                    try {
                        e.setAttribute(key, param[key])
                    } catch (error) {
                        console.assert(
                            false,
                            "Invalid attribute Name in dialog spec"
                        )
                    }
                }
            }
        }

        if (!component) return

        if (component == "legend") {
            if (!label) return
            const html = HTMLs[component](label)
            const legend = _createElements(html)
            _select("form fieldset", dialog).appendChild(legend)
            return
        }

        if (component.substring(0, 5) == "input") {
            const inputType = component.replace("input ", "")
            const html = HTMLs["input"](
                label,
                inputType,
                idCounter++,
                returnvalue
            )
            const div = _createElements(html)
            const input = _select("input", div)
            setReturnAndInitialValues(input)
            return div
        }
        if (component == "button") {
            const html = HTMLs[component](label)
            const button = _createElements(html)
            //button.preventDefault()
            setReturnAndInitialValues(button)
            return button
        }
        if (component == "textarea") {
            const html = HTMLs[component](label, idCounter++, returnvalue)
            const div = _createElements(html)
            const textarea = _select("textarea", div)
            setReturnAndInitialValues(textarea)
            return div
        }

        if (component == "check") {
            function createACheckBox(label, checked, disabled) {
                const html = HTMLs["checkbox"](
                    label,
                    checked,
                    idCounter++,
                    label
                )
                const p = _createElements(html)
                const input = _select("input", p)
                if (disabled) input.disabled = true
                return p
            }
            function setupChecks(initialValue) {
                initialValue.forEach((v) => {
                    const key = Object.keys(v)[0]
                    const disabled = v[key] == "disable"
                    const checked = v[key]
                    const checkEntry = createACheckBox(key, checked, disabled)
                    div.appendChild(checkEntry)
                })
                div.setAttribute("data-checkbox-component", "group") //do we need this?
                div.setAttribute("returnvalue", returnvalue)
            }
            function setupOneCheck() {
                const checked = Boolean(initialValue)
                const checkEntry = createACheckBox(label, checked)
                const input = _select("input", checkEntry)
                input.setAttribute("checkbox", true)
                input.setAttribute("data-checkbox-component", "single")
                input.setAttribute("returnvalue", returnvalue)

                div.appendChild(checkEntry)
            }

            const div = document.createElement("div")

            if (Array.isArray(initialValue)) setupChecks(initialValue)
            else setupOneCheck()
            //requires a wrapper to display error message
            const wrapper = document.createElement("div")
            wrapper.append(div)
            return wrapper
        }
        if (component == "overlay") {
            overlay = document.createElement("div")
            return overlay
        }

        if (component == "select") {
            if (!options) return
            const html = HTMLs[component](label, idCounter++, returnvalue)

            const div = _createElements(html)
            const select = _select("select", div)
            options.forEach((value) => {
                const option = document.createElement("option")
                option.setAttribute("value", value)
                option.textContent = value
                select.appendChild(option)
            })
            setReturnAndInitialValues(select)
            return div
        }
        // if (component == "groupElements") {
        //     const html = HTMLs[component](label)
        //     const div = _createElements(html)
        //     const details = _select("div", div)

        //     const { elements } = param
        //     elements.forEach((e) => {
        //         const newE = createElement(e)
        //         if (!newE) return
        //         details.appendChild(newE)
        //     })
        //     return div
        // }
        const e = document.createElement(component)
        setReturnAndInitialValues(e)
        e.textContent = label
        return e
    }

    self.hasErrors = function () {
        return hasErrors
    }

    self.error = function (errorMessages, errorItem) {
        if (!dialog) return
        const disableOnError = _select(".disable-on-error", dialog)
        if (disableOnError) disableOnError.disabled = false
        if (!errorMessages) {
            const errors = _selectAll("error", dialog)
            for (const error of errors) error.remove()
            hasErrors = false
            return this
        }

        if (!errorItem) return this

        const returnValues = _selectAll("[returnvalue]", dialog)
        hasErrors = true
        if (disableOnError) disableOnError.disabled = true
        const errorToDisplay = Array.isArray(errorMessages)
            ? errorMessages.join(". ")
            : errorMessages
        for (const returnvalue of returnValues) {
            const key = returnvalue.getAttribute("returnvalue")
            if (key == errorItem) {
                const itemWithError = returnvalue.parentElement
                const mark = _createElements(HTMLs["error"](errorToDisplay))
                itemWithError.after(mark)
                return this
            }
        }
        return this
    }
    function addLabelAndInitialValue(e, initialValues) {
        if (!initialValues) return e
        const name = e.returnvalue // const name = e.name
        if (!name) return e
        const label = e.label ?? getLabel(name)
        const initialValue = e.initialValue
            ? e.initialValue
            : initialValues[name]
        return { ...e, label, initialValue }
    }
    self.overlay = function (elements, initialValues) {
        if (!dialog) return
        _clearHTML(overlay)
        if (!elements) return
        elements.forEach((e) => {
            if (_isEmpty(e)) return
            //put label and initialValue
            const overlayElement = createElement(
                addLabelAndInitialValue(e, initialValues)
            )
            overlay.appendChild(overlayElement)
        })
        return this
    }
    self.make = function (
        elements,
        { onchange, initialValues, width = "medium" }
    ) {
        if (dialog) this.close()
        dialog = _createElements(HTMLs["dialog"]())
        dialog.classList.add(width)
        const body = document.body
        body.appendChild(dialog)
        dialog.setAttribute("onchange", onchange)
        idCounter = 0
        elements.forEach((e) => {
            if (_isEmpty(e)) return
            const element = createElement(e)
            if (!element) return
            _select("form fieldset", dialog).appendChild(element)
        })

        const form = _select("form", dialog)
        form.addEventListener("submit", (event) => {
            event.preventDefault()
            // const data = new FormData(event.target)
            // const formJSON = Object.fromEntries(data.entries())
        })

        return this
    }
    self.show = function (modal = true) {
        if (!dialog) return
        if (dialog.open) dialog.close()
        if (modal) {
            dialog.showModal()
            return this
        }
        dialog.show()
        return this
    }

    self.close = function () {
        if (!dialog) return
        dialog.close()
        dialog.innerHTML = ""
        dialog.remove()
    }

    self.data = function () {
        const data = {}
        const returnElements = _selectAll("[returnvalue]", dialog)
        for (const e of returnElements) {
            function getCheckboxGroup(el) {
                const checkedValues = []
                const inputs = _selectAll("input", el)
                const labels = _selectAll("label", el)
                for (let i = 0; i < inputs.length; i++) {
                    const key = labels[i].textContent
                    const value = inputs[i].checked
                    checkedValues.push({ [key]: value })
                }
                return checkedValues
            }
            const key = e.getAttribute("returnvalue")

            const checkboxType = e.getAttribute("data-checkbox-component")
            data[key] =
                checkboxType === "single"
                    ? e.checked
                    : checkboxType === "group"
                    ? getCheckboxGroup(e)
                    : e.value
        }
        return data
    }

    self.alert = function (message, buttons) {
        const alertDialog = [
            { component: "h2", label: `Alert` },
            { component: "hr" },
            {
                component: "p",
                label: typeof message == "string" ? message : DISPLAY_INVALID,
            },
            { component: "hr" },
        ]

        let buttonCount = 0
        const buttonComponent = (label) => ({
            component: "button",
            label,
            onclick: `$dialog.alertResponse("${label}")`,
        })

        if (Array.isArray(buttons))
            buttons.forEach((button) => {
                if (typeof button == "string") {
                    // buttonCount++
                    alertDialog.push(buttonComponent(button))
                }
            })
        else alertDialog.push(buttonComponent("Close"))

        alertButtonPressed = ""
        this.make(alertDialog, {}).show()

        return new Promise(function (resolve, reject) {
            dialog.addEventListener("close", (event) => {
                resolve(alertButtonPressed)
            })
        })
    }
    self.alertResponse = function (response) {
        alertButtonPressed = response
        this.close()
    }
    self.width = function (w) {
        if (!dialog) return
        dialog.style.width = w ? w : ""
        return dialog
    }
    // self.position = function (divId) {
    //     return dialog
    // }
    return self // expose externally
})()

// function autoChartTitle(key) {}
//////////////////////////////////////////////////////////////call out
function showCalloutMenu(key) {
    const button = (l, f) => {
        return {
            component: "button",
            label: l,
            onclick: `$dialog.close();${f}("${key}")`,
        }
    }
    const elements = [
        button("Config callout", "showCalloutConfigDialog"),
        { component: "br" },
        button("Remove callout", "removeCallout"),
        { component: "br" },
        { component: "button", label: "Close", onclick: "$dialog.close()" },
    ]
    $dialog.make(elements, { width: "small" }).show()
}
//////////////////////////////////////////////////////////////////// callout config

function showCalloutConfigDialog(key, addNew = false) {
    const { chartNumber, value, category, message } = addNew
        ? { chartNumber: key, value: "max" }
        : $p.getCallOutProps(key)

    // const { chartNumber, value, category, message } = $p.getCallOutProps(key)
    const calloutConfigDialog = [
        { component: "h2", label: `Configure callout` },
        { component: "hr" },
        addNew
            ? {}
            : {
                  component: "input number",
                  initialValue: Number(key) + 1,
                  min: 1,
                  max: $p.getNoOfCallOuts(),
                  returnvalue: "position",
              },
        {
            component: "input number",
            initialValue: Number(chartNumber) + 1,
            min: 1,
            max: $p.getNoOfCharts(),
            returnvalue: "chartNumber",
        },
        { component: "overlay" },
        {
            component: "select",
            label: "Value: ",
            initialValue: value,
            options: ["max", "min", "category"],
            returnvalue: "value",
        },
        {
            component: "input text",
            initialValue: category,
            returnvalue: "category",
        },
        {
            component: "input text",
            initialValue: message,
            returnvalue: "message",
        },
        { component: "hr" },
        {
            component: "button",
            label: "Cancel",
            onclick: "$dialog.close()",
        },
        {
            component: "button",
            label: addNew ? "Add" : "Apply",
            onclick: `applyConfigCallout()`,
        },
    ]

    $dialog.make(calloutConfigDialog, { onchange: "overlayCallout()" })
    $dialog.show()
    overlayCallout()
}
function overlayCallout() {
    const { chartNumber } = $dialog.data()
    const { chartType } = $p.getChartProps(chartNumber - 1)
    const overlayElements = [
        {
            component: "p",
            label: `Chart type for the chart is: ${chartType}`,
        },
    ]
    $dialog.overlay(overlayElements, {})
    const value = $dialog.getElement("value").value
    const category = $dialog.getElement("category")
    category.disabled = value !== "category"
    const { errors } = validateCalloutConfig()
    if (errors) for (const key in errors) $dialog.error(errors[key], key)
}
function validateCalloutConfig() {
    $dialog.error()
    const properties = $dialog.data()
    const chartNumber = $dialog.getElement("chartNumber").value
    const { chartType } = $p.getChartProps(chartNumber - 1)
    const { errors, output } = $c.validateCallout(chartType, properties, {})
    if (errors) return { errors }
    if (output) Object.assign(properties, output)
    return { output: properties }
}
function applyConfigCallout() {
    const { output, errors } = validateCalloutConfig()

    if (errors) {
        for (const key in errors) $dialog.error(errors[key], key)
        return
    }

    const { chartNumber, position } = output
    output.chartNumber = Number(chartNumber) - 1
    if (position) delete output.position
    $dialog.close()
    const calloutPosition = position ? Number(position) - 1 : undefined
    console.log(output, calloutPosition)
    if ($p.setCallOutProps(calloutPosition, output)) reCreateCharts()
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
    const reply = await $dialog.alert("Are you sure to remove the callout?", [
        confirm,
        "No keep",
    ])
    if (reply === confirm) if ($p.removeCallOut(key)) reCreateCharts()
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
