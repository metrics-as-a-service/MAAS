'use strict'
//draw the chart: APEXCHAFRT
//https://apexcharts.com/docs/update-charts-from-json-api-ajax/
const CHART_HEIGHT = 350
const FONT_FAMILY = _getCSSVar("--maas-font-family")//'Raleway, Arial, sans-serif'
const TOOLICONS = {
    menu: {
        icon: '&#9776;',
        index: 0,
        title: 'Chart menu',
        class: 'custom-icon',
        click: function (chart, options, e) {
            showChartMenus(options.globals.chartID, { x: e.screenX, y: e.screenY })
        }
    },
}
// const RAG_COLORS = ["#96d35f", "#74b057", "#f3ba34", "#f28f1c", "#ff4013"] //from https://huemint.com 
const TOOLBAR = {
    show: true,
    tools: {
        download: false,
        download: false,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
        customIcons: [TOOLICONS.menu]
    }
}
const CHART_COLORS = [
    _getCSSVar("--maas-chart-color-1"),
    _getCSSVar("--maas-chart-color-2"),
    _getCSSVar("--maas-chart-color-3"),
    _getCSSVar("--maas-chart-color-4"),
    _getCSSVar("--maas-chart-color-5"),
]

const RAG_COLORS = [
    _getCSSVar("--maas-light-green"),
    _getCSSVar("--maas-green"),
    _getCSSVar("--maas-light-amber"),
    _getCSSVar("--maas-amber"),
    _getCSSVar("--maas-red")
]


function drawChart(id, col, data, labels, clickCallback) {
    const { type } = col
    if (type == "Risk" || type == "2X2" || type == "State Change")
        return createHeatMapChart(id, col, data, labels, clickCallback)

    if (type == "Data Table")
        return createTableChart(id, col, data, labels, clickCallback)

    if (type == "Note")
        return createMessageChart(id, col, data, labels, clickCallback)

    if (type == "Plan")
        return createTimelineChart(id, col, data, labels, clickCallback)

    if (type == "Trend OC" || type == "Trend") return createTrendChart(id, col, data, labels, clickCallback)

    return createBarChart(id, col, data, labels, clickCallback)
}

function updateChart(key, data, labels) {
    const { type } = $p.getColProperties(key)
    if (type == "Risk" || type == "2X2" || type == "State Change")
        return updateHeatMapChart(key, data, labels, "R5X5")

    if (type == "Data Table")
        return updateTableChart(key, data, labels)

    if (type == "Note")
        return updateMessageChart(key, data, labels)

    if (type == "Plan")
        return updateTimelineChart(key, data, labels)

    if (type == "Trend OC" || type == "Trend") return updateTrendChart(key, data, labels)

    updateBarChart(key, data, labels)
}
//////////////////////////////////////////////////////////////////////bar charts
function createBarChart(id, col, data, labels, clickCallback) {
    const { countType, title } = col
    //checkForInvalidChartData(title, labels, data)
    var options = {
        series: [{
            name: countType,//ol.countType,
            data: data,
        }],
        colors: CHART_COLORS,
        chart: {
            id: id,
            height: CHART_HEIGHT,
            fontFamily: FONT_FAMILY,
            //background: '#fff',

            type: 'bar',
            events: {
                click: function (event, chartContext, config) {
                    if (config.dataPointIndex >= 0)
                        clickCallback(id, config.config.xaxis.categories[config.dataPointIndex])
                    //else
                    //    console.log(event, chartContext, config, chartContext.el.id)  //clickCallback(id, null) //console.log(config) 
                    //console.log(config.dataPointIndex, config.config.xaxis.categories, config.globals.dom.baeEl)// The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
                }
            },
            toolbar: TOOLBAR,
        },
        plotOptions: {
            bar: {
                //borderRadius: 10,
                dataLabels: {
                    position: 'top', // top, center, bottom
                    style: {
                        colors: [_getCSSVar("--maas-primary-color-dark")],
                    }
                },
            }
        },
        dataLabels: {
            enabled: true,
            // formatter: function (val) { //<<<<<<<<<<<<<<param this
            //     return val + "%";
            // },
            offsetY: -20,
            style: {
                // fontSize: '12px',
                colors: [_getCSSVar("--maas-primary-color-dark")],

            }
        },

        xaxis: {
            categories: labels,
        },
        yaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
        },

        title: {
            text: title,//col.title,

        }
    }
    var chart = new ApexCharts(document.querySelector('#' + id), options)
    chart.render()
    return chart
}

function updateBarChart(key, data, labels) {
    const chart = getApexChart(getChartId(key))
    chart.updateSeries([{
        data: data
    }], true)
}
///////////////////////////////////////////////////////////////////////////////////////////////heatmap/risk
const dataLabelFormatter = function (countType, seriesIndex, dataPointIndex, data) {
    const xy = (dataPointIndex > 4 ? "?" : (dataPointIndex + 1)) + "|" + (seriesIndex > 4 ? "?" : (seriesIndex + 1))
    if (!data[xy]) return ""
    const value = $p.getDisplayValue(countType, data[xy])//amountToDisplay(countType, data[xy])
    return value == 0 ? "" : value
    // const { filteredCount, filteredSum } = data[xy]
    // if (countType == "Count") return filteredCount == 0 ? "" : filteredCount
    // if (countType == "Sum") return filteredSum == 0 ? "" : filteredSum
    // /* if (countType == "Average")  */
    // return filteredCount > 0 ? (filteredSum / filteredCount).toFixed(1) : ""
}
function getSeries2x2(countType, data) {//, xValues, yValues,) {
    function getXYValues(data) {
        const xValues = {}, yValues = {}
        for (const d in data) {
            const v = $p.getDisplayValue(countType, data[d])
            const values = d.split("|")
            xValues[values[0]] = v
            yValues[values[1]] = v
        }
        return { xValues: Object.keys(xValues).sort(), yValues: Object.keys(yValues).sort() }
    }
    function getColors(series) {
        let min, max
        const uniqueVals = new Set() //{}
        for (const s in series) {
            for (const d in series[s].data) {
                const v = series[s].data[d].y
                uniqueVals.add(Number(v))
            }
        }
        const uniqueValArrayUnsorted = Array.from(uniqueVals);

        const uniqueValArray = uniqueValArrayUnsorted.sort((a, b) => a - b)
        const uniqueValCount = uniqueValArray.length
        if (uniqueValCount == 0) return [{ from: 0, to: 1, color: RAG_COLORS[0] },] //name: "VL"
        min = uniqueValArray[0]
        max = uniqueValArray[uniqueValCount - 1]

        if (uniqueValCount == 1) return [{ from: min, to: max, color: RAG_COLORS[0] },] //name: "VL"

        if (uniqueValCount == 2)
            return [
                { from: min, to: min, color: RAG_COLORS[0], name: "Min" },
                { from: max, to: max, color: RAG_COLORS[1], name: "Max" },
            ]
        if (uniqueValCount == 3)
            return [
                { from: min, to: min, color: RAG_COLORS[0], name: "Min" },
                { from: uniqueValArray[1], to: uniqueValArray[1], color: RAG_COLORS[1], name: "M" },
                { from: max, to: max, color: RAG_COLORS[2], name: "Max" }
            ]
        if (uniqueValCount == 4)
            return [
                { from: min, to: min, color: RAG_COLORS[0], name: "Min" },
                { from: uniqueValArray[1], to: uniqueValArray[1], color: RAG_COLORS[1], name: "L" },
                { from: uniqueValArray[2], to: uniqueValArray[2], color: RAG_COLORS[2], name: "M" },
                { from: max, to: max, color: RAG_COLORS[3], name: "Max" },
            ]
        //partion the array in five equal chunks
        //console.assert(min == uniqueValArray[0], "min does not match")
        min = uniqueValArray[0]
        //console.assert(max == uniqueValArray[uniqueValCount - 1], "max does not match")
        max = uniqueValArray[uniqueValCount - 1]
        return [
            { from: min, to: min, color: RAG_COLORS[0], name: "Min" },
            { from: uniqueValArray[1], to: uniqueValArray[1], color: RAG_COLORS[1], name: "L" },
            { from: uniqueValArray[2], to: uniqueValArray[uniqueValCount - 3], color: RAG_COLORS[2], name: "M" },
            { from: uniqueValArray[uniqueValCount - 2], to: uniqueValArray[uniqueValCount - 2], color: RAG_COLORS[3], name: "H" },
            { from: max, to: max, color: RAG_COLORS[4], name: "Max" },
        ]
        //const delta = ((max - min) / uniqueValCount).toFixed(1) //uniqueValCount < 10 ? 1 : Number.parseInt(5 / uniqueValCount, 10)
        // return [
        //     { from: min - .001, to: min + 1 * delta, color: RAG_COLORS[0], name: "VL" },
        //     { from: min + 1 * delta, to: min + 2 * delta, color: RAG_COLORS[1], name: "L" },
        //     { from: min + 2 * delta, to: min + 3 * delta, color: RAG_COLORS[2], name: "M" },
        //     { from: min + 3 * delta, to: min + 4 * delta, color: RAG_COLORS[3], name: "H" },
        //     { from: min + 4 * delta, to: max + 0, color: RAG_COLORS[4], name: "VH" },
        // ]
    }
    const series = []
    const { xValues, yValues } = getXYValues(data)
    yValues.forEach((yVal) => {
        const dd = []
        xValues.forEach((xVal) => {
            const xCat = xVal + "|" + yVal
            const v = data[xCat] ? $p.getDisplayValue(countType, data[xCat]) : 0//amountToDisplay(countType, data[xCat]) : 0
            dd.push({ x: xVal, y: v })
        })
        series.push({ name: yVal, data: dd })
    })
    return { series, xValues, yValues, colors: getColors(series) }
}

function createHeatMapChart(id, col, data, labels, clickCallback) {//, riskType) {//id, risk, d, l) {
    //create series for risk
    function checkData(data) {
        let invalidData = false
        for (const key in data) {
            const values = key.split("|")
            if (values[0] == "?" || values[1] == "?") invalidData = true
        }
        return invalidData
    }

    function getRiskSeries(data, likelihoodValues, impactValues, colors) {

        const s = []
        const invalidValue = checkData(data)
        if (invalidValue) {
            impactValues.push("?")
            likelihoodValues.push("?")
            colors.push({ from: 26, to: 1000, color: "lightgray", name: "?" })
        }

        impactValues.forEach((iVal, iIndex) => {
            const dd = []
            likelihoodValues.forEach((lVal, lIndex) => {
                const v = (lIndex > 4 || iIndex > 4) ? 100 : (lIndex + 1) * (iIndex + 1)
                dd.push({ x: lVal, y: v })
            })
            s.push({ name: iVal, data: dd })
        })
        return s
    }

    const { type, countType, title } = col

    const options = {
        series: "TBC",
        chart: {
            id: id,
            height: CHART_HEIGHT,
            type: 'heatmap',
            fontFamily: FONT_FAMILY,
            toolbar: TOOLBAR,
        },
        stroke: {
            width: 0
        },
        plotOptions: {
            heatmap: {
                enableShades: false, //must keep this false to get the colors
                colorScale: { ranges: "TBC" },
            }
        },
        dataLabels:
        {
            enabled: true,
            formatter: "TBC"
        },
        xaxis: {
            type: 'category',
            categories: "TBC",
            title: { text: "TBC" }
        },
        yaxis: {
            title: { text: "TBC" },
        },
        tooltip: {
            enabled: false,
        },
        stroke: {
            width: 1
        },
        title: {
            text: title,
        },
        legend: { show: true },
    };
    //const dataLabels = { enabled: true }
    //const colorScale = {}

    if (type == "Risk") {
        const { impactValues, likelihoodValues } = col
        const colors = [
            { from: 1, to: 2, color: RAG_COLORS[0], name: "VL" }, //lightgreen
            { from: 3, to: 6, color: RAG_COLORS[1], name: "L" }, //green
            { from: 7, to: 14, color: RAG_COLORS[2], name: "M" }, //orange
            { from: 15, to: 19, color: RAG_COLORS[3], name: "H" }, //coral
            { from: 20, to: 25, color: RAG_COLORS[4], name: "VH" }, //red
        ]
        const series = getRiskSeries(data, likelihoodValues, impactValues, colors)
        //set TBCs in options
        options.series = series
        options.xaxis.categories = likelihoodValues
        options.xaxis.title.text = "Likelihood"
        options.yaxis.title.text = "Impact"
        options.plotOptions.heatmap.colorScale.ranges = colors
        options.dataLabels.formatter = function (val, opt) {
            return dataLabelFormatter(countType, opt.seriesIndex, opt.dataPointIndex, data)
        }
    }
    if (type == "2X2") {
        const { xCol, yCol } = col
        const { series, colors, xValues, yValues } = getSeries2x2(countType, data)
        //set TBCs in options
        options.series = series
        options.xaxis.categories = xValues
        options.xaxis.title.text = xCol
        options.yaxis.title.text = yCol
        options.plotOptions.heatmap.colorScale.ranges = colors
        delete options.dataLabels.formatter
    }
    if (type == "State Change") {
        const { toCol, fromCol } = col
        const dataSKIPremoved = JSON.parse(JSON.stringify(data))
        delete dataSKIPremoved["SKIP"]
        const { stateChangeCountType } = col
        const { series, colors, xValues, yValues } = getSeries2x2(stateChangeCountType, dataSKIPremoved)
        //set TBCs in options
        options.series = series
        options.xaxis.categories = xValues
        options.xaxis.title.text = toCol
        options.yaxis.title.text = fromCol
        options.plotOptions.heatmap.colorScale.ranges = colors
        delete options.dataLabels.formatter
    }

    const chart = new ApexCharts(document.querySelector('#' + id), options);
    chart.render();
    return chart

}

// function mapDataForHeatMap(data, labels) {
//     let heatMapData = {}
//     for (let i = 0; i < data.length; i++)
//         heatMapData[labels[i]] = data[i]
//     return heatMapData

// }

function updateHeatMapChart(key, data, labels, riskType) {
    const { type, countType } = $p.getColProperties(key)
    const chart = getApexChart(getChartId(key))
    if (!chart) return

    const options = {
        series: "TBC",
        plotOptions: {
            heatmap: {
                enableShades: false, //must keep this false to get the colors
                colorScale: {
                    ranges: "TBC"
                },
            }
        },
        dataLabels: {
            enabled: true,
            formatter: "TBC"
        }
    }
    if (type == "Risk") {
        delete options.series
        delete options.plotOptions.heatmap.colorScale
        options.dataLabels.formatter = function (val, opt) {
            return dataLabelFormatter(countType, opt.seriesIndex, opt.dataPointIndex, data)
        }
    }
    if (type == "2X2") {
        const { series, xValues, yValues, colors } = getSeries2x2(countType, data)
        options.series = series
        options.plotOptions.heatmap.colorScale.ranges = colors
        delete options.dataLabels.formatter
    }
    if (type == "State Change") {
        const dataSKIPremoved = JSON.parse(JSON.stringify(data))
        delete dataSKIPremoved["SKIP"]
        const { stateChangeCountType } = $p.getColProperties(key)
        const { series, colors, xValues, yValues } = getSeries2x2(stateChangeCountType, dataSKIPremoved)
        options.series = series
        options.plotOptions.heatmap.colorScale.ranges = colors
        delete options.dataLabels.formatter
    }

    chart.updateOptions(options, true)
}
////////////////////////////////////////////////////////Message
function createMessageChart(id, col, data, labels, clickCallback) {
    const key = getKey(id)
    const chartDiv = document.querySelector('#' + id,)
    const { title, message } = $p.getColProperties(key)

    chartDiv.innerHTML = ""
    chartDiv.innerHTML = `${title}<span style="float:right; cursor:pointer;" onclick="showChartMenus('${id}')">&#9776;</span>`

    //create wrapper
    const wrapper = document.createElement('div')
    wrapper.setAttribute("class", "w3-responsive w3-margin-top")

    wrapper.style.height = (CHART_HEIGHT * .95) + "px"
    wrapper.style.overflow = "auto"

    const msg = document.createElement('div')
    const lines = message.split("\n") //"xx lhjsdad soaioshis osihdoih ".split("\n") // message.split("\n") 
    lines.forEach(v => {
        const p = document.createElement('p')
        p.textContent = v
        msg.appendChild(p)
    })

    wrapper.appendChild(msg)
    chartDiv.appendChild(wrapper)
    return undefined
}

function updateMessageChart(key, data, labels) {
    createMessageChart(getChartId(key), undefined, data, labels)
}
//////////////////////////////////////////////////////Table
function createTableChart(id, col, data, labels, clickCallback) {
    const key = getKey(id)
    const chartDiv = document.querySelector('#' + id,)
    const { title, } = $p.getColProperties(key)

    chartDiv.innerHTML = ""
    chartDiv.innerHTML = `${title}<span style="float:right; cursor:pointer;" onclick="showChartMenus('${id}')">&#9776;</span>`

    //create table
    const tableWrapper = document.createElement('div')
    tableWrapper.setAttribute("class", "w3-responsive w3-margin-top")

    tableWrapper.style.height = (CHART_HEIGHT * .95) + "px"
    tableWrapper.style.overflow = "auto"

    const table = document.createElement('table')
    table.setAttribute("class", "maas-table") // w3-hoverable doesn't work, why?

    // table 
    //  tr header
    //      th
    //  tr rows
    //      td

    function newTableRow(row, tr, thd) {
        const trEelement = document.createElement(tr)
        row.forEach(v => {
            const thdElement = document.createElement(thd)
            thdElement.textContent = v
            trEelement.appendChild(thdElement)
        })
        return trEelement
    }
    //create Haeder
    const serialNoHeader = "#"
    const head = newTableRow([serialNoHeader, ...Object.keys(data[0])], 'tr', 'th')
    table.appendChild(head)
    //create entries
    labels.forEach((v, i) => {
        const serialNo = i + 1
        const row = newTableRow([serialNo, ...Object.values(data[i])], 'tr', 'td')
        table.appendChild(row)
    })

    tableWrapper.appendChild(table)
    chartDiv.appendChild(tableWrapper)
    return undefined
}

function updateTableChart(key, data, labels) {
    createTableChart(getChartId(key), undefined, data, labels)
}
/////////////////////////////////////////////////////////////////////createTimelineChart
function transformDataForPlan(dataIn) {
    let data = []

    Object.keys(dataIn).forEach(key => {
        data.push({
            x: key,
            y: [
                new Date(dataIn[key].start).getTime(),
                new Date(dataIn[key].end).getTime()
            ]
        })
    })

    return data
}

function createTimelineChart(id, col, data, labels, clickCallback) {

    const { title } = col
    const { reportDate } = $p.getConfig()
    const todaylabel = formatDate(reportDate, "DD-MMM")
    console.log(reportDate)
    //transform data
    const dataSeries = transformDataForPlan(data)

    const options = {
        series: [{ data: dataSeries }], //[{ data: data }],
        colors: CHART_COLORS,
        chart: {
            id: id,
            height: CHART_HEIGHT,
            fontFamily: FONT_FAMILY,
            type: 'rangeBar',
            toolbar: TOOLBAR,
        },
        plotOptions: {
            bar: {
                horizontal: true
            }
        },
        xaxis: {
            type: 'datetime',
            //min: new Date("01 Mar 2019").getTime(),
            //max: new Date("31 Mar 2019").getTime(),
        },
        title: {
            text: title,
        },
        yaxis: {
            show: false,
            // axisBorder: {
            //     show: false
            // },
            // axisTicks: {
            //     show: false,
            // },
        },
        dataLabels: {
            enabled: true,
            //textAnchor: 'start',
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] //+ ":  " + val
            },
            //offsetX: 0,
        },
        annotations: {
            xaxis: [
                {
                    x: new Date(reportDate).getTime(),//new Date('23 Nov 2017').getTime(),
                    borderColor: 'blue',//'#775DD0', 
                    label: {
                        //   style: {
                        //     color: '#fff',
                        //   },
                        orientation: 'horizontal',
                        text: todaylabel//'Report Date'
                    }
                }
            ]
        }
    };

    const chart = new ApexCharts(document.querySelector('#' + id), options);
    chart.render();
    return chart
}

function updateTimelineChart(key, data, labels) {

    const chart = getApexChart(getChartId(key))
    const dataSeries = transformDataForPlan(data)
    chart.updateSeries([{
        data: dataSeries // data
    }])
}
/////////////////////////////////////////////////////////////////////////////////// trends
//open close is add for each open and subtract for each close for that date
//need startdate for start of chart. now-start greater than 30 then weekly else daily 
//need a start number (default 0)
//plan straightline, sigmoid, plan-points  and target number
//
//forecast using x past data points and x% tolerance (10% assumed)
// function getDataTrendOC(countData, forecastDays, forecastFactors, plan) {
//     function createForecastData() {
//         function getForcastFactors() {
//             if (forecastFactors != "") {
//                 const { isValid, dates } = parseDateOpenClose(forecastFactors)
//                 if (!isValid) return
//                 const datesAsceding = Object.keys(dates).sort()
//                 //console.log(datesAsceding)
//                 datesAsceding.forEach(v => {
//                     const e = {}
//                     e[v] = { open: dates[v].open, close: dates[v].close }
//                     forecastchangepoints.push(e)
//                 })
//             }
//         }

//         const { open, close, forecastBasis } = countData.forecast
//         if (forecastBasis == 0) return
//         const forecast = []

//         // let dailyOpened = countData.forecast.basis > 0 ? (countData.forecast.open - countData.forecast.close) / countData.forecast.basis : 0
//         let dailyOpened = forecastBasis > 0 ? (open - close) / forecastBasis : 0
//         console.log(dailyOpened)
//         let forcastdate = reportDate
//         forecast.push({ x: forcastdate, y: opencount })
//         const forecastchangepoints = []
//         getForcastFactors()
//         console.log(forecastchangepoints)
//         //forecastchangepoints.push({ date: reportDate, dailyOpened: dailyOpened })

//         let prevdailyOpened = dailyOpened
//         for (let i = 0; i < forecastDays; i++) {
//             forcastdate = addDays(forcastdate, 1)
//             const index = forecastchangepoints.findIndex(v => Object.keys(v)[0] == forcastdate)
//             if (index != -1) {
//                 console.log(forecastchangepoints[index])
//                 const openfactor = forecastchangepoints[index][forcastdate].open
//                 const closefactor = forecastchangepoints[index][forcastdate].close
//                 dailyOpened = forecastBasis > 0 ? (open + openfactor - close - closefactor) / forecastBasis : 0
//                 console.log({ dailyOpened, forecastBasis, open, openfactor, close, closefactor })
//             }
//             //check if dailyOpened should change
//             opencount += dailyOpened
//             if (opencount < 0) {
//                 opencount = 0
//                 //dailyOpened = 0
//             }
//             if (dailyOpened != prevdailyOpened)
//                 forecast.push({ x: forcastdate, y: Math.round(opencount) })
//             prevdailyOpened = dailyOpened
//         }
//         forecast.push({ x: addDays(reportDate, forecastDays), y: Math.round(opencount) })

//         if (forecast.length == 0) return
//         returnValue.push({ name: "Forecast", data: forecast })
//     }
//     const { reportDate } = $p.getConfig()
//     const data = []
//     const labels = Object.keys(countData).sort()
//     let opencount = 0
//     //create data
//     for (let i = 0; i < labels.length - 1; i++) {
//         const v = labels[i]
//         if (v == "forecast") continue
//         if (v > reportDate) continue
//         opencount += countData[v].open - countData[v].close
//         data.push({ x: v, y: opencount })
//     }
//     if (data.length == 0) {
//         data.push({ x: reportDate, y: 0 })
//         return [{ name: "Open", data },]
//     }
//     const returnValue = []
//     returnValue.push({ name: "Open", data })
//     createForecastData()
//     return returnValue//[{ name: "Open", data }, { name: "Forecast", data: forecast }]
// }
function getDataTrend(type, countData, forecastDays, forecastFactors, plan) {
    function createForecastData() {
        function getForcastFactors() {
            if (forecastFactors == "") return []
            // if (forecastFactors != "") {
            const grammar = type == "Trend OC" ? TRENDOC_FORECAST_GRAMMAR : TREND_FORECAST_GRAMMAR
            const { isValid, output } = parseInput(forecastFactors, grammar) //parseDateOpenClose(forecastFactors)
            console.assert(isValid, `Type: ${type}, grammar: ${grammar}`)
            if (!isValid) return []

            const datesAsceding = []
            const { open, close, count, from } = output
            const e = {}
            e[from] = { open, close, count }
            datesAsceding.push(e)

            // allow for multiple dates alter
            // const datesAsceding = Object.keys(dates).sort() 
            // datesAsceding.forEach(v => {
            //     const e = {}
            //     e[v] = { open: dates[v].open, close: dates[v].close }
            //     forecastchangepoints.push(e)
            // })
            return datesAsceding
        }
        const { open, close, count, forecastBasis } = countData.forecast

        if (forecastBasis == 0) return
        if (!countData.forecast) return

        const forecastdata = []

        let daily = 0
        if (type == "Trend OC")
            daily = forecastBasis > 0 ? (open - close) / forecastBasis : 0
        else
            daily = forecastBasis > 0 ? count / forecastBasis : 0

        let forcastdate = reportDate
        forecastdata.push({ x: forcastdate, y: cumulativeCount })
        const forecastchangepoints = getForcastFactors()

        let prevdaily = daily
        for (let i = 0; i < forecastDays; i++) {
            forcastdate = addDays(forcastdate, 1)
            const index = forecastchangepoints.findIndex(v => Object.keys(v)[0] == forcastdate)
            if (index != -1) {
                if (type == "Trend OC") {
                    const openfactor = forecastchangepoints[index][forcastdate].open
                    const closefactor = forecastchangepoints[index][forcastdate].close
                    daily = forecastBasis > 0 ? (open + openfactor - close - closefactor) / forecastBasis : 0

                } else {
                    const factor = forecastchangepoints[index][forcastdate].count
                    daily = forecastBasis > 0 ? (count * factor) / forecastBasis : 0
                }
            }

            cumulativeCount += daily
            if (cumulativeCount < 0) cumulativeCount = 0

            if (daily != prevdaily)
                forecastdata.push({ x: forcastdate, y: Math.round(cumulativeCount) })
            prevdaily = daily
        }
        forecastdata.push({ x: addDays(reportDate, forecastDays), y: Math.round(cumulativeCount) })
        returnValue.push({ name: "Forecast", data: forecastdata })
    }
    function createPlanData() {
        if (!plan) return
        if (plan.trim() == "") return

        const { isValid, error, output } = parseInput(plan, PLAN_GRAMMAR)
        if (!isValid) {
            console.assert(true, error)
            return
        }
        const { start, end, scopefrom, scopeto, points } = output
        const data = []
        const deltaScope = scopeto - scopefrom
        const dateSteps = dateTimeDiff(start, end, "Days") / points.length
        for (let i = 0; i < points.length; i++) {
            const x = addDays(start, Math.round(i * dateSteps))
            const y = Math.round(scopefrom + deltaScope * points[i])
            data.push({ x, y })
        }
        console.log(data, points, points.length)
        returnValue.push({ name: "Plan", data })
    }

    const { reportDate } = $p.getConfig()
    const data = []
    const labels = Object.keys(countData).sort()
    const returnValue = []
    let cumulativeCount = 0
    //create data
    for (let i = 0; i < labels.length - 1; i++) {
        const v = labels[i]
        if (v == "forecast") continue
        if (v > reportDate) continue
        if (type == "Trend OC")
            cumulativeCount += countData[v].open - countData[v].close
        else
            cumulativeCount += countData[v].count

        data.push({ x: v, y: cumulativeCount })
    }
    const name = type == "Trend OC" ? "Open" : "Trend"

    if (data.length == 0) {
        data.push({ x: reportDate, y: 0 })
        return [{ name, data },] //return [{ name: "Open", data },]
    }

    returnValue.push({ name, data })
    createForecastData()
    createPlanData()
    return returnValue
}
function createTrendChart(id, col, countData, xl) {

    const { countType, title, forecastDays, forecastFactors, type, plan } = col
    const { reportDate } = $p.getConfig()
    const series = getDataTrend(type, countData, forecastDays, forecastFactors, plan)
    
    var options = {
        series: series,
        colors: CHART_COLORS,
        chart: {
            id: id,
            height: CHART_HEIGHT,
            fontFamily: FONT_FAMILY,
            type: 'line',
            zoom: {
                enabled: false
            },
            toolbar: TOOLBAR,
        },
        stroke: {
            width: [3, 2, 2],
            // curve: ['straight','smooth', 'smooth'],
            dashArray: [0, 1, 1]
        },
        dataLabels: {
            enabled: false
        },
        // stroke: {
        //     curve: 'straight'
        // },
        title: {
            text: title,
            align: 'left'
        },
        // grid: {
        //     row: {
        //         colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        //         opacity: 0.5
        //     },
        // },
        xaxis: {
            type: "datetime",
            //categories: labels,
        }
    };

    var chart = new ApexCharts(document.querySelector('#' + id,), options);
    chart.render();
}

function updateTrendChart(key, countData, labels) {
    const chart = getApexChart(getChartId(key))
    const { type, forecastDays, forecastFactors, plan } = $p.getColProperties(key)

    const series = getDataTrend(type, countData, forecastDays, forecastFactors, plan)
    
    chart.updateOptions({
        series: series,
    })

}
/////////////////////////////////////////// Apex chart functions
function destroyApexCharts() {
    if (!Apex._chartInstances) return

    const chartList = []
    Apex._chartInstances.forEach(v => {
        chartList.push(v.id)
    })
    chartList.forEach(v => {
        ApexCharts.exec(v, 'destroy')
    })
}

function getApexChart(chartId) {
    const c = Apex._chartInstances.find(v => v.id == chartId)
    return c ? c.chart : undefined
}

function getApexChartCategories(chartId) {
    const chart = getApexChart(chartId)
    return chart ? chart.opts.xaxis.categories : undefined
}