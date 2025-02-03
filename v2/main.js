"use strict";

async function buttonReadFile() {
  const fileURL = document.querySelector(
    'input[name="file-name"]:checked'
  ).value;

  if (await fileExists(fileURL)) readFile(fileURL);
  else showFileNotAvailable();
}
function showFileNotAvailable() {
  const output = document.querySelector("#output");
  output.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = "xxx";
  output.append(p)
}
async function fileExists(fileURL) {
  if (!fileURL) return false;
  const exists = await remoteFileExistsFetch(fileURL);
  if (exists) return true;
  return false;
  async function remoteFileExistsFetch(url) {
    try {
      const response = await fetch(url, { method: "HEAD" }); // HEAD request
      // console.log(response)
      return response.ok; // 2xx status codes indicate success
    } catch (error) {
      console.log(error)
      return false; // Network error or other issue
    }
  }
}
function readFile(fileName) {
  readData();
  async function readData() {
    const output = document.querySelector("#output");
    output.innerHTML = "";
    let rowNumber=0
    await Papa.parse(fileName, {
      worker: true,
      download: true,
      preview: 5,
      header:false,
      step: function (row, parser) {
        const hasError = row.errors.length !== 0;
        const p = document.createElement("p");
        // p.textContent = JSON.stringify(row)

        p.textContent = hasError
          ? JSON.stringify(row.errors[0])
          : JSON.stringify(row.data);
        // console.log(row.data);
        output.append(p);
        if (hasError) parser.abort();
        rowNumber++;
      },
      error: function (error, file) {
        const p = document.createElement("p");
        p.textContent = JSON.stringify(error);
        console.log(error);
        output.append(p);
      },
      complete: function () {
        console.log(`Done, rows: ${rowNumber}`);
      },
    });
  }
}

/**
 * Reads a CSV file from Google Drive using PapaParse.
 *
 * @param {string} fileId The ID of the file in Google Drive.
 * @param {function} callback The callback function to be called with the parsed data.
 * @param {object} config The PapaParse configuration object (optional).
 */
function readCsvFromGoogleDrive(fileId, callback, config) {
  // Load the Google Drive API client library.
  gapi.client.load("drive", "v3", function () {
    // Get the file metadata to get the download URL.
    gapi.client.drive.files
      .get({
        fileId: fileId,
        alt: "media", //this is crucial for direct download
      })
      .then(
        function (response) {
          if (response && response.body) {
            // Directly parse the CSV content from the response body
            Papa.parse(response.body, {
              header: true, // If the first row contains headers
              dynamicTyping: true, // Automatically convert values to their type
              complete: function (results) {
                callback(results.data);
              },
              error: function (error) {
                console.error("PapaParse error:", error);
                callback(null, error); // Pass null data and the error
              },
              ...config, // Spread any additional config options
            });
          } else {
            console.error("Error retrieving file content:", response);
            callback(null, "Error retrieving file content");
          }
        },
        function (error) {
          console.error("Error getting file metadata:", error);
          callback(null, error);
        }
      );
  });
}

// Example usage:
// 1. Make sure you have included the PapaParse library in your HTML:
//    <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
// 2. Make sure you have initialized the Google API client and authorized the user.
// 3. Replace 'YOUR_FILE_ID' with the actual file ID.
// 4. Call the function:

function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client
    .init({
      apiKey: "YOUR_API_KEY",
      clientId: "YOUR_CLIENT_ID",
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
      ],
      scope: "https://www.googleapis.com/auth/drive.readonly",
    })
    .then(function () {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
      updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    })
    .catch(function (error) {
      console.error("Error initializing Google API client:", error);
    });
}

function updateSignInStatus(isSignedIn) {
  if (isSignedIn) {
    // User is signed in - proceed to use the Drive API
    let fileId = "YOUR_FILE_ID"; // Replace with your file ID
    readCsvFromGoogleDrive(fileId, function (data, error) {
      if (error) {
        console.error("Error reading or parsing CSV:", error);
        return;
      }
      console.log("CSV data:", data);
      // Process your CSV data here
      if (data && data.length > 0) {
        // Example: Accessing the first row of data
        console.log("First row:", data[0]);
      }
    });
  } else {
    // User is not signed in. Show the sign-in button.
    gapi.auth2.getAuthInstance().signIn();
  }
}
