;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Dialog = global.Dialog || {})))
})(this, function (exports) {
    "use strict"

    let dialog, idCounter, alertButtonPressed, dialogOptions
    function getLabel(name) {
        //camel case to sentence
        if (!name) return "Undefined"
        const nameParts = name.split(/(?=[A-Z])/)
        let label = nameParts.join(" ").toLowerCase()
        return label[0].toUpperCase() + label.substring(1)
    }
    let hasErrors = false
    const templates = {
        input: `<p><label></label><input data-error="p"></p>`,
        textarea: `<p><label></label><textarea data-error="p"></textarea></p>`,
        select: `<p><label></label><select data-error="p"> </select></p>`,
    }

    function getElement(elementName) {
        return _.select(`[name = ${elementName}]`, dialog)
    }

    // function isSpecial(attr) {
    //     return specials[attr] ? true : false
    // }

    function createElement(elParam) {
        const { tag, options, value, name } = elParam
        //disable, disabled, type removed
        const label = elParam.label ?? getLabel(name)

        if (!tag) return
        if (typeof tag === "function") {
            const div = tag()
            return div
        }
        if (tag == "button") {
            const button = _.createElements(`<button>${label}</button>`)
            setProperties(button, false)
            return button
        }

        //to do radio
        if (["input", "select", "textarea"].includes(tag)) {
            const html = templates[tag] //(label, name, labelOnRight)
            const div = _.createElements(html)
            setProperties(div)
            return div
        }
        const e = document.createElement(tag)
        setProperties(e, false)
        e.textContent = label
        return e

        function setProperties(parent, setForChild = true) {
            const el = setForChild ? _.select(tag, parent) : parent
            if (name) {
                el.name = name
            }
            if (!el) return
            const labelEl = setForChild ? _.select("label", parent) : undefined
            if (labelEl) {
                const id = name ? name : idCounter++
                el.id = id
                labelEl.setAttribute("for", id)
                labelEl.textContent = label
            }
            if (options)
                options.forEach((value) => {
                    const option = document.createElement("option")
                    option.setAttribute("value", value)
                    option.textContent = value
                    el.appendChild(option)
                })
            if (value) el.value = value
            const preProcessed = ["tag", "label", "name", "options", "value"]
            for (const key in elParam) {
                if (!preProcessed.includes(key)) {
                    const attr = elParam[key]
                    try {
                        el.setAttribute(key, attr)
                    } catch (error) {
                        console.error(`Invalid attribute: ${key}`)
                    }
                }
            }
        }
    }

    function error(errorMessages, name) {
        if (!dialog) return
        function setDisable(flag) {
            const elementsToDisable = _.selectAll("[disable-on-error]", dialog)
            elementsToDisable.forEach((e) => (e.disabled = flag))
        }
        setDisable(false)
        if (!errorMessages) {
            const errors = _.selectAll("error", dialog)
            for (const error of errors) error.remove()
            hasErrors = false
            return this
        }
        hasErrors = true
        setDisable(true)
        if (!name) {
            console.error("No name for: " + errorMessages)
            return this
        }
        const errorToDisplay = Array.isArray(errorMessages)
            ? errorMessages.join(". ")
            : errorMessages

        const errorElement = getElement(name)
        if (!errorElement) {
            console.error(errorMessages, name)
            return this
        }
        const errorLocation = errorElement.dataset.error
        const elementToShowError =
            errorLocation === "p"
                ? errorElement.parentElement
                : errorLocation === "s"
                ? errorElement.previousSibling
                : errorElement
        const mark = _.createElements(`<error>${errorToDisplay}</error>`)
        elementToShowError.after(mark)
        return this
    }
    function overlay(elements, values, overlayCount) {
        if (!dialog) return
        const overlays = _.selectAll("overlay", dialog)
        const overlayDiv = overlayCount ? overlays[overlayCount] : overlays[0]
        _.clearHTML(overlayDiv)
        if (!elements) return
        elements.forEach((e) => {
            if (_.isEmpty(e)) return
            const overlayElement = createElement(
                e.name ? { ...e, value: values[e.name] } : e
            )
            overlayDiv.appendChild(overlayElement)
        })
        return this
    }
    function make(elements, options) {
        const defaultOption = { className: "medium" }
        dialogOptions = Object.assign(defaultOption, options)
        const { onchange, className } = dialogOptions
        if (dialog) close()
        dialog = _.createElements(`<dialog><form><main></main></form></dialog>`)
        // console.log(dialog)
        if (!dialog) throw Error("Dialog not created")
        dialog.classList.add(className)
        const body = document.body
        body.appendChild(dialog)
        if (onchange) dialog.setAttribute("onchange", onchange)
        idCounter = 0

        let main = _.select("main", dialog)
        elements.forEach((e) => {
            if (_.isEmpty(e)) return
            const element = createElement(e)
            if (!element) return
            main.appendChild(element)
        })
        const form = _.select("form", dialog)
        // form.addEventListener("submit", (event) => {
        //     event.preventDefault()
        //     // const data = new FormData(event.target)
        //     // const formJSON = Object.fromEntries(data.entries())
        // })
        return this
    }
    function show(modal = true) {
        if (!dialog) return
        if (dialog.open) dialog.close()
        if (modal) {
            dialog.showModal()
            return this
        }
        dialog.show()
        return this
    }

    function close() {
        if (!dialog) return
        dialog.close()
        dialog.innerHTML = ""
        dialog.remove()
    }

    function data() {
        if (!dialog) return
        const data = {}
        const elementsWithNames = _.selectAll("[name]", dialog)
        for (const namedEl of elementsWithNames) {
            const key = namedEl.getAttribute("name")
            data[key] =
                namedEl.type === "checkbox" ? namedEl.checked : namedEl.value
        }
        return data
    }

    function alert(message, buttons) {
        const alertElements = [
            { tag: "h2", label: `Alert` },
            { tag: "hr" },
            {
                tag: "p",
                label: typeof message == "string" ? message : DISPLAY_INVALID,
            },
            { tag: "hr" },
        ]

        ;(Array.isArray(buttons) ? buttons : ["Close"]).forEach((label) => {
            if (typeof label == "string")
                alertElements.push({ tag: "button", label })
        })

        alertButtonPressed = ""
        make(alertElements)
        show()

        const alertButtons = Array.from(_.selectAll("button", dialog))
        for (const button of alertButtons)
            button.addEventListener("click", (event) => {
                alertButtonPressed = button.textContent
                close()
            })

        return new Promise(function (resolve, reject) {
            dialog.addEventListener("close", (event) => {
                resolve(alertButtonPressed)
            })
        })
    }

    exports.getElement = getElement
    exports.hasErrors = hasErrors
    exports.error = error
    exports.overlay = overlay
    exports.make = make
    exports.show = show
    exports.close = close
    exports.data = data
    exports.alert = alert
})
