"use strict"
////////// try fetch
// function tryfetch() {
//     fetch("https://reqres.in/api/users")
//         .then(response => console.log(response))
//         .catch(error => console.log({ error: error }))
// }

// function readTextFile(file) {
//     var rawFile = new XMLHttpRequest();
//     rawFile.open("GET", file, false);
//     rawFile.onreadystatechange = function () {
//         if (rawFile.readyState === 4) {
//             if (rawFile.status === 200 || rawFile.status == 0) {
//                 var allText = rawFile.responseText;
//                 console.log(allText);
//             }
//         }
//     }
//     rawFile.send(null);
// }

function loadJSONFile(e) {
    if (e.files && e.files[0]) {
        var myFile = e.files[0]
        var reader = new FileReader()

        reader.addEventListener('load', function (e) {
            try {
                const configtext = e.target.result
                const tryobject = JSON.parse(configtext)
                $p.seConfigfromJSON(configtext)
            }
            catch (e) {
                const msg = `File not loaded. (${e})`
                // console.assert(false, msg)
                $dialog.alert(msg, ["OK"])
                return
            }
        })

        reader.readAsBinaryString(myFile)
    }
}
// function readlocalfile() {
//     var input = document.getElementById("file")
//     // input.type = "file"
//     // var body = document.getElementsByTagName("body")
//     input.setAttribute("onchange", "xxx(this)")
//     // input.addEventListener("change", function () {
//     //     if (this.files && this.files[0]) {
//     //         var myFile = this.files[0]
//     //         var reader = new FileReader()

//     //         reader.addEventListener('load', function (e) {
//     //             // output.textContent = e.target.result
//     //             console.log(e.target.result)
//     //         })

//     //         reader.readAsBinaryString(myFile)
//     //     }
//     // })
//     console.log(input)
//     input.value = ""
//     input.click()
// }

function downloadfile(data, name, type) {
    // const blob = new Blob([data], { type: "octet-stream" }) 
    const blob = new Blob([data], { type: type??"application/json"}) 
    const href = window.URL.createObjectURL(blob)
    const a = document.createElement("a") 
    
    Object.assign(a, {
        href,
        style: "display: none",
        download: name,
    })
    document.body.appendChild(a)

    if(a.click)
        a.click();
    else if(document.createEvent)
    {
        var eventObj = document.createEvent('MouseEvents');
        eventObj.initEvent('click',true,true);
        a.dispatchEvent(eventObj);
    }

    window.URL.revokeObjectURL(href)
    a.remove()
}



////////////////////////////////////////////////////// from download-csv
/////////////////////////  https://www.npmjs.com/package/download-csv?activeTab=readme

// const detectionClientType = () => { //added
// // module.exports = () => {         
//     const Sys = {};
//     const ua = navigator.userAgent.toLowerCase();
//     let s;
  
//     (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
//     (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
//     (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
//     (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
//     (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
  
//     // 以下进行测试
//     if (Sys.ie) return { name: 'IE', version: Sys.ie };
//     if (Sys.firefox) return { name: 'Firefox', version: Sys.firefox };
//     if (Sys.chrome) return { name: 'Chrome', version: Sys.chrome };
//     if (Sys.opera) return { name: 'Opera', version: Sys.opera };
//     if (Sys.safari) return { name: 'Safari', version: Sys.safari };
//     return { name: '' };
//   }

// //const detectionClientType = require('./detectionClientType');
// const downloadfile = (csvFile, filename = 'export.csv') => { 
// // module.exports = (csvFile, filename = 'export.csv') => {
//   if (!csvFile) {
//     console.log('the file is null')
//     return
//   }

//   const client = detectionClientType();
//   console.log(client)
//   const bomCode = '\ufeff';
//   let text = `data:attachment/csv;charset=utf-8,${bomCode}${encodeURIComponent(csvFile)}`;

//   if (window.Blob && window.URL && window.URL.createObjectURL) {
//     const csvData = new Blob([bomCode + csvFile], { type: 'text/csv' });
//     text = URL.createObjectURL(csvData);
//   }

//   if (client.name === 'IE') {
//     const oWin = window.top.open('about:blank', '_blank');
//     oWin.document.write(`sep=,\r\n${csvFile}`);
//     oWin.document.close();
//     oWin.document.execCommand('SaveAs', true, filename);
//     oWin.close();
//     return;
//   }

//   if (client.name === 'Safari') {
//     const link = document.createElement('a');
//     link.id = 'csvDwnLink';
//     document.body.appendChild(link);

//     const csv = bomCode + csvFile;
//     const csvData = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csv);

//     document.getElementById('csvDwnLink').setAttribute('href', csvData);
//     // document.getElementById('csvDwnLink').setAttribute('download', filename);
//     document.getElementById('csvDwnLink').click();

//     document.body.removeChild(link);
//     // alert('文件导出成功，请修改文件后缀为 .csv 后使用');
//     return;
//   }

//   if (client.name === 'Firefox') {
//     const a = document.createElement('a');
//     a.download = filename;
//     a.target = '_blank';
//     a.href = text;

//     const event = document.createEvent('MouseEvents');
//     event.initEvent('click', true, true);
//     a.dispatchEvent(event);
//     return;
//   }

//   // chrome and other browsers
//   const a = document.createElement('a');
//   a.download = filename;
//   a.href = text;
//   a.click();
// }