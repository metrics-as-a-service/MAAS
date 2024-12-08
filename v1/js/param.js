;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Param = global.Param || {})))
})(this, function (exports) {
    "use strict"
    // const self = {} // public object - returned at end of module
    let config = {}

    function getCountOf(type) {
        if (!type) return 0
        if (!config) return 0
        return type === "chart"
            ? config.chartProperties
                ? config.chartProperties.length
                : 0
            : type === "callout"
            ? config.callOuts
                ? config.callOuts.length
                : 0
            : 0
    }
    function getChartProps(index, flatten = false) {
        if (!config.chartProperties[index]) {
            //to do remove Logger
            Logger.log(
                `Invalid call to getChartProps; index= ${index}`,
                "error"
            )
            return
        }
        let returnCol = JSON.parse(
            JSON.stringify(config.chartProperties[index])
        )
        const title = returnCol.chartTitle
            ? returnCol.chartTitle
            : getAutoTitle(config.chartProperties[index])

        returnCol.chartTitleWithIndex =
            (Number(index) + 1).toString() + ". " + title
        return flatten ? _flatten(returnCol) : returnCol
    }
    function arrayMove(arr, from, to) {
        if (from === to) return
        const l = arr.length
        if (from < 0 || from >= l) return
        if (to < 0 || to >= l) return
        let a = [...arr]
        a[from] = undefined
        const delta = from < to ? 1 : 0
        a.splice(to + delta, 0, arr[from])

        return a.filter((v) => v !== undefined)
    }
    function setChartProps(index, newValues, unFlatten = false) {
        let updated = false
        const chartProp = config.chartProperties[index]
        const valuesToUpdate = unFlatten ? _unFlatten(newValues) : newValues

        for (const [key, value] of Object.entries(valuesToUpdate)) {
            //if (chartProp[key] == undefined) continue
            if (chartProp[key] != value) {
                chartProp[key] = value
                updated = true
            }
        }
        if (chartProp.position) delete chartProp.position

        for (const key of Object.keys(chartProp)) {
            if (valuesToUpdate[key] == undefined) delete chartProp[key]
        }

        const position = Number(newValues.position) - 1

        const chartProperties = config.chartProperties

        if (position !== Number(index)) {
            const newPositions = arrayMove(
                chartProperties.map((_, i) => i),
                index,
                position
            )
            //move the charts
            const newChartProperties = newPositions.map((i) =>
                JSON.stringify(chartProperties[i])
            )
            chartProperties.forEach(
                (_, i) =>
                    (chartProperties[i] = JSON.parse(newChartProperties[i]))
            )
            //move callouts
            const callouts = config.callOuts
            if (callouts)
                callouts.forEach((v) => {
                    v.chartNumber = newPositions[Number(v.chartNumber)] + ""
                })
            updated = true
        }

        return updated
    }
    function remove(type, index) {
        if (!type) return false
        return type === "chart"
            ? removeChart(index)
            : type === "callout"
            ? removeCallOut(index)
            : false
    }
    function removeChart(index) {
        if (!config.chartProperties) return false
        if (index < 0) return false
        const chartProperties = config.chartProperties
        if (index > chartProperties.length - 1) return false
        chartProperties.splice(index, 1)
        if (config.callOuts)
            config.callOuts.forEach((co) => {
                const chartNumber = co.chartNumber
                if (chartNumber < index)
                    co.chartNumber = Number(chartNumber) - 1 + ""
            })
        return true
    }

    function cloneChart(index) {
        if (!config.chartProperties) return false
        if (index < 0) return false
        const chartProperties = config.chartProperties
        if (index > chartProperties.length - 1) return false
        const newValue = JSON.parse(JSON.stringify(chartProperties[index]))
        chartProperties.splice(index, 0, newValue)
        config.callOuts.forEach((co) => {
            const chartNumber = co.chartNumber
            if (chartNumber > index)
                co.chartNumber = Number(chartNumber) + 1 + ""
        })
        return true
    }

    function getAutoTitle(chartProp) {
        if (!chartProp) return ""
        const {
            chartType,
            countType,
            colOver,
            x_bin,
            x_column,
            x_label,
            x_labels,
            y_column,
            y_label,
            y_labels,
        } = chartProp
        const x = _.firstNonBlank(x_label, x_column)
        const y = _.firstNonBlank(y_label, y_column)
        if (!chartType) return ""
        //     string, date
        const countPrefix = () => {
            if (countType === "Count") return "Count"
            if (countType === "Sum") return `Sum of ${colOver}`
            return `Av of ${colOver}`
        }

        if (
            ["Note", "Data Description", "Data Table", "Plan"].includes(
                chartType
            )
        )
            return chartType.toUpperCase()

        if (chartType === "Trend" || chartType === "Trend OC")
            return `${x} over time`.toUpperCase()

        if (chartType === "Risk") return `${countPrefix} by Risk`.toUpperCase()

        if (chartType === "2X2")
            return `${countPrefix()} by ${x} and ${y}`.toUpperCase()

        if (chartType === "State Change")
            return `State Change: ${countType}`.toLocaleUpperCase()

        if (chartType === "Bar") {
            const binned = x_bin ? "Binned " : ""
            // const list = chartType === "List" ? "Members in " : ""
            // const list = chartType === "List Members"? "Members in " : ""
            return `${binned}${countPrefix()} by ${x}`.toUpperCase()
        }

        return `undefined: ${chartType}`.toUpperCase()
    }
    //////////////////////////////////////////////////////////// callout functions
    // function getCallOut(id) {
    //     //move to c
    //     const { countType, chartType, bin, order } = config.chartProperties[id]
    //     // console.log(id, chartType)
    //     if (
    //         [
    //             "Note",
    //             "Data Table",
    //             "Data Description",
    //             "Trend",
    //             "List Count",
    //             "List Members",
    //         ].includes(chartType)
    //     )
    //         return {
    //             topMessage: "No call outs",
    //             value: "NA",
    //             bottomMessage: "NA",
    //         }
    //     const allCounts = getCounts()
    //     const oneCount = allCounts.counts[key]
    //     if (chartType == "Trend") console.log(oneCount)
    //     const categories = Object.keys(oneCount)

    //     let category = categories[0]
    //     if (!oneCount[category])
    //         return {
    //             topMessage: "No call outs",
    //             value: "NA",
    //             bottomMessage: "NA",
    //         }
    //     let value = oneCount[category].filteredCount

    //     function getMinMax(callValue) {
    //         categories.forEach((cat) => {
    //             const categoryValue = oneCount[cat].filteredCount
    //             if (
    //                 (callValue == "min" && value > categoryValue) ||
    //                 (callValue == "max" && value < categoryValue)
    //             ) {
    //                 value = categoryValue
    //                 category = cat
    //             }
    //         })
    //     }

    //     const { callValue, callCategory } = {
    //         callValue: "max",
    //         callCategory: "P1",
    //     }

    //     if (callValue == "category") {
    //         category = callCategory
    //         if (!oneCount[category])
    //             return {
    //                 topMessage: "No call outs",
    //                 value: "NA",
    //                 bottomMessage: "NA",
    //             }
    //         value = oneCount[category].filteredCount
    //     } else getMinMax(callValue)

    //     const topMessage =
    //         callValue == "min" ? "Minimum value" : "Maximum value"
    //     return {
    //         value,
    //         topMessage,
    //         bottomMessage: category,
    //     }
    // }
    function removeCallOut(index) {
        if (!config.callOuts) return false
        if (index === undefined) return false
        if (!config.callOuts[index]) return false
        config.callOuts.splice(index, 1)
        return true
    }

    function getCallOutProps(index) {
        return config.callOuts[index]
    }
    function setCallOutProps(index, newValue) {
        if (!config.callOuts) config.callOuts = []
        const cleanedNewValue = _.cleanObject(newValue)

        if (index === undefined) {
            config.callOuts.push(cleanedNewValue)
            return true
        }
        if (!config.callOuts[index]) return false

        const position = Number(cleanedNewValue.position) - 1
        delete cleanedNewValue.position

        const callout = config.callOuts[index]
        for (const key in callout) delete callout[key]
        for (const key in cleanedNewValue) callout[key] = cleanedNewValue[key]

        const callouts = config.callOuts
        const newPositions = arrayMove(
            callouts.map((_, i) => i),
            Number(index),
            position
        )
        if (newPositions) {
            const newCallouts = newPositions.map((i) =>
                JSON.stringify(callouts[i])
            )
            callouts.forEach(
                (_, i) => (callouts[i] = JSON.parse(newCallouts[i]))
            )
        }
        return true
    }
    function updateFile(file) {
        config.file = file
    }
    function autoCreateConfig(file, dataDescription, action) {
        function autoType(chartProp) {
            const { dateCount, numberCount, stringCount } =
                dataDescription[chartProp]
            if (dateCount > 0 && numberCount == 0 && stringCount == 0)
                return "Date"
            if (numberCount > 0 && dateCount == 0 && stringCount == 0)
                return "Number"
            return "String"
        }

        function createDefaults() {
            const d = new Date()
            config.reportDate = d.toISOString().substring(0, 10)
            config.reportTitle = "Auto-generated Dashboard"
            config.maxValues = "30"
            config.file = file
        }
        function autoCreateCallOuts() {
            config.callOuts = []
            for (let i = 0; i < config.chartProperties.length; i++)
                if (config.chartProperties[i].chartType === "Bar")
                    config.callOuts.push({
                        chartNumber: i,
                        value: "max",
                    })
        }
        function createChartProperties() {
            config.columnNames = []
            config.columnTypes = []
            config.callOuts = [] //use in future
            config.chartProperties = []
            const chartProperties = config.chartProperties
            for (const colName in dataDescription) {
                const chartType = autoType(colName)
                const chartProp = {
                    chartSize: "Small",
                    countType: "Count",
                    chartType: "Bar",
                    x_dataType: chartType,
                    x_column: colName,
                }
                if (chartProp.x_dataType === "Date")
                    chartProp.x_dateFormat = "MMM"
                if (chartProp.x_dataType === "Number") chartProp.x_bin = "5"

                chartProperties.push(chartProp)
            }
            chartProperties.forEach((v) => {
                config.columnNames.push(v.x_column)
                config.columnTypes.push(v.x_dataType)
            })
            //add table
            chartProperties.push({
                chartType: "Data Table",
                chartSize: "Small",
                maxEntries: "10",
            })
            //add description
            chartProperties.push({
                chartType: "Data Description",
                chartSize: "Small",
            })

            const message =
                "The input has the following data headers (value in bracket indicates chart type assumed):" +
                config.columnNames.reduce(
                    (list, column, i) =>
                        `${list}\n${i + 1}. ` +
                        `${column} (${config.columnTypes[i]})`,
                    ""
                )
            chartProperties.unshift({
                chartType: "Note",
                chartSize: "Small",
                message: message,
            })
        }

        // if (action == "Create Columns") {
        //     createChartProperties()
        //     autoCreateCallOuts()
        //     return
        // }

        // if (action == "Keep Config") {
        //     console.assert(
        //         config.chartProperties,
        //         `Action "${action}" is incorrect`
        //     )
        //     // if (!config.chartProperties) {
        //     //     createDefaults()
        //     // }
        //     // updateDescription()
        //     // console.log(config.chartProperties)
        //     return
        // }
        // if (action == "Reset Config") {
        createDefaults()
        createChartProperties()
        autoCreateCallOuts()
        // return
        // }
        // console.assert(false, `Action "${action}" is incorrect`)
    }
    function getConfig() {
        return config
    }
    function setConfig(newConfig, file, dataDescription) {
        if (newConfig === "default") {
            autoCreateConfig(file, dataDescription)
            return true
        }
        for (const key in config) delete config[key]
        Object.assign(config, newConfig)
        return true
    }

    exports.getCountOf = getCountOf

    exports.getChartProps = getChartProps //getCallOutProps
    exports.setChartProps = setChartProps //setCallOutProps

    exports.remove = remove
    exports.cloneChart = cloneChart

    exports.getAutoTitle = getAutoTitle //getDefault("title"|"callout-message" etc)
    exports.getCallOutProps = getCallOutProps
    exports.setCallOutProps = setCallOutProps
    exports.updateFile = updateFile

    exports.getConfig = getConfig
    exports.setConfig = setConfig
})
