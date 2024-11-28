const $p = (function () {
    "use strict"
    const self = {} // public object - returned at end of module
    let config = {}
    const store = {}
    const chartDescription = $c.getChartDescription()

    self.getChartTypes = function () {
        return Object.keys(chartDescription)
            .filter((v) => chartDescription[v].isChart)
            .sort()
    }
    self.getDateFormats = function () {
        return chartDescription.dateFormats
    }
    self.cannotFilter = (chartType) => {
        if (!chartType) return false
        if (!chartDescription[chartType]) return false
        return chartDescription[chartType].cannotFilter
    }

    self.getNoOfCharts = function () {
        if (!config.chartProperties) return 0
        return config.chartProperties.length
    }

    self.getChartProps = function (index, flatten = false) {
        if (!config.chartProperties[index]) {
            $l.log(`Invalid call to getChartProps; index= ${index}`, "error")
            return
        }
        let returnCol = JSON.parse(
            JSON.stringify(config.chartProperties[index])
        )
        const title = returnCol.chartTitle
            ? returnCol.chartTitle
            : self.getAutoTitle(config.chartProperties[index])

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
    self.setChartProps = function (index, newValues, unFlatten = false) {
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
        // if (position != index) {
        //     function arrayMove(arr, oldIndex, newIndex) {
        //         if (newIndex >= arr.length) {
        //             let k = newIndex - arr.length + 1
        //             while (k--) {
        //                 arr.push(undefined)
        //             }
        //         }
        //         arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
        //     }
        //     console.log(index, position)
        //     arrayMove(config.chartProperties, index, position)
        //     updated = true
        // }
        const chartProperties = config.chartProperties
        const newPositions = arrayMove(
            chartProperties.map((_, i) => i),
            index,
            position
        )
        if (newPositions) {
            console.log(index, newPositions)
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
    self.removeChart = function (index) {
        if (!config.chartProperties) return false
        if (index < 0) return false
        const chartProperties = config.chartProperties
        if (index > chartProperties.length - 1) return false
        chartProperties.splice(index, 1)
        config.callOuts.forEach((co) => {
            const chartNumber = co.chartNumber
            if (chartNumber < index)
                co.chartNumber = Number(chartNumber) - 1 + ""
        })
        return true
    }

    self.cloneChart = function (index) {
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

    self.getTitleWOIndex = function (index) {
        return config.chartProperties[index].chartTitle
    }

    self.getAutoTitle = (chartProp) => {
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
        const x = _pick1stNonBlank(x_label, x_column)
        const y = _pick1stNonBlank(y_label, y_column)
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
    self.getCallOut = function (id) {
        //move to c
        const { countType, chartType, bin, order } = config.chartProperties[id]
        // console.log(id, chartType)
        if (
            [
                "Note",
                "Data Table",
                "Data Description",
                "Trend",
                "List Count",
                "List Members",
            ].includes(chartType)
        )
            return {
                topMessage: "No call outs",
                value: "NA",
                bottomMessage: "NA",
            }
        const allCounts = getCounts()
        const oneCount = allCounts.counts[key]
        if (chartType == "Trend") console.log(oneCount)
        const categories = Object.keys(oneCount)

        let category = categories[0]
        if (!oneCount[category])
            return {
                topMessage: "No call outs",
                value: "NA",
                bottomMessage: "NA",
            }
        let value = oneCount[category].filteredCount

        function getMinMax(callValue) {
            categories.forEach((cat) => {
                const categoryValue = oneCount[cat].filteredCount
                if (
                    (callValue == "min" && value > categoryValue) ||
                    (callValue == "max" && value < categoryValue)
                ) {
                    value = categoryValue
                    category = cat
                }
            })
        }

        const { callValue, callCategory } = {
            callValue: "max",
            callCategory: "P1",
        }

        if (callValue == "category") {
            category = callCategory
            if (!oneCount[category])
                return {
                    topMessage: "No call outs",
                    value: "NA",
                    bottomMessage: "NA",
                }
            value = oneCount[category].filteredCount
        } else getMinMax(callValue)

        const topMessage =
            callValue == "min" ? "Minimum value" : "Maximum value"
        return {
            value,
            topMessage,
            bottomMessage: category,
        }
    }
    self.getNoOfCallOuts = function () {
        return config.callOuts ? config.callOuts.length : 0
    }
    self.removeCallOut = function (index) {
        if (!config.callOuts) return false
        if (index === undefined) return false
        if (!config.callOuts[index]) return false
        config.callOuts.splice(index, 1)
        return true
    }

    self.getCallOutProps = function (index) {
        return config.callOuts[index]
    }
    self.setCallOutProps = function (index, newValues) {
        if (!config.callOuts) config.callOuts = []
        const cleanedNewValues = _cleanObject(newValues)
        if (index === undefined) {
            config.callOuts.push(cleanedNewValues)
            return true
        }
        if (!config.callOuts[index]) return false
        const callout = config.callOuts[index]
        for (const key in callout) delete callout[key]
        for (const key in cleanedNewValues) {
            const value = cleanedNewValues[key]
            callout[key] = value
        }
        return true
    }
    // function cleanObject(input) {
    //     const output = {}
    //     if (typeof input !== "object") return output
    //     for (const key in input) {
    //         const value = input[key]
    //         if (typeof value === "undefined") continue
    //         if (!isNaN(value)) output[key] = value + ""
    //         if (typeof value !== "string") continue
    //         if (value.trim() === "") continue
    //         output[key] = value.trim()
    //     }
    //     return output
    // }
    ////////////////////////////////////////////////////////////
    self.configAction = async function (file) {
        if (!config) return "Reset Config"
        if (!config.file) return "Reset Config"
        const filename = typeof file == "string" ? file : file.name
        const configFileName =
            typeof config.file == "string" ? config.file : config.file.name

        if (!configFileName) {
            //TO DO check if same headers????????
            config.file = file
            return "Keep Config"
        }
        if (configFileName == filename) {
            //TO DO check if same headers????????
            config.file = file
            return "Keep Config"
        }

        const action = await $dialog.alert(
            `The current file is: "${filename}" but config is for file "${configFileName}". Override config`,
            ["Keep Config", "Reset Config", "Abort Load"]
        )
        return action
    }
    self.autoCreateConfig = function (file, row, action, dataDescription) {
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

        if (action == "Create Columns") {
            createChartProperties()
            autoCreateCallOuts()
            return
        }

        if (action == "Keep Config") {
            console.assert(
                config.chartProperties,
                `Action "${action}" is incorrect`
            )
            // if (!config.chartProperties) {
            //     createDefaults()
            // }
            // updateDescription()
            // console.log(config.chartProperties)
            return
        }
        if (action == "Reset Config") {
            createDefaults()
            createChartProperties()
            autoCreateCallOuts()
            return
        }
        console.assert(false, `Action "${action}" is incorrect`)
    }
    self.getTheConfig = () => {
        return config
    }
    self.getConfig = function () {
        let configWithoutCols = {}
        for (const [key, value] of Object.entries(config)) {
            if (key != "chartProperties") configWithoutCols[key] = value
        }

        return configWithoutCols
    }

    self.setConfig = function (newConfig) {
        const { reportTitle, reportDate } = newConfig

        if (reportTitle)
            if (config.reportTitle != reportTitle)
                config.reportTitle = reportTitle

        if (reportDate)
            if (config.reportDate != reportDate) config.reportDate = reportDate

        return true
    }

    self.getConfigJSON = function () {
        try {
            const json = JSON.stringify(config, null, 2)
            return json
        } catch (e) {
            console.error(
                `Error while JSON.stringify(config). Config not copied. Error: ${e}`
            )
            return
        }
    }

    self.setConfigJSON = function (configText, isPreset = false) {
        if (!isPreset) if (config.chartProperties) return
        try {
            config = JSON.parse(configText)
        } catch (error) {
            const errorMessage = `Config parse failed. Error: ${error}`
            console.log(false, errorMessage)
            return false
        }
        if (!isPreset) $dialog.alert("File loaded successfully", ["OK"])
        return true
    }

    self.setItem = function (key, value) {
        //localStorage.setItem(key, value)
        store[key] = value
    }
    self.getItem = function (key) {
        //return localStorage.getItem(key)
        console.assert(store[key], `${key} is not found`)
        return store[key]
    }

    return self // expose externally
})()
