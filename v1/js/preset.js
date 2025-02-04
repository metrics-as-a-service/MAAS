;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Preset = global.Preset || {})))
})(this, function (exports) {
    "use strict"
    let presetConfig
    function getMenuItems(preset) {
        if (!preset) {
            Dialog.alert(`Preset ${preset} not found`, ["Close"])
            return
        }
        presetConfig = preset
        const menuitems = []
        for (const key in preset)
            menuitems.push({ onclick: `loadPresetFile(this)`, label: key, key })
        return menuitems
    }
    async function showError(message) {
        console.log(message)
        await Dialog.alert(message)
    }
    function getConfigJSON(type) {
        if (!type) {
            showError(`Type missing`)
            return
        }
        const config = presetConfig[type]
        if (!config) {
            showError(`Config missing for type: "${type}"`)
            return
        }
        const { files } = config
        if (!files) {
            showError(`File name(s) missing`)
            return
        }

        try {
            const { reportDate } = config
            if (!reportDate) {
                showError(`reportDate missing`)
                return
            }
            if (!_.isValidDate(reportDate)) {
                showError(`reportDate invalid ("${reportDate}")`)
                return
            }
            const today = new Date().toISOString().substring(0, 10)
            const daysToAdd = _.dateTimeDiff(reportDate, today, "Days")
            config.presetOffsetDays = daysToAdd
            //to do fix date conversion for any valid date
            const datePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g //pattern for date YYYY-MM-DD
            // console.log(replaceDates(config))
            let configJSON = JSON.stringify(config)
            if (daysToAdd !== 0)
                configJSON = configJSON.replace(datePattern, (date) =>
                    _.addDays(date, daysToAdd)
                )
            const x = JSON.parse(configJSON)
            return configJSON
        } catch (e) {
            const msg = `Error in $.getConfigJSON. Type: "${type}" Error: ${e}`
            // $l.log(msg, "Error")
            console.log(msg)
            return
        }
        function replaceDates(arg) {
            if (typeof arg === "string") {
                return { x: arg }
            }

            // handle wrong types and null
            if (typeof arg !== "object" || !arg) {
                return {}
            }

            return Object.keys(arg).reduce((acc, key) => {
                return { ...acc, ...replaceDates({ key: arg[key] }) }
            }, {})
        }
    }

    exports.getMenuItems = getMenuItems
    exports.getConfigJSON = getConfigJSON
})
