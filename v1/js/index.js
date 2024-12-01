"use strict"

window.addEventListener("load", (event) => {
    showHideLoader("hide")
    const url = new URL(window.location.toLocaleString())
    const search = url.search
    if (!search) return

    const preset = search.replace("?", "").trim()
    if (preset === "") {
        $dialog.alert(`Preset "${preset}" invalid`, ["Close"])
        return
    }
    if (presetConfigs && presetConfigs[preset]) {
        createPresetMenus(presetConfigs[preset]).click()
        return
    }
    $dialog.alert(`Preset "${preset}" not found`, ["Close"])
})

window.addEventListener("scroll", (e) => {
    const goToTop = _select("#go-to-top")
    const docEl = document.documentElement
    const pos = docEl.scrollTop
    const h = docEl.scrollHeight - docEl.clientHeight
    const scrollValue = Math.round((pos * 100) / h)

    if (scrollValue < 20) goToTop.style.display = "none"
    else {
        goToTop.style.display = "grid"
        goToTop.setAttribute("data-value", scrollValue)
    }

    // console.log(scrollValue)
})
//import common, Param.setConfigJSON Preset Counter.getCountsFromFile Logger
///////////////////////////////////////////////////////////////// loader functions
function showHideLoader(action) {
    const loader = _select("#loader")
    const display = action === "show" ? "block" : "none"
    loader.style.display = display
}

function showLoading() {
    //merge above??
    _clearHTML("#data-source")
    _clearHTML("#filter-value")
    _clearHTML("#log")
    showHideLoader("show")
    const reportTitles = _select("#report-titles")
    _select("h1", reportTitles).textContent = ""
    _select("h2", reportTitles).textContent = ""
    _sleep(1000)
}

async function loadPresetFile(presetType) {
    if (!presetType) return
    hideDropdown()
    highlightPresetMenu(presetType)
    showLoading()
    showHideLoader("show")
    clearCounts()
    destroyAllCharts()
    const configJSON = Preset.getConfigJSON(presetType)
    let config
    try {
        config = JSON.parse(configJSON)
    } catch (error) {
        console.log(error)
    }
    if (config) {
        const { files } = config
        Param.setConfig(config)
        await countNow()
        updateDataSource(files)
    }
    Logger.showLogs()
    showHideLoader("hide")
}

async function loadNewFile() {
    Logger.clearLogs()
    const files = _select("#file").files
    if (files.length == 0) {
        $dialog.alert("Please select a file")
        return
    }
    const file = files[0]
    const config = Param.getConfig()
    const action = _isEmpty(config) ? "Reset Config" : await actionOnConfig()
    if (action === "Abort Load") return
    showHideLoader("show")
    showLoading()
    clearCounts()
    destroyAllCharts()
    if (action === "Reset Config") {
        const dataDescription = await Counter.getCountsFromFile("{}", file)
        Param.autoCreateConfig(file, dataDescription)
    }
    if (action === "Keep Config") Param.updateFile(file)
    await countNow()
    updateDataSource([file.name])
    showHideLoader("hide")
    async function actionOnConfig() {
        //to do get first row and compare
        const areHeadersSame = false
        if (areHeadersSame) return "Keep Config"
        return await $dialog.alert(`Config present`, [
            "Keep Config",
            "Reset Config",
            "Abort Load",
        ])
        return action
    }
}
async function countNow(filter) {
    showHideLoader("show")
    Logger.startLogs()
    const config = Param.getConfig()
    const json = JSON.stringify({ filter, config })
    const allCounts = await Counter.getCountsFromFile(json, config.file)

    saveCounts(allCounts)
    showCharts()
    showFilters()
    Logger.showLogs()
    showHideLoader("hide")
}
function clearCounts() {
    saveCounts({})
}
function saveCounts(x) {
    setItem("allCounts", JSON.stringify(x))
}
function getCounts() {
    return JSON.parse(getItem("allCounts"))
}

function createTag(text, colorClass, tooltip) {
    return _createElements({
        a: { class: colorClass, text, "data-title": tooltip },
    })
}

// const hasFilter = (chartId) => {
// }

function showFilters() {
    const allCounts = getCounts()
    const filterValueDiv = _clearHTML("#filter-value")
    if (!allCounts.memo.global) return
    const { totalRowCounts, filteredRowCounts } = allCounts.memo.global

    const label =
        filteredRowCounts != totalRowCounts
            ? `${filteredRowCounts} out of ${totalRowCounts} rows of data shown`
            : `All ${totalRowCounts} rows of data shown`

    filterValueDiv.appendChild(createTag(label, "maas-tag-info"))

    for (const [key, value] of Object.entries(allCounts.counts)) {
        const excluded = [],
            included = []

        for (const [k, v] of Object.entries(allCounts.counts[key])) {
            v.include ? included.push(k) : excluded.push(k)
        }

        if (excluded.length > 0) {
            const isMember = "=",
                isNotMember = "\u2260"
            let filterValue = Param.getChartProps(key).chartTitleWithIndex + " "
            if (included.length <= excluded.length)
                filterValue += isMember + " [" + included.join(", ") + "] "
            else filterValue += isNotMember + " [" + excluded.join(", ") + "] "

            filterValueDiv.appendChild(createTag(filterValue, "maas-tag-info"))
        }
    }
}

function getChartId(key) {
    return "chart-" + key
}

function getChartContainer(key) {
    return "chart-container-" + key
}
function getKey(id) {
    return id.replace("chart-", "")
}

function showCharts() {
    const mainTitle = _select("#main-title")
    const { reportDate, reportTitle } = Param.getConfig()
    mainTitle.textContent = reportTitle
    const subTitle = _select("#sub-title")
    subTitle.textContent =
        "Data as of: " + _formatDate(reportDate, "DDD DD-MMM-YYYY")

    const callOutWrapper = _clearHTML("#call-out-wrapper")
    const wrapper = _clearHTML("#wrapper")
    const toc = _clearHTML("#toc")
    const dropdownTOC = _clearHTML("#dropdown-toc")
    const allCounts = getCounts()

    for (const key in allCounts.callOuts) {
        const div = _createElements({
            div: {
                class: `maas-call-out`,
                id: `call-out-${key}`,
                button_top: {
                    style: "font-size:2rem",
                    id: "top",
                    onclick: `scrollToChart(${key})`,
                },
                br: {},
                button_bottom: {
                    id: "bottom",
                    onclick: `showCalloutMenu(${key})`,
                },
            },
        })
        callOutWrapper.append(div)
        createCallout(key, allCounts.callOuts[key])
    }

    for (const key in allCounts.counts) {
        const { chartTitleWithIndex, chartSize } = Param.getChartProps(key)
        const spanClass = "maas-" + chartSize.toLowerCase()

        const id = getChartId(key)
        createChartPlaceholder()
        createTOCentry()

        const data = allCounts.data[key]
        const memo = allCounts.memo[key]
        drawChart(id, memo, data, chartClick)
        function createChartPlaceholder() {
            const div = _createElements({
                div: {
                    id: getChartContainer(key),
                    class: `surface-1 maas-chart ${spanClass}`,
                    h4: {
                        span_title: { text: chartTitleWithIndex },
                        span_menu: {
                            style: "float:right",
                            // "data-title": "Chart menu",
                            a: {
                                class: "maas-only-print",
                                style: "font-size:x-small",
                                href: "#toc",
                                text: "ToC",
                            },
                            button: {
                                // id: "menu",
                                tabindex: "0",
                                onclick: `showChartMenus('${id}')`,
                                text: String.fromCharCode("8942"), //ellipse &#8942; 9776
                            },
                        },
                    },
                    div_chart: {
                        id: `${id}`,
                    },
                    div_msg: { id: "msg", class: "maas-tags" },
                    div_footer: {
                        class: "maas-chart-footer",
                        text: _getCSSVar("--chart-footer"),
                    },
                },
            })
            wrapper.appendChild(div)
        }

        function createTOCentry() {
            const a = {
                a: {
                    href: getChartContainer(id),
                    text: `${chartTitleWithIndex}`,
                },
            }

            const tocEntry = _createElements({ div: a })
            toc.appendChild(tocEntry)
            const tocEntryDup = _createElements(a)

            dropdownTOC.appendChild(tocEntryDup)
            dropdownTOC.setAttribute("onclick", "toggleDropdown()")
        }
    }
}

async function chartClick(chartId, category) {
    if (!category) return
    const allCounts = getCounts()
    const key = getKey(chartId)

    const oneCount = allCounts.counts[key]
    for (const [k, v] of Object.entries(oneCount))
        if (k !== category) v.include = !v.include
    await countNow(allCounts)
}
async function chartResetFilter(chartId) {
    let allCounts = getCounts()
    const key = getKey(chartId)
    const oneCount = allCounts[key].counts

    for (const [k, v] of Object.entries(oneCount)) v.include = true
    await countNow(allCounts)
}

function menu(action) {
    hideDropdown()

    if (action == "print") {
        window.print()
        return
    }
    const readFile = (accept, onchange) => {
        const input = _select("#file")
        const forceReloadOfSameFile = ""
        input.value = forceReloadOfSameFile
        input.accept = accept
        input.setAttribute("onchange", onchange)
        input.click()
    }
    if (action == "loadData") {
        readFile(".csv", "loadNewFile(this)")
        return
    }
    if (action == "uploadConfig") {
        readFile(".json", "loadJSONFile(this)")
        return
    }

    if (action == "downloadConfig") {
        const config = Param.getConfig()
        const json = JSON.stringify(config, null, 2)
        if (json == "{}") return
        navigator.clipboard.writeText(json)
        downloadFile(json, "config.json")
        return
    }

    if (action == "layout") return showLayoutDialog()
    if (action == "help") return window.open("help.html")
    if (action == "showData") {
        localStorage.setItem(
            "data",
            `Level,Desc,Start,End,Critical,Actual start,Actual/estimated end,Responsibility,RAG
1,L1 Task 1,14-May-23,13-Jul-23,Yes,19-Jun-23,10-Aug-23,US,A
2,L2 Task 2,14-May-23,24-May-23,Yes,20-Jun-23,28-Jun-23,US,B
2,L2 Task 3,24-May-23,13-Jun-23,Yes,28-Jun-23,16-Jul-23,US,B
2,L2 Task 4,13-Jun-23,02-Jul-23,No,16-Jul-23,30-Jul-23,US,B
2,L2 Task 5,02-Jul-23,13-Jul-23,Yes,30-Jul-23,10-Aug-23,US,R
1,Milestone 1,13-Jul-23,13-Jul-23,Yes,10-Aug-23,10-Aug-23,US,A
1,L1 Task 7,13-Jul-23,23-Sep-23,Yes,07-Jul-23,27-Oct-23,Europe,A
2,L2 Task 8,13-Jul-23,30-Jul-23,Yes,10-Aug-23,26-Aug-23,Europe,R
2,L2 Task 9,30-Jul-23,16-Aug-23,No,26-Aug-23,16-Sep-23,Europe,R
2,L2 Task 10,16-Aug-23,29-Aug-23,No,16-Sep-23,03-Oct-23,Europe,R
2,L2 Task 11,29-Aug-23,10-Sep-23,No,03-Oct-23,16-Oct-23,Europe,R
2,L2 Task 12,10-Sep-23,23-Sep-23,No,16-Oct-23,27-Oct-23,Europe,R
1,Milestone 2,23-Sep-23,23-Sep-23,Yes,27-Oct-23,27-Oct-23, Europe,A
1,L1 Task 14,08-Jul-23,03-Sep-23,No,24-Jul-23,07-Sep-23,Asia,A
2,L2 Task 15,08-Jul-23,22-Jul-23,No,23-Jul-23,09-Aug-23,Asia,R
2,L2 Task 16,22-Jul-23,06-Aug-23,No,09-Aug-23,26-Aug-23,Asia,R
2,L2 Task 17,06-Aug-23,24-Aug-23,No,26-Aug-23,07-Sep-23,Asia,A
2,L2 Task 18,24-Aug-23,03-Sep-23,No,17-Aug-23,07-Sep-23,Asia,A
1,Milestone 3,03-Sep-23,03-Sep-23,No,07-Sep-23,07-Sep-23,Asia,A
1,L1 Task 20,03-Sep-23,17-Oct-23,No,03-Sep-23,17-Oct-23,US,G
2,L2 Task 21,03-Sep-23,23-Sep-23,No,03-Sep-23,23-Sep-23,US,G
2,L2 Task 22,23-Sep-23,04-Oct-23,No,23-Sep-23,04-Oct-23,US,G
2,L2 Task 23,04-Oct-23,17-Oct-23,No,04-Oct-23,17-Oct-23,US,G
1,Milestone 4,17-Oct-23,17-Oct-23,No,17-Oct-23,17-Oct-23,US,G`
        )
        window.open("raw.html")
    }

    if (action == "feedback") {
        window.open(
            "mailto:abhi.majumdar.uk+maas.feedback@gmail.com?&subject=Feedback%20on%20metrics%2Das%2Da%2Dservice%20App",
            "_top"
        )
        return
    }
    const error = `"${action}" not implemented`
    // console.error(error)
    $dialog.alert(error)
}

function updateDataSource(sources, clear = true) {
    const dataSource = _select("#data-source")
    const isHTTPS = (source) => source.substring(0, 8) === "https://"
    const nameBeforeLastSlash = (fileName) => {
        const slashPosition = fileName.lastIndexOf("/")
        if (slashPosition == -1) return fileName
        return "..." + fileName.substring(slashPosition + 1, fileName.length)
    }

    if (clear) {
        dataSource.innerHTML = ""
        dataSource.appendChild(createTag(`Data source`, "maas-tag-info"))
    }
    for (const source of sources) {
        const a = _createElements({ a: { class: "maas-tag-info" } })
        if (isHTTPS(source)) {
            // const nameBeforeQuestionMark = name(sourceName) //find different solution for private file
            a.href = source //nameBeforeQuestionMark
            a.target = "_blank"
            a.text = nameBeforeLastSlash(source) //(nameBeforeQuestionMark)
            a.setAttribute("data-title", source) //(nameBeforeQuestionMark)
        } else a.text = nameBeforeLastSlash(source) //sourceName)
        dataSource.appendChild(a)
    }

    // if (isHTTPS) {
    //     const nameBeforeQuestionMark = name(sourceName)
    //     a.href = nameBeforeQuestionMark
    //     a.target = "_blank"
    //     a.text = nameBeforeLastSlash(nameBeforeQuestionMark)
    //     a.setAttribute("data-title", nameBeforeQuestionMark)
    // } else a.text = nameBeforeLastSlash(sourceName)
    // dataSource.appendChild(a)
}
///////////////////////////menu bar functions
function hideDropdown() {
    const dropdownTOC = _select("#dropdown-toc")
    dropdownTOC.style.display = "none"
}
function toggleDropdown() {
    const dropdownTOC = _select("#dropdown-toc")
    const tocIsHidden =
        dropdownTOC.style.display === "" || dropdownTOC.style.display === "none"
    console.log({ tocIsHidden })
    if (tocIsHidden) dropdownTOC.style.display = "block"
    else dropdownTOC.style.display = "none"
    // toc.classList.toggle("maas-only-print");
}
function highlightPresetMenu(label) {
    //     const presetAList = document
    //         .querySelector("#top-nav")
    //         .querySelector("#preset")
    //         .querySelectorAll("a")
    //     for (let i = 0; i < presetAList.length; i++) {
    //         const a = presetAList[i]
    //         a.classList.remove("maas-focus")
    //         if (a.textContent === label) a.classList.add("maas-focus")
    //     }
}
function createPresetMenus(preset) {
    const presetMenu = Preset.getMenuItems(preset)
    const presetDiv = _select("#top-nav #preset")
    const notPresetDiv = _select("#top-nav #not-preset")
    loadMenu(presetMenu)
    return _selectAll("button", presetDiv)[0]

    function loadMenu(menus) {
        const tocClone = _selectAll("button", notPresetDiv)[0]
        menus.forEach((v) => {
            const { label } = v
            const clone = tocClone.cloneNode(true)
            clone.textContent = label
            clone.setAttribute("onclick", `loadPresetFile('${label}')`)
            presetDiv.appendChild(clone)
        })
        notPresetDiv.style.display = "none"
    }
}
/////////////////////////////////////////////////////////////////////// test routines
async function smokeTest(duration = 700) {
    const startSmoke = new Date()
    console.clear()
    const elements = [
        { component: "h2", label: "Smoke test results" },
        { component: "hr" },
    ]
    await testCharts()
    record()
    await testConfigDialog()
    record()
    record(`Smoke test done: ${elapsedTime(startSmoke)} s`)
    elements.push(
        { component: "hr" },
        {
            component: "button",
            label: "Close",
            onclick: "$dialog.close();",
        }
    )
    $dialog.make(elements, {}).show()

    async function testCharts() {
        showHideLoader("show")
        const presetMenu = Preset.getMenuItems(presetConfigs.demo)
        for (let i = 0; i < presetMenu.length; i++) {
            const startLap = new Date()
            const presetType = presetMenu[i].key
            loadPresetFile(presetType)
            await _sleep(duration)
            const numberOfCharts = Param.getCountOf("chart")
            //select random chart
            const randomChart = SelectRandomChart()
            console.log(randomChart)
            for (let j = 0; j < numberOfCharts; j++) {
                scrollToChart(j)
                await _sleep(duration)
                if (j === randomChart) {
                    await _sleep(duration)
                    filterChart(j)
                }
            }
            record(`Chart for ${presetType} done: ${elapsedTime(startLap)} s`)
        }

        function SelectRandomChart() {
            const { chartProperties } = Param.getConfig()
            if (!chartProperties) return -1
            const chartCount = chartProperties.length
            const firstBarChart = chartProperties.findIndex(
                (v) => v.chartType === "Bar"
            )

            if (firstBarChart === -1) return -1
            let random = Math.floor(Math.random() * chartCount)
            while (chartProperties[random].chartType !== "Bar") {
                // console.log({ random, m: chartProperties.count })
                random++
                if (random >= chartCount) random = 0
            }
            return random
        }
        function filterChart(key) {
            const cats = getChartCategories(key)
            const random = Math.floor(Math.random() * cats.length)
            console.log({ key, cat: cats[random] })
            chartClick(getChartId(key), cats[random])
        }
    }
    async function testConfigDialog() {
        configChart("0")
        const chartType = $dialog.getElement("chartType")
        const chartTypes = Param.getChartTypes()
        for (let i = 0; i < chartTypes.length; i++) {
            const startLap = new Date()
            chartType.value = chartTypes[i]
            showDialogOptions()
            await _sleep(duration * 4)
            record(
                `Dialog for ${chartTypes[i]} done: ${elapsedTime(startLap)} s`
            )
        }
    }
    function elapsedTime(start) {
        const end = new Date()
        return Math.round(_dateTimeDiff(start, end, "Milliseconds") / 1000)
    }
    function record(label) {
        if (!label) {
            elements.push({ component: "hr" })
            console.log("-------------------------")
            return
        }
        elements.push({ component: "p", label })
        console.log(label)
    }
}
function setItem(key, value) {
    localStorage.setItem(key, value)
    // store[key] = value
}
function getItem(key) {
    return localStorage.getItem(key)
    // console.assert(store[key], `${key} is not found`)
    // return store[key]
}
