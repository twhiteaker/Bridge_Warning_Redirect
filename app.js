"use strict";


var currentDatasets = {
   datasetArray: [],
   title: ""
};


function showErr(err) {
   let spinner = document.getElementById("spinner");
   spinner.style.display = "none";
   alert(err.message);
}


function forwardData(data) {
   // Construct a URL like https://bridges.txdot.kisters.cloud/xs/?uuid=fa114aec-3a81-404d-840d-cd84f154ed05&list_flows=250.4,0.4,0.4,0.4,0.4,1.4,2.4,3.4,10.4,20.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4&first_utc_time=2024-04-24T16:00:00
   let url = new URL("https://bridges.txdot.kisters.cloud/xs/?" + new URLSearchParams(data));
   // Redirect to the URL
   window.location = url;
}


function plotNWPS(uuid, featureid) {

   function parseNWPS(json_text) {
      let data = JSON.parse(json_text);
      if (Object.hasOwn(data, "code")) {
         throw new Error("No data returned.\n" + data["message"]);
      }

      let node = "shortRange";
      let subnode = "series";

      // Parse the main series, which is "series" or the ensemble mean
      let values = data[node][subnode]["data"];
      let firstDatetime = values[0]["validTime"];  // e.g., "2024-04-23T02:00:00Z"
      // Reformat datetime like 2024-04-24T16:00:00
      firstDatetime = firstDatetime.replace("Z", "");
      // Concatenate the values[i]["flow"] values into a comma-separated string, like "250.4,0.4,0.4,0.4,0.4,1.4,2.4,3.4,10.4,20.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4"
      let flowValues = values.map((v) => v["flow"]).join(",");
      let result = {
         uuid: uuid,
         list_flows: flowValues,
         first_utc_time: firstDatetime
      }
      return result;
   }
   
   let uri = ("https://api.water.noaa.gov/nwps/v1/reaches/" +
      "{featureid}/streamflow?series=short_range");
   uri = uri.replace("{featureid}", featureid);
   console.log(uri);
   fetch(uri)
      .then((response) => response.text())
      .then((json_text) => parseNWPS(json_text))
      .then((data) => forwardData(data))
      .catch((err) => showErr(err));
}


function fetchAndPlot(uuid, featureid) {
   // Hide the form and about section, show the spinner
   document.getElementById("inputForm").style.display = "none";
   document.getElementById("about").style.display = "none";
   let spinner = document.getElementById("spinner");
   spinner.style.display = "block";
   let status = document.getElementById("status");
   status.style.display = "block";

   // Plot the data
   plotNWPS(uuid, featureid);
}


// When the window loads, read query parameters and plot data
window.onload = function () {
   // Don't allow scroll wheel to change feature ID
   document.addEventListener("wheel", function (event) {
      if (document.activeElement.type === "number" &&
         document.activeElement.classList.contains("noscroll")) {
         document.activeElement.blur();
      }
   });

   let params = new URLSearchParams(location.search);
   let uuid = params.get("uuid");
   let featureid = params.get("featureid");
   if (uuid && featureid) {
      fetchAndPlot(uuid, featureid);
   }

   if (uuid) {
      document.getElementById("uuid").value = uuid;
   }
   if (featureid) {
      document.getElementById("featureid").value = featureid;
   }
};
