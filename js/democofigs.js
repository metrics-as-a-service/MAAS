const mycolors = {
    3: ["#ece7f2", "#a6bddb", "#2b8cbe"],
    4: ["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0"],
    5: ["#f1eef6", "#bdc9e1", "#74a9cf", "#2b8cbe", "#045a8d"],
    6: ["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#2b8cbe", "#045a8d"],
    7: ["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"],
    8: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"],
    9: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"]
}
const $demo = (function () {
    'use strict'
    let $ = {}


    const demoConfigs = {
        "Incidents": {
            config: "{\"reportDate\":\"2023-07-24\",\"reportTitle\":\"Incidents Metrics\",\"maxValues\":30,\"file\":{},\"cols\":[{\"col\":\"ID\",\"title\":\"Count by ID\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"CREATE DATE\",\"title\":\"Count by CREATE DATE\",\"autoType\":\"MMM\",\"type\":\"MMM\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"STATUS\",\"title\":\"Count by STATUS\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"PRIORITY\",\"title\":\"Count by PRIORITY\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"GEORAPHY\",\"title\":\"Count by GEORAPHY\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"CLOSE DATE\",\"title\":\"Count by CLOSE DATE\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"AGE\",\"title\":\"Count by AGE\",\"autoType\":\"Number\",\"type\":\"Number\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"Description\",\"title\":\"Count by Description\",\"autoType\":\"String\",\"type\":\"String\",\"countType\":\"Count\",\"chartSize\":\"Small\"},{\"col\":\"ID\",\"title\":\"Data Table\",\"autoType\":\"String\",\"type\":\"Data Table\",\"countType\":\"Count\",\"chartSize\":\"Medium\",\"maxEntries\":10}],\"colNames\":[\"ID\",\"CREATE DATE\",\"STATUS\",\"PRIORITY\",\"GEORAPHY\",\"CLOSE DATE\",\"AGE\",\"Description\",\"ID\"]}",
            file: "https://github.com/abhijitmajumdar2020/Test/blob/master/DM/DEFECT.csv",
        },
        "Risk": {

        },
        "Test Excution": {
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "Auto-generated Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "Create Date", "Execution Date", "STATUS", "PRIORITY", "Responsibility", "Description", "Linked Defects"],
                "colTypes": ["String", "Date", "Date", "String", "String", "String", "String", "String"],
                "callouts": [],
                "validations": [],
                "cols": [
                    { "colname": "ID", "title": "COUNT BY ID", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "Create Date", "title": "COUNT BY CREATE DATE", "autoType": "Date", "type": "Date", "countType": "Count", "chartSize": "Small", "dateFormat": "MMM" },
                    { "colname": "Create Date", "title": "TREND (CREATE DATE)", "autoType": "Date", "type": "Trend", "countType": "Count", "chartSize": "Small", "dateFormat": "MMM", "position": "3", "autoTitle": true, "plan": "", "dateCol": "Create Date", "countCol": "", "countValues": "", "trendStartDate": "2023-01-04", "forecastDays": 28, "forecastBasis": 14, "forecastFactors": "" },
                    { "colname": "Execution Date", "title": "TREND (STATUS OVER EXECUTION DATE)", "autoType": "Date", "type": "Trend", "countType": "Count", "chartSize": "Small", "dateFormat": "MMM", "position": "3", "autoTitle": true, "plan": "start 21-Apr-23 end 12-Nov-23 scopeto 1008 points (0 .1 .5 1)", "dateCol": "Execution Date", "countCol": "STATUS", "countValues": "pass fail", "trendStartDate": "2023-01-27", "forecastDays": 28, "forecastBasis": 14, "forecastFactors": "" },
                    { "colname": "STATUS", "title": "COUNT BY STATUS", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "colname": "PRIORITY", "title": "COUNT BY PRIORITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "Responsibility", "title": "COUNT BY RESPONSIBILITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "Description", "title": "COUNT BY DESCRIPTION", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "Linked Defects", "title": "COUNT BY LINKED DEFECTS", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "col": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Medium", "maxEntries": 10 }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/testexction.csv",

        },
        "Defects": {

        },
        "State Change": {
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "State Change Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "When", "From", "To", "Priority", "Responsibilty"],
                "colTypes": ["String", "Date", "String", "String", "String", "String"],
                "cols": [
                    { "colname": "Priority", "title": "NOTE", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "position": "1", "order": [], "message": "This demo shows the data on \"state change\"\nChart 2 shows the number of transitions in status items (typically defects or incidents or stories).  Charts 3 and 4 show the data in total and average duration.\nThese charts are useful in identifying possible areas of improvements. It may be worth considering actions to reduce the average durations where they are high.\nClick on the bar charts to filter the data.\nThe last chart shows the data in a table.\nThe data  used here is realistic but made-up" },
                    { "colname": "ID", "title": "COUNT OF TRANSITIONS", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "position": "2", "stateChangeCountType": "Count of Transitions", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "ID", "title": "SUM OF TRANSITION DURATION", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "position": "3", "stateChangeCountType": "Sum of Transition Duration", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "ID", "title": "AVERAGE OF TRANSITION DURATION", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "position": "4", "stateChangeCountType": "Average of Transition Duration", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "Priority", "title": "COUNT BY PRIORITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small", "position": "5", "order": [] },
                    { "colname": "Responsibilty", "title": "COUNT BY RESPONSIBILTY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small", "position": "6", "order": [] },
                    { "colname": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Medium", "maxEntries": 10, "position": "7" }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/statuschange.csv",
        },
        "Test Execution": {
            config: { "reportDate": "2023-08-02", "reportTitle": "Auto-generated Metrics", "maxValues": 30, "file": {}, "colNames": ["ID", "When", "From", "To", "Priority", "Responsibilty"], "colTypes": ["String", "Date", "String", "String", "String", "String"], "cols": [{ "col": "ID", "title": "Count by ID", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "col": "When", "title": "Count by When", "autoType": "Date", "type": "Date", "countType": "Count", "chartSize": "Small", "dateFormat": "MMM" }, { "col": "From", "title": "Count by From", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "col": "To", "title": "Count by To", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "col": "Priority", "title": "Count by Priority", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "col": "Responsibilty", "title": "Count by Responsibilty", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" }, { "col": "ID", "title": "Data Table", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Medium", "maxEntries": 10 }] }


        },
    }
    // $.getFile = function (type) {
    //     if (!type) return
    //     if (!demoConfigs[type]) return
    //     //const file = demoConfigs[type].file
    //     return demoConfigs[type].file
    // }
    $.getConfigJSON = function (type) {
        if (!type) {
            $l.log(`Type: "${type}" incorrectr`, "Error")
            return
        }
        if (!demoConfigs[type]) {
            $l.log(`Config missing`, "Error")
            return
        }
        let config = demoConfigs[type].config
        if (!config) {
            $l.log(`Config missing`, "Error")
            return
        }
        const filename = demoConfigs[type].file
        if (!filename) {
            $l.log(`File name missing`, "Error")
            return
        }

        try {
            const { reportDate } = config

            if (!reportDate) {
                $l.log(`reportDate missing`, "Error")
                return
            }
            if (!isValidDate(reportDate)) {
                $l.log(`reportDate invalid ("${reportDate}")`, "Error")
                return
            }
            const today = new Date().toISOString().substring(0, 10)
            const daysToAdd = dateTimeDiff(reportDate, today, "Days")

            const datepattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g //pattern for date YYYY-MM-DD
            let configString = JSON.stringify(config)
            configString = configString.replace(datepattern, date => addDays(date, daysToAdd))
            const x = JSON.parse(configString)
            return { configString, reportDate, filename }
        } catch (e) {
            const msg = `Error in $.getConfigJSON. Type: "${type}" Error: ${e}`
            $l.log(msg, "Error")
            console.assert(false, msg)
            return
        }
    }
    return $
}())

function testDemo() {
    const json = $demo.getConfigJSON("Incidents")
    console.log(JSON.parse(json))

}