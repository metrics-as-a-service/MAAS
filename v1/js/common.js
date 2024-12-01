"use strict"
//import
//export {everything}
const DISPLAY_OTHERS = "..." //String.fromCharCode(8230)  //UNICODEU+02026 HEX CODE&#x2026; HTML CODE&#8230; HTML ENTITY&hellip; CSS CODE\2026
const DISPLAY_INVALID = "Undefined" //String.fromCharCode(8264) //QUESTION EXCLAMATION MARK//"?" //HTML CODE&#8264;
const DISPLAY_INVALID_NUMBER = "NAN"
const DISPLAY_INVALID_DATE = "NAD"
const DISPLAY_SPACES = "Spaces" //String.fromCharCode(8709) //"Space" //&#8709;
const DISPLAY_LESS = "<"
const DISPLAY_MORE = ">"

const isInvalidDisplay = (x) =>
    x == DISPLAY_INVALID ||
    x == DISPLAY_INVALID_DATE ||
    x == DISPLAY_INVALID_NUMBER

const displayOrder = [
    DISPLAY_LESS,
    DISPLAY_MORE,
    DISPLAY_OTHERS,
    DISPLAY_SPACES,
    DISPLAY_INVALID_DATE,
    DISPLAY_INVALID_NUMBER,
    DISPLAY_INVALID,
]

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WORKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

const MAX_BAR_CATS = 30
const MAX_2X2_CATS = 10

// /**
//  * Tests if a date is valid
//  * @param {string} date to test
//  * @returns true or false
//  */
// function _isValidDate(date) {
//     return isValidDate(date)
// }

/**
 * Formats a date string using the format
 *
 * @param {string} date to be formatted
 * @param {string} format any combination of dd mm mmm yy and yyyy
 * @returns {string} formatted date
 */
function _formatDate(date, format) {
    if (!_isValidDate(date)) {
        console.log(date)
        return DISPLAY_INVALID_DATE
    }
    const dateWithHyphen = date.replace(/\//g, "-").toUpperCase().trim()
    const newDate = new Date(dateWithHyphen)
    const date_DDD_MMM_DD_YYYY = newDate.toDateString()
    const dateParts = date_DDD_MMM_DD_YYYY.split(" ")

    const DDD = dateParts[0]
    if (DDD == "Invalid") return DISPLAY_INVALID_DATE
    if (!format) return true
    const MMM = dateParts[1]
    const monthNumber = newDate.getMonth() + 1
    const MM = (monthNumber < 10 ? "0" : "") + monthNumber.toString()
    const DD = dateParts[2]
    const YYYY = dateParts[3]
    const YY = YYYY.substring(2, 4)

    // let formattedDate = format.replace("DDD", DDD)
    // formattedDate = formattedDate.replace("DD", DD)
    // formattedDate = formattedDate.replace("MMM", MMM)
    // formattedDate = formattedDate.replace("MM", MM)
    // formattedDate = formattedDate.replace("YYYY", YYYY)
    // formattedDate = formattedDate.replace("YY", YY)

    const formattedDate = format
        .replace("DDD", DDD)
        .replace("DD", DD)
        .replace("MMM", MMM)
        .replace("MM", MM)
        .replace("YYYY", YYYY)
        .replace("YY", YY)

    return formattedDate
}

/**
 * Tests if a date is valid
 * @param {string} date - valid formats are dd-mmm-yy, yyyy-mm-dd
 * @returns {boolean}
 */
function _isValidDate(date) {
    function isDateOK(DD, MM, YYYY) {
        if (YYYY < 2000) return false
        if (MM > 12) return false
        const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        if (MM != 2) return DD <= days[MM - 1]
        if (DD <= 28) return true
        const isLeapYear = YYYY % 100 == 0 ? YYYY % 400 == 0 : YYYY % 4 == 0
        if (isLeapYear && DD == 29) return true
        return false
    }

    if (typeof date !== "string") return false
    const dateWithHyphen = date.replace(/\//g, "-").toUpperCase().trim()

    const YYYY_MM_DD = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g
    if (dateWithHyphen.search(YYYY_MM_DD) == 0) {
        if (date.length != 10) return false
        const dateParts = date.split("-")
        const YYYY = Number(dateParts[0])
        const MM = Number(dateParts[1])
        const DD = Number(dateParts[2])
        return isDateOK(DD, MM, YYYY)
    }

    const DD_MMM_YY = /[0-9]{2}-[A-Z]{3}-[0-9]{2}/gi
    if (dateWithHyphen.search(DD_MMM_YY) == 0) {
        if (date.length != 9) return false
        const dateParts = dateWithHyphen.split("-")
        const YYYY = 20 + Number(dateParts[3])
        const MMM = dateParts[1]
        const DD = Number(dateParts[0])
        const MM = MONTHS.findIndex((v) => v.toUpperCase() == MMM) + 1
        if (MM == 0) return false
        return isDateOK(DD, MM, YYYY)
    }
    const DD_MMM_YYYY = /[0-9]{2}-[A-Z]{3}-[0-9]{4}/gi
    if (dateWithHyphen.search(DD_MMM_YYYY) == 0) {
        if (date.length != 11) return false
        const dateParts = dateWithHyphen.split("-")
        const YYYY = Number(dateParts[3])
        const MMM = dateParts[1]
        const DD = Number(dateParts[0])
        const MM = MONTHS.findIndex((v) => v.toUpperCase() == MMM) + 1
        if (MM == 0) return false
        return isDateOK(DD, MM, YYYY)
    }
    return false
}

function _dateTimeDiff(dateTimeStart, dateTimeEnd, format = "Days") {
    function workdays(startDate, endDate) {
        let workdays = 0
        let currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.toDateString().substring(0, 3)
            const isWorkDay = WORKDAYS.findIndex((v) => v == dayOfWeek) != 1
            if (isWorkDay) workdays++
            currentDate = new Date(currentDate.getTime() + milliSecondsInDay)
        }

        return workdays - 1
    }

    const start = new Date(dateTimeStart)
    const end = new Date(dateTimeEnd)
    const diffTimeMilliseconds = end - start
    const formatUC = format.toUpperCase().trim()
    if (formatUC == "MILLISECONDS") return diffTimeMilliseconds
    const milliSecondsInDay = 1000 * 60 * 60 * 24
    if (formatUC == "WORKDAYS") return workdays(start, end)
    const days = Math.ceil(diffTimeMilliseconds / milliSecondsInDay)
    if (formatUC == "DAYS") return days
    if (formatUC == "WEEKS") return days / 7
}

function _addDays(dateTimeStart, days) {
    const start = new Date(dateTimeStart)
    const daysInMS = 24 * 60 * 60 * 1000 * days
    start.setTime(start.getTime() + daysInMS)
    // start.setDate(start.getDate() + days)
    return start.toISOString().substring(0, 10)
}

function _getCSSVar(v) {
    const style = getComputedStyle(document.body)
    return style.getPropertyValue(v)
}
///////////////////////////////// DOM helpers

/**
 * Creates a set of elements based on html
 *
 * @param {string} html
 * @returns html elements to be appended to a parent element
 */
// const _createElements = (html) => {
//     let temp = document.createElement("template")
//     html = html.trim()
//     temp.innerHTML = html
//     return temp.content.firstChild
// }

/**
 * Remove the innerHTML and event listeners for an element
 * @param {string} selector for the element
 * @returns {HTMLElement}
 */
const _clearHTML = (selector) => {
    const element = typeof selector === "string" ? _select(selector) : selector
    if (element)
        while (element.firstChild) {
            element.lastChild.replaceWith(element.lastChild.cloneNode(true)) //removes any event listener
            element.removeChild(element.lastChild)
        }

    return element
}

/**
 *
 * @param {string} type
 * @param {string} selector
 * @param {function} callback
 * @param {object} options
 * @param {HTMLElement} parent
 */
function _addGlobalEventListener(
    type,
    selector,
    callback,
    options,
    parent = document
) {
    parent.addEventListener(
        type,
        (e) => {
            if (e.target.matches(selector)) callback(e)
        },
        options
    )
}

function _sleep(timeInMilliSeconds) {
    return new Promise((resolve) => setTimeout(resolve, timeInMilliSeconds))
}

//https://github.com/WebDevSimplified/js-util-functions/

function _select(selector, parent = document) {
    return parent.querySelector(selector)
}

function _selectAll(selector, parent = document) {
    return [...parent.querySelectorAll(selector)]
}

/**
 * Create DOM element(s) given the input.
 *
 * @example input: "<div class='x'></div>", output a div element with a class
 * @example input: {div: {class: "x", style: "y"}} output: div element with class and style
 * @example input: {div: {class: "x", style: "y", button: {class:"z"}}} output: div element with class and style
 * and a child button with class
 *
 * @param {String|Object|Array} input
 * @returns {HTMLElement}
 */
function _createElements(input) {
    const getTag = (tag) => {
        const underscore = tag.indexOf("_")
        if (underscore === -1) return tag
        return tag.substring(0, underscore)
    }

    if (typeof input === "string") {
        let temp = document.createElement("template")
        const html = input.trim()
        temp.innerHTML = html
        return temp.content.firstChild
    }

    if (typeof input !== "object") return

    const key = Object.keys(input)[0]

    const element = document.createElement(getTag(key))
    const attributes = input[key]
    if (typeof attributes !== "object") return element

    Object.entries(attributes).forEach(([attr, value]) => {
        if (typeof value === "object") {
            const childAttrs = {}
            childAttrs[attr] = value
            const child = _createElements(childAttrs)
            if (child) element.appendChild(child)
            return
        }

        if (attr === "class") {
            if (typeof value !== "string") return
            const classes = value.split(" ")
            for (const c of classes) element.classList.add(c)
            return
        }

        if (attr === "dataset") {
            if (typeof value !== "array") return
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue
            })
            return
        }

        if (attr === "text") {
            if (typeof value !== "string") return
            element.textContent = value
            return
        }
        if (attr === undefined) {
            return
        }
        if (typeof value === "string") element.setAttribute(attr, value)
    })

    return element
}
// function testX() {
//     // console.log(_createManyElements("div"))
//     // console.log(_createManyElements({ button: { class: "xxx", text: "yoo" } }))
//     let x
//     // x = { div: { class: "xxx", text: "yoo" } }
//     // console.log(_createManyElements(x))
//     x = {
//         div: {
//             div: { class: "x", text: "One" },
//             div: {
//                 class: "y",
//                 text: "Two",
//                 button: { class: "b", text: "click" },
//             },
//         },
//     }
//     console.log(_createManyElements(x))
// }

/**
 *
 * @param {object} obj
 * @returns {object}
 */
function _flatten(obj, parent, flattened = {}) {
    for (let key in obj) {
        let property = parent ? parent + "_" + key : key
        if (typeof obj[key] === "object") {
            _flatten(obj[key], property, flattened)
        } else {
            flattened[property] = obj[key]
        }
    }
    return flattened
}
/**
 *
 * @param {object} obj
 * @returns {object}
 */
function _unFlatten(obj) {
    Object.keys(obj).reduce((res, k) => {
        k.split("_").reduce(
            (acc, e, i, keys) =>
                acc[e] ||
                (acc[e] = isNaN(Number(keys[i + 1]))
                    ? keys.length - 1 === i
                        ? obj[k]
                        : {}
                    : []),
            res
        )
        return res
    }, {})
}

function _cleanArray(inString, format) {
    const inArray = inString.split(",")
    const outArray = []
    inArray.forEach((v) => {
        const val = v.trim()
        outArray.push(format === "Number" ? Number(val) : val)
    })
    return outArray
}
/**
 * Generate a clean array from input string
 * @param {string} input Input string with values
 * @param {string} delim Delimiter separating the values
 * @param {string} format Decides type of the result. "number" returns array of numbers else array of string items
 * @returns {string[]|number[]}
 */
function _getArray(input, delim = ",", format = "string") {
    return input
        .split(delim)
        .map((v) => (format == "number" ? Number(v) : v.trim()))
}
// function listAllEventListeners(selector) {
//     if (!selector) return
//     const parent = _select(selector)
//     const allElements = Array.prototype.slice.call(_selectAll("*", parent))
//     allElements.push(document)
//     allElements.push(window)

//     const types = []

//     for (let ev in window) {
//         if (/^onclick/.test(ev)) types[types.length] = ev
//     }

//     let elements = []
//     for (let i = 0; i < allElements.length; i++) {
//         const currentElement = allElements[i]
//         for (let j = 0; j < types.length; j++) {
//             if (typeof currentElement[types[j]] === "function") {
//                 elements.push({
//                     node: currentElement,
//                     type: types[j],
//                     func: currentElement[types[j]].toString(),
//                 })
//             }
//         }
//     }

//     // return elements.sort(function (a, b) {
//     //     return a.type.localeCompare(b.type)
//     // })
//     console.log(elements)
// }
function _removeChildren(selector) {
    const parent = _select(selector)

    // parent.replaceChildren()

    while (parent.firstChild) {
        parent.lastChild.replaceWith(parent.lastChild.cloneNode(true)) //removes any event listener
        parent.removeChild(parent.lastChild)
    }
}
function _sortArrayOrObjects(arrObj, { key, order = "a" }) {
    const isArray = Array.isArray(arrObj)
    const value = (x) => (typeof key === "function" ? key(x) : x[key])
    const sortedArrObj = arrObj.sort((a, b) => {
        const aValue = value(a)
        // console.log(aValue, a[(key, Array.isArray(arrObj))])
        const bValue = value(b)
        if (aValue < bValue) return -1
        if (aValue > bValue) return 1
        return 0
    })
    return order === "d" ? sortedArrObj.reverse() : sortedArrObj
}
function testSort() {
    const a = [
        { x: "Jan", count: 0, sum: 0, type: "must" },
        { x: "Feb", count: 0, sum: 0, type: "must" },
        { x: "Mar", count: 0, sum: 0, type: "must" },
        { x: "Apr", count: 0, sum: 0, type: "must" },
        { x: "May", count: 2, sum: 2, type: "must" },
        { x: "Jun", count: 2, sum: 10, type: "must" },
        { x: "Jul", count: 6, sum: 20, type: "must" },
        { x: "Aug", count: 4, sum: 30, type: "must" },
        { x: "Sep", count: 6, sum: 0, type: "must" },
        { x: "Oct", count: 3, sum: 50, type: "must" },
        { x: "Nov", count: 0, sum: 0, type: "must" },
        { x: "Dec", count: 0, sum: 0, type: "must" },
    ]
    return _sortArrayOrObjects(a, {
        key: (x) => (x.count ? x.sum / x.count : 0),
        order: "d",
    })
}
// _sortComparator(A,S,)

/**
 * A sort comparator function for custom sorts.
 * @example use as: x.sort((a,b)=> _sortComparator(a,b,option))
 * @param {Number|String} a
 * @param {Number|String} b
 * @param {{arrange :string, order :array}}
 * @returns {1|-1|0}
 *
 */
function _sortComparator(a, b, { arrange = "a", order: [] }) {
    const compare = arrange === "a" ? -1 : arrange === "d" ? 1 : 0
    const action = (a, b, c) => (a < b ? c : a > b ? -c : 0)

    if (Array.isArray(order)) {
        const aIndex = order.findIndex((v) => v === a)
        const bIndex = order.findIndex((v) => v === b)

        if (aIndex > -1 && bIndex > -1) return action(aIndex, bIndex, -1)
        if (aIndex > -1) return -1
        if (bIndex > -1) return 1
    }

    return action(a, b, compare)
}

function _tokenize(input, delimiters) {
    const getDelimAt = (ptr) => {
        for (const delim of delimiters)
            if (delim === input.substring(ptr, ptr + delim.length)) return delim
        return ""
    }

    const tokens = []
    let token = ""
    for (let i = 0; i < input.length; i++) {
        const char = input[i]
        const delimAt = getDelimAt(i)
        if (delimAt !== "") {
            if (token) tokens.push(token)
            tokens.push(delimAt)
            token = ""
            i += delimAt.length - 1
            continue
        }
        token += char
    }
    if (token) tokens.push(token)

    return tokens
}
function _isEmpty(obj) {
    return Object.keys(obj).length === 0
}

function _is2X2(chartType) {
    return ["Risk", "2X2", "State Change"].includes(chartType)
}
const _isTable = (chartType) =>
    ["Data Table", "Data Description"].includes(chartType)
const _isTrend = (chartType) => ["Trend OC", "Trend"].includes(chartType)

function _niceJoin(arr, { main = ", ", last = " or " } = {}) {
    return arr.reduce(
        (acc, v, i) =>
            acc +
            v +
            (i === arr.length - 2 ? last : i === arr.length - 1 ? "" : main),
        ""
    )
}
function _isInteger(x) {
    if (isNaN(x)) return false
    return Number.isInteger(Number(x))
}
function _isArray(arr, { order }) {
    if (!Array.isArray(arr)) return false
    if (typeof order !== "string") return
    const isAscending = order.toLowerCase[0] === "a"

    const isTupleOrdered = (a, b) => (isAscending ? a >= b : b >= a)
    const isOrdered = arr.every(
        (v, i) => i === 0 || isTupleOrdered(v, arr[i - 1])
    )
    return isOrdered
}
function _pick1stNonBlank(...args) {
    const x = args.find(
        (arg) => arg && typeof arg === "string" && arg.trim() !== ""
    )
    return x ? x.trim() : ""
}

// const sortArrayOfObjects = (arr, sortParams) => {
//     const { key, order } = sortParams
//     const sortedArr = arr.sort((a, b) => {
//         const aValue = a[key]
//         const bValue = b[key]
//         if (aValue < bValue) return -1
//         if (aValue > bValue) return 1
//         return 0
//     })
//     return order === "d" ? sortedArr.reverse() : sortedArr
// }
function _cleanObject(input) {
    const output = {}
    if (typeof input !== "object") return output
    Object.keys(input)
        .sort()
        .forEach((key) => {
            const value = input[key]
            if (typeof value === "undefined") return

            if (typeof value === "number") {
                output[key] = value + ""
                return
            }
            if (typeof value === "object") {
                output[key] = _cleanObject(value)
                return
            }
            if (typeof value !== "string") return
            if (value.trim() === "") return
            output[key] = value.trim()
        })
    return output
}
