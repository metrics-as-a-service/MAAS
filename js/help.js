const HELP_TEXT = [
    {
        header: "What is metrics-as-a-service App?",
        details: [
            "metrics-as-a-service App (MAAS App) is a highly configurable app that speeds up implementation of consistent, professional, and proven metrics for your IT projects.",
            "The App is based on years of experience of successfully delivering many types of projects, some $100m in size. The principles learnt from this experience is embedded in the App thereby significantly improving the chances of successful delivery of projects.",
            "The App is highly configurable; the first outputs are available in minutes. The tool does not any require specialist skills, equipment or software other than an intenet connection and the App. It allows the data held in the collaborative tools (such as Jira, DevOps, Service Now, HP/QC, and good old excel) to be the single source of truth. All stakeholders from execs to PMs to developers/testers use same data to make decisions."
        ]
    },
    {
        header: "How to use the App?",
        details: [
            "The main menu on the top shows the following options:",
            "<b>Load Data</b> allows you to load fresh data. When data is loaded first time a config created automatically. You can modify these configs as described in the following sections. The input data is expected as a csv (comma separated value) file. The App expects the date fields to be in DD-MMM-YYYY or YYYY-MM-DD format. This is to avoid misinterpreting American and European date formats.",
            "<b>Modify Layout</b> lets you update the chart title of the <em>data as of date</em>. This is the </em>report date</em> which is used in other charts (W4, Trend and Trend OC),",
            "<b>Download Main Config</b> allows you to download the current config. You can use the file later. For some reason the download is not working consistently in all browsers.  It download is unsuccessful the cofig is copied to clipboard and the workaround is to open a new text file, paste the config and save the file",
            "<b>Upload Main Config</b> allows you to load (a previously saved) config. In this way you save time when re-configuring charts when data is refreshed. ",
            "<b>Print PDF</b> creates a PDF version of the metrics.",
            "<b>Help</b> shows you this page",
            "<b>Feedback</b> lets you to send an email with your comments.",
            "",
        ]
    },
    {
        header: "What are chart menus?",
        details: [
            "On the top-right corner of every chart there is a <em>hamburger menu</em>. When you click on this the App will offer following options:",
            "<b>Filter Chart</b> shows all the values in the x-axis where you can select the values that you want filtered: check to show and uncheck to hide. Note this option is only shown for the charts that are filterable.",
            "<b>Config Chart</b> gives you the option to change the chart as you see fit.This is described in detail in a separate section.",
            "<b>Remove Chart</b> deletes the chart. The App asks for a confirmation from you before deleting chart",
            "<b>Clone Chart</b> lets you add a copy of the chart at the current position. Once copied you can change the config.",
            "<b>Close</b> closes the dialogue.",
            "",
        ]
    },
    {
        header: "How to configue charts?",
        details: [
            "When new data is loaded the App creates a config automatically based on the data form the first row. The default can be changed using <b>Config chart</b>. ",
            "There are some common values for all charts; these are as follows:",
            "<b>Chart title</b> lets you change the title of a chart.",
            "<b>Auto title</b> indicates if the title should be automatically set by the App. It is recommended that you keep this checked while you are configuring the charts. Once you are done, you can uncheck this option and enter your value.",
            "<b>Chart size</b> can be small, medium or large. On larger screens, such as PC or laptop, the three types will show appropriately. On a smaller screen, such as mobile, all charts will show in one size.",
            "<b>Chart position</b> lets you re-position a chart. Select a new position and the App move that particular chart to the desired position.",
            "The other values are dependent on the chart type as described in the next section.",
        ]
    },
    {
        header: "How to configure charts using chart types?",
        details: [
            "When configuring a chart different options, relevant to the chart type, will be available as decribed below:",
            "<b>2x2</b> shows the cross tabulated data for two columns. You can select the x and y axes.  There is an option of <em>average/sum</em> and <em>count if</em> as described in the next section.",,
            "<b>Data Description</b> describes that input data, i.e. type of data, counts, man and min values.",
            "<b>Data Table</b> lists the rows of the input data. You can select the number of rows to display.",
            "<b>Date</b> is used when the x-axis has date values. Choose the data table chart type date means the x-axis state at the column ID. You can select the column to show in the x-axis. Different formats available such as DD (day of the month), DDD (day of the week), MMM (month), MMM-YY (specific month) and Wx (weeks from report date). There is an option of <em>average/sum</em> and <em>count if</em> as described in the next section.",
            "<b>List Count</b> is useful when a column contains a list of values, for example list of tags or list of linked defects to a test script. You have to indicate a separator for the list, such as comma. The separator defaults to a space if not provided.  There is an option <em>count if</em> as described in the next section.",
            "<b>List Members</b> is useful when a column contains a list of values as described above. The chart shows the count of tags in the input. You can further define <em>count if</em> value as described in the next section.", 
            "<b>Note</b> allows to specify a message in the metrics. It is not a chart but useful in embedding key messages in the metrics. The demos make use of these to describe the metrics.",
            "<b>Number</b> is used when the x-axis has numbers. There is an option for youth enter <em>bin</em> to show chart by bin values. The bin if entered must be a comma separated list of numbers in ascending order.  You can further define <em>count if</em> as described in the next section.",
            "<b>Plan</b> shows the data in a Gantt chart The inputs required are column that has the description to show in the plan, cowman for start date and column for the end date. Columns for start and end dates must contain dates. You can further define <em>count if</em> as described in the next section.",
            "<b>Risk</b> shows the data in standard 5x5 risk matrix. You can select the likelihood and impact columns. The App will expect the values 1 to 5 in these columns. You can define the likelihood and impact values as well. There are options of <em>average/sum</em> and <em>count if</em> as described in the next section.",
            "<b>State Change</b> is it a chart that shows data on transitions. It expects that the data source is sorted in acceding order for each item. You have to select the columns from where the App picks the values: Time stamp shows the time of the transition while From and To give the values at the point of transition. There is an option to count the number of transition or calculate the total time of transition or average time for transition.  There is also an option of <em>count if</em> as described in the next section.",
            "<b>String</b> is a is used when the x-axis is neither Date or Number. You can define an <em>order</em> that will make sure (a) the x-axis will be ordered accordingly (b) the item will be shown on the chart even if the value is zero. For instance, you want to show P1 even if zero then enter P1 in <em>order</em>.  There are options of <em>average/sum</em> and <em>count if</em> as described in the next section.",
            "<b>Trend</b> shows trend of values; for example, test execution trend. You have to specify a date column. You can further define <em>count if</em>, <em>plan</em> and <em>forecast</em> values as described in the next section.",
            "<b>Trend OC</b> is very similar to Trend except it calculated the trend using <em>open</em> and <em>close</em> dates. You can further define <em>count if</em>, <em>plan</em> and <em>forecast</em> values as described in the next section.",
        ]
    },
    {
        header: "How to set average/sum, countif, plan and forecast?",
        details: [
            "<b>Average/sum</b> where the App uses another column, called <em>column over</em>, that contains numeric data.  The App displays the sum or average of the values form this second column.",
            "Following parameters are set using string as an input. To aid your input, a template is displayed when the input field is first clicked. The templates are explained below (where _x_ is shown in the template, a value must be provided).",
            "<b>Count If</b> has the template <mark>excludeif|includeif  _col_  contains  [_array_].</mark> The template means either exclude or include records where the _colname_ field contains any item in the _array_.",
            "<b>Plan</b> has the template <mark>start  _date_  end  _date_  scopefrom  _number_  scopeto  _number_  points  [_arraynum_].</mark> The app draws that from start to end going form scopefrom to scope to using the points.  The point _arraynum_ a numeric asceding array with max value of 1.  Examples: [0, 1] draws a straight line. [0, .2, 1] draws the plan using three values, scopefrom at the first point, scopeto as the last point and .2 times (scopeto minus scoopefrom) in the middle.",
            "<b>Forecast</b> has two templates.  For Chart Type as Trend the tempalte is <mark>basisdays  _number_  forecasdays  _number_  changefrom  _date_  count  _number_.</mark> The basisdays indicates the number of days previous to the report date used to calculate forecast, forecasdays indicates the number of days forecast is displayed, changefrom is a date where the forecast is modified using the value for count.", //TO DO
            "<b>Forecast for Trend OC</b> has the tempalte is <mark>basisdays  _number_  forecasdays  _number_  changefrom  _date_  open  _number_  close  _number_.</mark> The meaning of most paramters are as above except open and close that indicate how the forecast is modified.",
            "",
        ]
    },
]

function showhelp() {
    const help = document.querySelector("#help")

    const main = document.querySelector("#main")
    if (help.childNodes.length > 0) {
        help.innerHTML = ""
        main.style.display = "block"
        return
    }
    main.style.display = "none"
    const helptitle = document.createElement("h2")
    helptitle.textContent = "Help for metrics-as-a-service"
    helptitle.style.fontWeight = "bolder"
    help.appendChild(helptitle)
    const button = document.createElement("button")
    button.textContent = "Close help"
    button.setAttribute("onclick", "showhelp()")
    button.setAttribute("class", "maas-button")
    help.appendChild(button)
    HELP_TEXT.forEach(hd => {
        const details = document.createElement("details")
        details.setAttribute("class", "maas-help")
        const summary = document.createElement("summary")
        summary.setAttribute("class", "maas-help")
        summary.textContent = hd.header
        details.appendChild(summary)
        hd.details.forEach(d => {
            const p = document.createElement("p")
            p.setAttribute("class", "maas-help")
            p.innerHTML = d
            details.appendChild(p)
        })
        help.appendChild(details)
    })
    const endbutton = button.cloneNode(true)//document.createElement("button")
    help.appendChild(endbutton)
}