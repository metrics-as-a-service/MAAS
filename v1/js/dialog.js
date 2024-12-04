;(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self),
          factory((global.Dialog = global.Dialog || {})))
})(this, function (exports) {
    "use strict"
    const specials = {
        tag: 1,
        label: 1,
        initialValue: 1,
        name: 1,
        elements: 1,
        options: 1,
        focus: 1,
        disable: 1,
    }

    let dialog, idCounter, overlayDiv, alertButtonPressed
    function getLabel(name) {
        //camel case to sentence
        if (!name) return "Undefined"
        const nameParts = name.split(/(?=[A-Z])/)
        let label = nameParts.join(" ").toLowerCase()
        return label[0].toUpperCase() + label.substring(1)
    }
    let hasErrors = false
    //TO DO remove all styles
    const HTMLs = {
        dialog: () =>
            `<dialog class="maas-dialog"><form><fieldset></fieldset></form></dialog>`, //class is OK
        legend: (label) => `<legend>${label}</legend>`,
        // mainTitle: (label) => `<h4>${label}</h4>`,
        input: (label, type, name) =>
            `<p>
                <label for="${++idCounter}">${label}: </label>
                <input type="${type}" id="${idCounter}" name=${name} tabindex="0">
            </p>`,
        button: (label) => `<button tabindex="0">${label}</button>`,
        textarea: (label, name) =>
            `<p>
                <label for="${++idCounter}">${label}:</label>
                <textarea id="${idCounter}" name=${name} tabindex="0" rows=1></textarea>
            </p>`,
        select: (label, name) =>
            `<p>
                <label for="${++idCounter}">${label}: </label>
                <select id="${idCounter}" name=${name} tabindex="0"> </select>
            </p>`,
        checkbox: (label, checked, name) =>
            `<p>
                <input type="checkbox" id="${++idCounter}" ${
                checked ? "checked" : ""
            } name=${name} tabindex="0">
                <label for="${idCounter}"> ${label}</label>
            </p>`,

        error: (messages) => `<error>${messages}</error>`,
    }

    function getElement(elementName) {
        return _.select(`[name = ${elementName}]`, dialog)
    }

    function isSpecial(attr) {
        return specials[attr] ? true : false
    }

    function createElement(param) {
        const { tag, options, initialValue, name, disable, disabled } = param

        const label = param.label ?? getLabel(name)

        function setReturnAndInitialValues(e) {
            // if (name) e.setAttribute("name", name)
            if (initialValue) e.value = initialValue

            for (const key in param) {
                if (!isSpecial(key)) {
                    try {
                        e.setAttribute(key, param[key])
                    } catch (error) {
                        console.assert(
                            false,
                            "Invalid attribute Name in dialog spec"
                        )
                    }
                }
            }
        }

        if (!tag) return

        if (tag == "legend") {
            if (!label) return
            const html = HTMLs[tag](label)
            const legend = _.createElements(html)
            _.select("form fieldset", dialog).appendChild(legend)
            return
        }

        if (tag.substring(0, 5) == "input") {
            const inputType = tag.replace("input ", "")
            const html = HTMLs["input"](label, inputType, name)
            const div = _.createElements(html)
            const input = _.select("input", div)
            setReturnAndInitialValues(input)
            return div
        }
        if (tag == "button") {
            const html = HTMLs[tag](label)
            const button = _.createElements(html)
            //button.preventDefault()
            setReturnAndInitialValues(button)
            return button
        }
        if (tag == "textarea") {
            const html = HTMLs[tag](label, name)
            const div = _.createElements(html)
            const textarea = _.select("textarea", div)
            setReturnAndInitialValues(textarea)
            return div
        }

        if (tag == "check") {
            function createACheckBox(label, checked, disabled) {
                const html = HTMLs["checkbox"](label, checked, label)
                const p = _.createElements(html)
                const input = _.select("input", p)
                if (disabled) input.disabled = true
                return p
            }
            const div = document.createElement("div")

            const checked = Boolean(initialValue)
            const checkEntry = createACheckBox(label, checked)
            div.appendChild(checkEntry)
            //requires a wrapper to display error message
            const wrapper = document.createElement("div")
            wrapper.append(div)
            return wrapper
        }
        if (tag == "overlay") {
            overlayDiv = document.createElement("div")
            return overlayDiv
        }

        if (tag == "select") {
            if (!options) return
            const html = HTMLs[tag](label, name)

            const div = _.createElements(html)
            const select = _.select("select", div)
            options.forEach((value) => {
                const option = document.createElement("option")
                option.setAttribute("value", value)
                option.textContent = value
                select.appendChild(option)
            })
            setReturnAndInitialValues(select)
            return div
        }
        const e = document.createElement(tag)
        setReturnAndInitialValues(e)
        e.textContent = label
        return e
    }

    function error(errorMessages, errorItem) {
        if (!dialog) return
        const disableOnError = _.select(".disable-on-error", dialog)
        if (disableOnError) disableOnError.disabled = false
        if (!errorMessages) {
            const errors = _.selectAll("error", dialog)
            for (const error of errors) error.remove()
            hasErrors = false
            return this
        }
        hasErrors = true
        if (disableOnError) disableOnError.disabled = true
        if (!errorItem) {
            console.error("No errorItem for: " + errorMessages)
            return this
        }
        const errorToDisplay = Array.isArray(errorMessages)
            ? errorMessages.join(". ")
            : errorMessages

        const errorElement = getElement(errorItem)
        const elementToShowError = errorElement.parentElement
        const mark = _.createElements(HTMLs["error"](errorToDisplay))
        elementToShowError.after(mark)

        return this
    }
    function addLabelAndInitialValue(e, initialValues) {
        if (!initialValues) return e
        const name = e.name // const name = e.name
        if (!name) return e
        const label = e.label ?? getLabel(name)
        const initialValue = e.initialValue
            ? e.initialValue
            : initialValues[name]
        return { ...e, label, initialValue }
    }
    function overlay(elements, initialValues) {
        if (!dialog) return
        _.clearHTML(overlayDiv)
        if (!elements) return
        elements.forEach((e) => {
            if (_.isEmpty(e)) return
            const overlayElement = createElement(
                addLabelAndInitialValue(e, initialValues)
            )
            overlayDiv.appendChild(overlayElement)
        })
        return this
    }
    function make(elements, { onchange, width = "medium" }) {
        if (dialog) close()
        dialog = _.createElements(HTMLs["dialog"]())
        dialog.classList.add(width)
        const body = document.body
        body.appendChild(dialog)
        dialog.setAttribute("onchange", onchange)
        idCounter = 0
        elements.forEach((e) => {
            if (_.isEmpty(e)) return
            const element = createElement(e)
            if (!element) return
            _.select("form fieldset", dialog).appendChild(element)
        })

        const form = _.select("form", dialog)
        form.addEventListener("submit", (event) => {
            event.preventDefault()
            // const data = new FormData(event.target)
            // const formJSON = Object.fromEntries(data.entries())
        })

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
        make(alertElements, {})
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
