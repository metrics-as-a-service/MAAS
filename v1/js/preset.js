const $preset = (function () {
    "use strict"
    let $ = {}
    let presetConfig

    $.getMenuItems = function (preset) {
        if (!preset) {
            $dialog.alert(`Preset ${preset} not found`, ["Close"])
            return
        }
        presetConfig = preset
        const menuitems = []
        for (const key in preset)
            menuitems.push({ onclick: `loadPresetFile(this)`, label: key, key })
        return menuitems
    }

    $.getConfigJSON = function (type) {
        if (!type) {
            $l.log(`Type: "${type}" incorrect`, "Error")
            return
        }
        if (!presetConfig[type]) {
            $l.log(`Config missing for type: "${type}"`, "Error")
            return
        }
        const { config, filename } = presetConfig[type]
        if (!config) {
            $l.log(`Config missing for type: "${type}"`, "Error")
            return
        }
        // const filename = presetConfig[type].file
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
            if (!_isValidDate(reportDate)) {
                $l.log(`reportDate invalid ("${reportDate}")`, "Error")
                return
            }
            const today = new Date().toISOString().substring(0, 10)
            const daysToAdd = dateTimeDiff(reportDate, today, "Days")

            const datePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g //pattern for date YYYY-MM-DD
            let configJSON = JSON.stringify(config)
            configJSON = configJSON.replace(datePattern, (date) =>
                addDays(date, daysToAdd)
            )
            const x = JSON.parse(configJSON)
            return { configJSON, reportDate, filename }
        } catch (e) {
            const msg = `Error in $.getConfigJSON. Type: "${type}" Error: ${e}`
            $l.log(msg, "Error")
            return
        }
    }
    return $
})()
