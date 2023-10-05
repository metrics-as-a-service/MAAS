
const $demo = (function () {
    'use strict'
    let $ = {}

    const INTRODUCTION =
        `Charts in the demo have been created using the metrics-as-service App.
        The App takes a CSV file as input and creates charts that can be sliced and diced for analysis. You can click on the bar charts to filter (i.e. slice and dice) the data.
        The charts can customised using the menu located at top right of each chart. In this demo you can modify the charts but not save the modifications. 
        The data used is atrificial but created based on experince and is represtative of the real world`

    const INTRODUCTION_TO_DEMO =
        `Following demos are available::
        1. Basic.  This demos shows the 'default' metrics i.e before any configuration.  More on the basic in the next note.
        2. Modified Basic.  This demo shows how the 'default' is reconfigured to make better metrics.
        3. Test Execution. This demos shows typical test execution metrics.  
        4. State Change. This demos shows how state changes can be converted to useful metrics.  
        5. Risk. This demos shows standard 5x5 risk metrics.     
        6. Plan. This demos shows a plan that can be easily sliced and diced.`

    const INTRODUCTION_TO_BASIC =
        `As menitionef before the "Basic" demo hows the metrics before any configuration.
        Based on the input the App automatically generates the following metrices:
        1. A note listing all headers found in the input.  
        2 ... N. A set of "bar charts", one for each of the header found
        N+1. A data table shoing first 10 rows of the data read    
        N+2. A data description that shows types of data, max, min etc for each row of data
        The basic chart can then be configured in varous ways as shown in the demos`


    const demoConfigs = {
        "Introduction": {
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "Introduction to Metrics as as Service",
                "maxValues": 30,
                "file": {},
                "colNames": ["Notes",],
                "colTypes": ["String",],
                "callouts": [],
                "cols": [
                    { "title": "INTRODUCTION", "type": "Note", "chartSize": "Small", "message": INTRODUCTION },
                    { "title": "DEMO CHARTS", "type": "Note", "chartSize": "Small", "message": INTRODUCTION_TO_DEMO },
                    { "title": "BASIC", "type": "Note", "chartSize": "Small", "message": INTRODUCTION_TO_BASIC },
                ]
            },  
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/notes.csv",
        },
        "Basic": {
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "Auto-generated Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "CREATE DATE", "STATUS", "PRIORITY", "GEORAPHY", "CLOSE DATE", "AGE", "Description"],
                "colTypes": ["String", "Date", "String", "String", "String", "String", "Number", "String"],
                "callouts": [],
                "cols": [
                    { "title": "AUTO GENERATED NOTE", "type": "Note", "chartSize": "Small", "message": "The input has the following data headers (value in bracket indicates type assumed):\n1. ID (String)\n2. CREATE DATE (Date)\n3. STATUS (String)\n4. PRIORITY (String)\n5. GEORAPHY (String)\n6. CLOSE DATE (String)\n7. AGE (Number)\n8. Description (String)" },
                    { "title": "COUNT BY ID", "autoTitle": false, "chartSize": "Small", "colname": "ID", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY CREATE DATE", "autoTitle": false, "chartSize": "Small", "colname": "CREATE DATE", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "title": "COUNT BY STATUS", "autoTitle": false, "chartSize": "Small", "colname": "STATUS", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY PRIORITY", "autoTitle": false, "chartSize": "Small", "colname": "PRIORITY", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY GEORAPHY", "autoTitle": false, "chartSize": "Small", "colname": "GEORAPHY", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY CLOSE DATE", "autoTitle": false, "chartSize": "Small", "colname": "CLOSE DATE", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY AGE", "autoTitle": false, "chartSize": "Small", "colname": "AGE", "countif": "", "countType": "Count", "autoType": "Number", "type": "Number" },
                    { "title": "COUNT BY DESCRIPTION", "autoTitle": false, "chartSize": "Small", "colname": "Description", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "col": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Small", "maxEntries": 10 },
                    { "col": "ID", "title": "DATA DESCRIPTION", "autoType": "String", "type": "Data Description", "countType": "Count", "chartSize": "Small" }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/incidents.csv",
        },
        "Modified Basic": {
            config: {
                "reportDate": "2023-06-15",
                "reportTitle": "Modified Auto-generated Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "CREATE DATE", "STATUS", "PRIORITY", "GEORAPHY", "CLOSE DATE", "AGE", "Description"],
                "colTypes": ["String", "Date", "String", "String", "String", "String", "Number", "String"],
                "callouts": [],
                "cols": [
                    { "title": "INTRODUCTION", "type": "Note", "chartSize": "Small", "message": "The is a modied verion of the Basic Demo.\nIn this version:\nThis INTRODUCTION is added to summarise the changes,\nchart showing data on ID has been removed as it does not provide any insight\nfurthers notes are added where changes are made." },
                    // { "title": "COUNT BY ID", "autoTitle": false, "chartSize": "Small", "colname": "ID", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY CREATE DATE", "autoTitle": false, "chartSize": "Small", "colname": "CREATE DATE", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "title": "STATUS ORDER", "type": "Note", "chartSize": "Small", "message": "The default chart showed the x-axis in default asceding order (Closed, New, WIP). Order values are added to display the status in more logical sequence." },
                    { "title": "COUNT BY STATUS", "autoTitle": false, "chartSize": "Small", "colname": "STATUS", "countif": "", "countType": "Count", "autoType": "String", "type": "String", "order": ["New", "WIP", "Closed"] },
                    { "title": "COUNT BY PRIORITY", "autoTitle": false, "chartSize": "Small", "colname": "PRIORITY", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY GEORAPHY", "autoTitle": false, "chartSize": "Small", "colname": "GEORAPHY", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY CLOSE DATE", "autoTitle": false, "chartSize": "Small", "colname": "CLOSE DATE", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "BIN", "type": "Note", "chartSize": "Small", "message": "Bin values are added to the next chart which improves its readibility." },
                    { "title": "COUNT BY AGE", "autoTitle": false, "chartSize": "Small", "colname": "AGE", "countif": "", "countType": "Count", "autoType": "Number", "type": "Number", "bin": [1, 10, 20, 30, 40] },
                    // { "title": "COUNT BY DESCRIPTION", "autoTitle": false, "chartSize": "Small", "colname": "Description", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "col": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Small", "maxEntries": 10 },
                    { "col": "ID", "title": "DATA DESCRIPTION", "autoType": "String", "type": "Data Description", "countType": "Count", "chartSize": "Small" }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/incidents.csv",
        },
        "Risk": {
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "Risk Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "CREATE DATE", "STATUS", "Type", "GEORAPHY", "CLOSE DATE", "AGE", "Description", "Impact", "Likelihood", "Target Date"],
                "colTypes": ["String", "Date", "String", "String", "String", "String", "Number", "String", "Number", "Number", "Date"],
                "callouts": [],
                "cols": [
                    { "title": "INTRODUCTION", "type": "Note", "chartSize": "Small", "message": "This demo shows metrics on risk.\nThe charts can be easily configured to prsent a 5x5 view of data." },
                    { "title": "RISK COUNT", "autoTitle": false, "chartSize": "Small", "countif": "", "countType": "Count", "type": "Risk", "colOver": "", "impactCol": "Impact", "impactValues": ["Very Low", "Low", "Medium", "High", "Very High"], "likelihoodCol": "Likelihood", "likelihoodValues": ["Rare", "Unlikely", "Likely", "Very Likely", "Most Likely"] },
                    { "title": "RISK (AV AGE)", "autoTitle": false, "chartSize": "Small", "countif": "", "countType": "Average", "type": "Risk", "colOver": "AGE", "impactCol": "Impact", "impactValues": ["Very Low", "Low", "Medium", "High", "Very High"], "likelihoodCol": "Likelihood", "likelihoodValues": ["Rare", "Unlikely", "Likely", "Very Likely", "Most Likely"] },
                    { "title": "TREND USING OPEN/CLOSE DATES", "autoTitle": false, "chartSize": "Small", "countif": "", "type": "Trend OC", "trendStartDate": "2023-01-04", "openDateCol": "CREATE DATE", "closeDateCol": "CLOSE DATE", "forecast": "" },
                    { "title": "COUNT BY TARGET DATE", "autoTitle": false, "chartSize": "Small", "colname": "Target Date", "countif": "", "countType": "Count", "type": "Date", "dateFormat": "W-4+4", "colOver": "" },
                    { "title": "COUNT BY STATUS", "autoTitle": false, "chartSize": "Small", "colname": "STATUS", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY TYPE", "autoTitle": false, "chartSize": "Small", "colname": "Type", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "COUNT BY GEORAPHY", "autoTitle": false, "chartSize": "Small", "colname": "GEORAPHY", "countif": "", "countType": "Count", "autoType": "String", "type": "String" },
                    { "title": "BINNED COUNT BY AGE", "autoTitle": false, "chartSize": "Small", "colname": "AGE", "countif": "", "type": "Number", "bin": [5, 10, 20, 30, 40] },
                    { "title": "COUNT BY IMPACT", "autoTitle": false, "chartSize": "Small", "colname": "Impact", "countif": "", "type": "Number" },
                    { "title": "COUNT BY LIKELIHOOD", "autoTitle": false, "chartSize": "Small", "colname": "Likelihood", "countif": "", "type": "Number" },
                    { "col": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Small", "maxEntries": 10 },
                    { "col": "ID", "title": "DATA DESCRIPTION", "autoType": "String", "type": "Data Description", "countType": "Count", "chartSize": "Small" }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/risks.csv",
        },
        "Plan": { //final
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "Plan Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["Level", "Desc", "Start", "End", "Criitical", "Actual start", "Actual/estimated end", "Responsibility"],
                "colTypes": ["Number", "String", "Date", "Date", "String", "Date", "Date", "String"],
                "callouts": [],
                "cols": [
                    // { "colname": "", "title": "INTRODUCTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small",  "order": [], "message": INTRODUCTION },
                    { "colname": "Priority", "title": "INTRODUCTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "order": [], "message": "This demo shows the data on \"plan\"\nCharts 2 and 3 shows the plan.  Renaining charts show other attributes of the plan.  Click on these bar charts to see how the display for the plan changes.\nThese charts are useful in identifying possible areas of the plan that needs attention." },
                    { "title": "LEVEL 1 PLAN", "autoTitle": false, "chartSize": "Medium", "countif": "includeif level contains [1]", "type": "Plan", "descriptionCol": "Desc", "startDateCol": "Start", "endDateCol": "End", "actualStartDateCol": "Actual start", "actualEndDateCol": "Actual/estimated end" },
                    { "title": "OVERall PLAN", "autoTitle": false, "chartSize": "Medium", "countif": "", "type": "Plan", "descriptionCol": "Desc", "startDateCol": "Start", "endDateCol": "End", "actualStartDateCol": "Actual start", "actualEndDateCol": "Actual/estimated end" },
                    { "title": "COUNT BY LEVEL", "autoTitle": false, "chartSize": "Small", "colname": "Level", "countif": "", "countType": "Count", "autoType": "Number", "type": "Number" },
                    { "title": "COUNT BY CRIITICAL", "autoTitle": false, "chartSize": "Small", "colname": "Criitical", "countif": "", "countType": "Count", "type": "String", "colOver": "", "order": [] },
                    { "title": "COUNT BY RESPONSIBILITY", "autoTitle": false, "chartSize": "Small", "colname": "Responsibility", "countif": "", "countType": "Count", "type": "String", "colOver": "", "order": [] },
                    { "title": "COUNT BY START", "autoTitle": false, "chartSize": "Small", "colname": "Start", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "title": "COUNT BY END", "autoTitle": false, "chartSize": "Small", "colname": "End", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "title": "COUNT BY ACTUAL START", "autoTitle": false, "chartSize": "Small", "colname": "Actual start", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "title": "COUNT BY ACTUAL/ESTIMATED END", "autoTitle": false, "chartSize": "Small", "colname": "Actual/estimated end", "countif": "", "countType": "Count", "autoType": "Date", "type": "Date", "dateFormat": "MMM" },
                    { "col": "Level", "title": "DATA TABLE", "autoType": "Number", "type": "Data Table", "countType": "Count", "chartSize": "Small", "maxEntries": 10 },
                    { "col": "Level", "title": "DATA DESCRIPTION", "autoType": "Number", "type": "Data Description", "countType": "Count", "chartSize": "Small" }
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/plan.csv",
        },

        "State Change": { //final
            config: {
                "reportDate": "2023-08-01",
                "reportTitle": "State Change Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "When", "From", "To", "Priority", "Responsibilty"],
                "colTypes": ["String", "Date", "String", "String", "String", "String"],
                "cols": [
                    // { "colname": "", "title": "INTRODUCTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small",  "order": [], "message": "This is a metrics-as-as-service demo.\nThese charts have been created using the metrics-as-service App that takes a CSV file and creates charts that can be sliced and diced for analysis. You can click on the bar charts to filter (i.e. slice and dice) the data.\nThe charts can customised using the menu located at top right of each chart. In this demo you can modify the charts. Since this is demo the modifications cannot be saved\nThe data used is atrificial but created based on experince and is represtative of the real world" },
                    // { "colname": "", "title": "INTRODUCTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small",  "order": [], "message": INTRODUCTION },
                    { "colname": "Priority", "title": "NOTE ON STATE CHANGE", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "order": [], "message": "This specific demo shows the data on \"state change\"\nChart 3 shows the number of transitions in status items (typically defects or incidents or stories).  Charts 4 and 5 show the data in total and average duration.\nThese charts are useful in identifying possible areas of improvements. It may be worth considering actions to reduce the average durations where they are high.\nThe last chart shows the data in a table." },
                    { "colname": "ID", "title": "COUNT OF TRANSITIONS", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "stateChangeCountType": "Count of Transitions", "idCol": "ID", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "ID", "title": "SUM OF TRANSITION DURATION", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "stateChangeCountType": "Sum of Transition Duration", "idCol": "ID", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "ID", "title": "AVERAGE OF TRANSITION DURATION", "autoType": "String", "type": "State Change", "countType": "Count", "chartSize": "Small", "stateChangeCountType": "Average of Transition Duration", "idCol": "ID", "toCol": "To", "fromCol": "From", "timestampCol": "When" },
                    { "colname": "Priority", "title": "COUNT BY PRIORITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small", "order": [] },
                    { "colname": "Responsibilty", "title": "COUNT BY RESPONSIBILTY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small", "order": [] },
                    { "colname": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Medium", "maxEntries": 10, },
                    { "colname": "ID", "title": "DATA DESCRIPTION", "autoType": "String", "type": "Data Description", "countType": "Count", "chartSize": "Medium", },
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/statuschange.csv",
        },
        "Test Execution": { //final
            config: {
                "reportDate": "2023-08-07",
                "reportTitle": "Test Execution Metrics",
                "maxValues": 30,
                "file": {},
                "colNames": ["ID", "Create Date", "Execution Date", "STATUS", "PRIORITY", "Responsibility", "Description", "Linked Defects"],
                "colTypes": ["String", "Date", "Date", "String", "String", "String", "String", "String"],
                "callouts": [], "validations": [],
                "cols": [
                    // { "colname": "", "title": "INTRODUCTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small",  "order": [], "message": INTRODUCTION },
                    { "colname": "ID", "title": "NOTE ON TEST EXECUTION", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "autoTitle": false, "message": "This specific demo is on Test Execution.\nThe next two charts show the trend for test creation and test execution. Both charts show a planned line which can be customised.  The plan shows that while the Trest Creation was done ahead of plan, the Test Execution is behind.\nThe Test Execution trend chart also has forecast which shows that unless the pace of execution is increased the plan is likely to be missed.\nAt current pace the scope will complete about 6 weeks late." },
                    { "colname": "Create Date", "title": "TEST CREATION TREND", "autoType": "Date", "type": "Trend", "countType": "Count", "chartSize": "Medium", "dateFormat": "MMM", "autoTitle": false, "plan": "start 2023-02-01 end 2023-06-27 scopeto 1008 points [0, 1]", "dateCol": "Create Date", "countif": "", "trendStartDate": "2023-01-14", "forecast": "" },
                    { "colname": "Execution Date", "title": "TEST EXECUTION TREND (FORECAST BASED ON PAST 2 WEEKS)", "autoType": "Date", "type": "Trend", "countType": "Count", "chartSize": "Medium", "dateFormat": "MMM", "autoTitle": false, "plan": "start 2023-05-01 end 2023-09-01 scopeto 1008 points [0, 0.02, 0.05, 0.12, 0.27, 0.5, 0.73, 0.88, 0.95, 0.98, 1]", "dateCol": "Execution Date", "countif": "includeif status contains [pass, fail]", "trendStartDate": "2023-01-14", "forecast": "basisdays 14 forecastDays 65" },
                    { "colname": "Description", "title": "NOTE ON PLAN", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "autoTitle": false, "message": "A planned line makes the metrics actionable.\nThe plan line is easily configurable.\nNote that the plan is a straight line in Chart 2 while Chart 3 has a plan based on sigmoid function (which sounds fancy but often test execution follow this path: slow start due to team/ infratsucture build up, rapid middle and slow end where difficult defects are fixed)." },
                    { "colname": "Description", "title": "NOTE ON FORECAST", "autoType": "String", "type": "Note", "countType": "Count", "chartSize": "Small", "autoTitle": false, "message": "In the next chart the forecast is changed to use executions from past week. This shows that forecast is much nearer the plan than before. \nIt can also be concluded that if the pace of excution is slightly increased  then plan could be met. " },
                    { "colname": "Execution Date", "title": "TEST EXECUTION TREND (FORECAST BASED ON PAST WEEK)", "autoType": "Date", "type": "Trend", "countType": "Count", "chartSize": "Medium", "dateFormat": "MMM", "autoTitle": false, "plan": "start 2023-05-01 end 2023-09-01 scopeto 1008 points [0, 0.02, 0.05, 0.12, 0.27, 0.5, 0.73, 0.88, 0.95, 0.98, 1]", "dateCol": "Execution Date", "countif": "includeif status contains [pass, fail]", "trendStartDate": "2023-01-14", "forecast": "basisdays 7 forecastDays 35" },
                    { "colname": "Linked Defects", "title": "COUNT OF SCRIPTS BY LINKED DEFECTS", "autoType": "String", "type": "List Count", "countType": "Count", "chartSize": "Small", "autoTitle": false, "separator": "," },
                    { "colname": "Linked Defects", "title": "COUNT OF DEFECTS IN LINKED DEFECTS", "autoType": "String", "type": "List Members", "countType": "Count", "chartSize": "Small", "autoTitle": false, "separator": "," },
                    { "colname": "STATUS", "title": "COUNT BY STATUS", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "PRIORITY", "title": "COUNT BY PRIORITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "Responsibility", "title": "COUNT BY RESPONSIBILITY", "autoType": "String", "type": "String", "countType": "Count", "chartSize": "Small" },
                    { "colname": "ID", "title": "DATA TABLE", "autoType": "String", "type": "Data Table", "countType": "Count", "chartSize": "Medium", "maxEntries": 10, },
                    { "colname": "ID", "title": "DATA DESCRIPTION", "autoType": "String", "type": "Data Description", "countType": "Count", "chartSize": "Medium", },
                ]
            },
            file: "https://raw.githubusercontent.com/abhijitmajumdar2020/MAAS/main/datafiles/testexecution.csv",

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