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
