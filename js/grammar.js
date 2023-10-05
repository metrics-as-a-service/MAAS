"use strict"
////////////////////////////////////////////////////////////grammar 
function parseInput(inputstring, grammar) {
    function tokenize(inputstring) {
        const doublequote = '"'
        function isDelim(char) {
            const delims = " []," + doublequote //" []" //" ()"
            return delims.indexOf(char) != -1
        }
        function getString() {
            let str = ""
            while (ptr < inputstring.length - 1) {
                ptr++
                const char = inputstring[ptr].toUpperCase()
                if (char == doublequote) {
                    ptr++
                    return str.trim()
                }
                str += char
            }
            return str.trim()
        }
        let ptr = -1, token = ""
        const tokens = []
        while (ptr < inputstring.length - 1) {
            ptr++
            const char = inputstring[ptr].toUpperCase()
            if (isDelim(char)) {
                if (token != "") tokens.push(token)

                if (char == doublequote)
                    tokens.push(getString())
                else
                    if (char != " ") tokens.push(char)

                token = ""
            }
            else {
                token += char
            }
        }
        if (token != "") tokens.push(token)
        return tokens
    }
    // phrase = {keyword: type} or {keyword: [type, defaultValue]} // type = number | string | array | date
    // phrase = {must: ["x","y"]} i.e. must have a x oy y in input
    // grammar = [ phrase1, phase2, ...]
    const output = {}
    const tokens = tokenize(inputstring)
    let error = ''
    function evalPhrase(keyword, type, defaultValue) {

        const tokenFound = tokens.findIndex(token => token != "" && keyword.trim().toUpperCase().indexOf(token) != -1)
        // const tokenFound = tokens.findIndex(token => token == keyword.trim().toUpperCase())

        if (tokenFound == -1) {
            output[keyword] = defaultValue
            return
        }
        const keywordfound = tokens[tokenFound].toLowerCase()
        tokens[tokenFound] = ""
        const valueToken = tokens[tokenFound + 1]

        if (!valueToken) {
            error = `No data after '${keyword}'`
            return
        }
        tokens[tokenFound + 1] = ""
        const typeupper = type.toUpperCase()
        if (typeupper == "COL") {
            const { colNames } = $p.getConfig()
            if (!colNames) {
                error = `Cannot validate column after '${keyword}'. Found:${valueToken}`
                return
            }
            const colfound = colNames.findIndex(v => v.trim().toUpperCase() == valueToken)

            if (colfound == -1) {
                error = `Not valid column after '${keyword}'. Found:${valueToken}`
                return
            }
            output[keywordfound] = valueToken
            return
        }
        if (typeupper == "NUMBER") {

            if (isNaN(valueToken)) {
                error = `Not number after '${keyword}'. Found:${valueToken}`
                return
            }
            output[keywordfound] = Number(valueToken)
            return
        }
        if (typeupper == "DATE") {
            if (!isValidDate(valueToken)) {
                error = `Not date after "${keyword}". Found:${valueToken}`
                return
            }
            output[keywordfound] = formatDate(valueToken, "YYYY-MM-DD")
            return
        }
        if (typeupper == "STRING") {
            output[keywordfound] = valueToken
            return
        }
        if (typeupper == "ARRAY" || typeupper == "ARRAYNUM") {
            if (valueToken != "[") {
                error = `Not open bracket after '${keyword}'. Found:${valueToken}`
                return
            }
            const inputArray = []
            // let arraystring = ""
            for (let i = tokenFound + 2; i < tokens.length; i++) {
                const token = tokens[i]
                tokens[i] = ""
                if (token == ",") continue
                if (token != "]") {
                    if (typeupper == "ARRAYNUM") {
                        if (isNaN(token)) {
                            error = `Not number in array for '${keyword}'. Found:${token}`
                            return
                        }
                        inputArray.push(Number(token))
                    }
                    else
                        inputArray.push(token)
                    // arraystring += " " + token
                    // continue
                }

                if (token == "]") {
                    // const inputArray = arraystring.split(",")
                    // console.log(inputArray)
                    // if (typeupper == "ARRAYNUM") {
                    //     const nonNumber = inputArray.findIndex(v => isNaN(v))

                    //     if (nonNumber > -1) {
                    //         error = `Not number in array for '${keyword}'. Found:${inputArray[nonNumber]}`
                    //         return
                    //     }
                    // }
                    output[keywordfound] = inputArray
                    return
                }
            }
            error = `No close bracket for '${keyword}'`
            // }
        }
    }
    grammar.forEach(phrase => {
        console.assert(Object.keys(phrase).length == 1, `Too many keys in phrase ${phrase}`)
        const keyword = Object.keys(phrase)[0]
        const type = phrase[keyword]
        if (Array.isArray(type)) {
            console.assert(type.length == 2, `Too many keys in type ${type}`)
            evalPhrase(keyword, type[0], type[1])
        }
        else
            evalPhrase(keyword, type)


        if (error == "") {
            const keywords = keyword.split("|")
            const kewordfound = keywords.findIndex(v => output[v.trim()] !== undefined)
            if (kewordfound == -1) {
                error = `No data for ${keyword}`
                return
            }
        }
    })
    if (error != "") return { isValid: false, error }
    const remainingTokenIndex = tokens.findIndex(v => v != "")
    if (remainingTokenIndex != -1) {
        error = `Extra token found: ${tokens[remainingTokenIndex]}`
        return { isValid: false, error, output }
    }

    return { isValid: true, error: "", output }
}
// //TO DO new grammar as objects
// const NEW_PLAN_GRAMMAR = {
//     options: {
//         // scopefrom: { default: 0 },
//         default: [{ scopefrom: 0 }],
//     },
//     start: "date",
//     end: "date",
//     scopefrom: "number",
//     scopeto: "number",
//     points: "[number]"
// }
// const NEW_COUNTIF_GRAMMAR = {
//     options: {
//         oneof: [["excludeif", "includeif"],],
//     },
//     excludeif: "col",
//     includeif: "col",
//     contains: "[any]"
// }
// const NEW_TREND_COMMON_GRAMMAR = {
//     options: {
//         oneof: [
//             ["changefrrom", "changeafter"],
//             ["forecastdays", "forecasto"],]
//     },
//     basisdays: "number",
//     forecastdays: "number",
//     forecasto: "date",
//     changefrrom: "date",
//     changeafter: "number",
//     count: "number"
// }
// const NEW_WOOPTION = {
//     basisdays: "number",
//     forecastdays: "number",
//     changefrrom: "date",
//     changeafter: "number",
//     count: "number"
// }
// function testnewgrammar() {
//     console.log(newtemplate(NEW_PLAN_GRAMMAR))
//     console.log(newtemplate(NEW_COUNTIF_GRAMMAR))
//     console.log(newtemplate(NEW_TREND_COMMON_GRAMMAR))
//     console.log(newtemplate(NEW_WOOPTION))
// }
// function newtemplate(grammar) {
//     const g = JSON.parse(JSON.stringify(grammar))
//     const { options } = g
//     delete g.options
//     for (const key in g) g[key] = g[key].toUpperCase()

//     function formatoneofs() {
//         if (!options) return
//         const oneofs = options.oneof
//         if (!oneofs) return
//         oneofs.forEach(oneof => {
//             if (!oneof) return
//             const keep = oneof[0]
//             let formatedvalue = g[keep]
//             for (let i = 1; i < oneof.length; i++) {
//                 formatedvalue += ` | ${oneof[i]}: ${g[oneof[i]]}`
//                 delete g[oneof[i]]
//             }
//             g[keep] = formatedvalue
//         })
//     }
//     formatoneofs()

//     let t = ""
//     for (const key in g) {
//         const prefixcomma = t != '' ? ', ' : ''
//         t += `${(prefixcomma)}${key}: ${g[key]}`

//     }
//     return t// JSON.stringify(g).toLowerCase()
// }

const PLAN_GRAMMAR = [{ start: "date" }, { end: "date" }, { scopefrom: ["Number", 0] }, { scopeto: "Number" }, { points: "arraynum" }]
//TO DO sort forecast

//basisdays _number_ forecasdays _number_ changefrom _date_ count _number_
const TREND_COMMON_GRAMMAR = [{ basisdays: "Number" }, { forecastdays: "Number" }, { changefrom: ["date", 0] }]
const TREND_FORECAST_GRAMMAR = [...TREND_COMMON_GRAMMAR, { count: ["Number", 1] }]
const TRENDOC_FORECAST_GRAMMAR = [...TREND_COMMON_GRAMMAR, { open: ["Number", 1] }, { close: ["Number", 1] }]
// const TREND_FORECAST_GRAMMAR = [{ from: "date" }, { count: "Number" }]
// const TRENDOC_FORECAST_GRAMMAR = [{ from: "date" }, { open: ["Number", 1] }, { close: ["Number", 1] }]


const plan_sigmoid = [0, 0.02, 0.05, 0.12, 0.27, 0.5, 0.73, 0.88, 0.95, 0.98, 1]
const plan_straight = [0, 1]


const COUNTIF_GRAMMAR = [{ "excludeif|includeif": "col" }, { "contains": "array" }]

function maketemplate(grammar) {
    let template = ""
    grammar.forEach(phrase => {
        console.assert(Object.keys(phrase).length == 1, `Too many keys in phrase ${phrase}`)
        const keyword = Object.keys(phrase)[0]
        template += keyword + " "
        const type = phrase[keyword]
        const typedisplay = (type) => type.toLowerCase().substring(0, 5) == "array" ? ` [_${type}_] ` : ` _${type}_ `
        if (Array.isArray(type)) {
            console.assert(type.length == 2, `Too many keys in type ${type}`)
            template += typedisplay(type[0]) + " "//"<" + type[0] + ">"
        }
        else
            template += typedisplay(type) + " "//"<" + type + "> "
    })
    return template.trim().toLowerCase()
}

function test_parseInput(showall = false) {
    function displayResult(input, grammar, valid) {
        const { isValid, error, output } = parseInput(input, grammar)
        const testrpassed = isValid == valid
        tests++
        testrpassed ? pass++ : fail++

        if (testrpassed) {
            if (showall) console.log({ tests, input, isValid, output, error })
            return
        }

        console.log({ tests, input, isValid, output, error })
    }

    let tests = 0, pass = 0, fail = 0, input

    //COUNTIF_GRAMMAR//////////////////////////////////////////
    input = "includeif level contains [pass fail]"
    displayResult(input, COUNTIF_GRAMMAR, true)
    input = "includeif level excludeif level contains (pass fail)"
    displayResult(input, COUNTIF_GRAMMAR, false)
    input = "excludeif level neq [pass fail]"
    displayResult(input, COUNTIF_GRAMMAR, true)
    input = "contains [pass fail] includeif level"
    displayResult(input, COUNTIF_GRAMMAR, true)
    input = "includeif level xxx [pass fail]"
    displayResult(input, COUNTIF_GRAMMAR, false)

    //PLAN_GRAMMAR////////////////////////////////////////
    input = "start 21-Apr-23 end 12-Nov-23 scopeto 300 points [0 1]"
    displayResult(input, PLAN_GRAMMAR, true)
    input = " end 12-Nov-23 scopeto 300 points [0 .2 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, true)
    input = " end 12-Nov-23 scopeto 300 scopefrom 10 points [0 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, true)

    input = " xxx end 12-Nov-23 scopeto 300 scopefrom 10 points [0 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    input = " end 12-Nov-23 scopeto 300 scopefrom 10 points [0, x 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    input = "start 21-Apr-23 end 12-Nov-23x scopeto 300 points [0 1]"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " scopeto 300 points [0 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " end 12-Nov-23 scopeto 30x0 scopefrom 10 points [0 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)
    input = " xxx end 12-Nov-23 scopeto 30x0 scopefrom 10 points [0 1] start 21-Apr-23"
    displayResult(input, PLAN_GRAMMAR, false)

    //TRENDOC_FORECAST_GRAMMAR/////////////////////////////////
    input = "from 21-Apr-23 open 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)
    input = "from 21-Apr-23 close 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)
    input = "from 21-Apr-23"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, true)

    input = "from 21-Apr-23 open"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)
    input = " 21-Apr-23 open 2"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)
    input = "from 21-xApr-23 open"
    displayResult(input, TRENDOC_FORECAST_GRAMMAR, false)

    //TREND_FORECAST_GRAMMAR/////////////////////////////////
    input = "from 21-Apr-23 count 2"
    displayResult(input, TREND_FORECAST_GRAMMAR, true)
    input = "count 3.2 from 21-Apr-23"
    displayResult(input, TREND_FORECAST_GRAMMAR, true)

    input = "from 21-Apr-23 count 2x"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)
    input = " 21-Apr-23 count 2"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)
    input = "from 21-xApr-23 open"
    displayResult(input, TREND_FORECAST_GRAMMAR, false)

    return { tests, pass, fail }

}
///////////////////////////adding countif
//step 1: add the following
//include countif in 
const COUNTIF_ELEMENT = {
    type: "input text",
    label: "Count if: ",
    onclick: "displayGrammerTemplate(this, COUNTIF_GRAMMAR)",
    // initialvalue: countif ?? "",
    returnvalue: "countif"
}

// {...COUNTIF_ELEMENT, initialvalue: countif ?? "",}


//include countif is save

