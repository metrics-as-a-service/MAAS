"use strict"
async function smokeTest(duration = 700) {
    const start = new Date()
    console.clear()
    const elements = [{ tag: "h2", label: "Smoke test results" }, { tag: "hr" }]
    await testCharts()
    record()
    await testConfigDialog()
    record()
    record(`Smoke test done: ${elapsedTime(start)} s`)
    elements.push(
        { tag: "hr" },
        {
            tag: "button",
            label: "Close",
            onclick: "Dialog.close();",
        }
    )
    Dialog.make(elements).show()

    async function testCharts() {
        showHideLoader("show")
        const presetMenu = Preset.getMenuItems(presetConfigs.demo)
        for (let i = 0; i < presetMenu.length; i++) {
            const startLap = new Date()
            const presetType = presetMenu[i].key
            loadPresetFile(presetType)
            await _.sleep(duration)
            const numberOfCharts = Param.getCountOf("chart")

            //select random chart
            const randomChart = SelectRandomChart()
            for (let j = 0; j < numberOfCharts; j++) {
                if (!scrollToChart(j)) continue
                await _.sleep(duration)
                if (j === randomChart) {
                    await _.sleep(duration)
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
        const chartType = Dialog.getElement("chartType")
        const chartTypes = getChartTypes()
        for (let i = 0; i < chartTypes.length; i++) {
            const startLap = new Date()
            chartType.value = chartTypes[i]
            showDialogOptions()
            await _.sleep(duration * 4)
            record(
                `Dialog for ${chartTypes[i]} done: ${elapsedTime(startLap)} s`
            )
        }
    }
    function elapsedTime(start) {
        const end = new Date()
        return Math.round(_.dateTimeDiff(start, end, "Milliseconds") / 1000)
    }
    function record(label) {
        if (!label) {
            elements.push({ tag: "hr" })
            console.log("-------------------------")
            return
        }
        elements.push({ tag: "p", label })
        console.log(label)
    }
}
