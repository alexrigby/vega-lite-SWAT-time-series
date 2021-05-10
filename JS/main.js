

// Get the text value of a dataset from a URL
async function fetchData(url) {
  return await fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Could not load data: ${res.status}`);
      } else {
        return res.text();
      }
    });
}

function cleanCsvOutput(data) {
  const clean = d3.csvParse(data
    // Remove the header line produced by SWAT+ Editor
    .substring(data.indexOf('\n') + 1)
    // First, remove all spaces and replace with tabs
    .replace(/ +/gm, '')
    //might work, adds 0 in front of all single didgit numbers, test if vega-lite accepts it 
    .replace(/\b(\d{1})\b/g, '0$1')
    // Then remove all leading and trailing tabs
    //.replace(/^\t|\t$/gm)
  );
  //Gets the names of the output values (column headers) and add them to a select 
  //maybe better to delete unwanted headers by name? 
  const outputNames = clean.columns.splice(7)
  //console.log('Output Names', outputNames)
  const outputNameOptions = outputNames.map((el, i) => {
    return `<option value=${el}>${el}</option>`;
  });
  const outputOps = document.getElementById("output")
  outputOps.innerHTML = `${outputNameOptions}`
  window.OUTPUTOPS = [...outputNameOptions]
  //removes the line which displays units from output data
  const noUnits = clean.filter(clean => clean.flo_out != 'm^03/s');
  return clean
}

//Combines the day, month and year to make a new feild; "date"
function getDate(data) {
  const date = data.map(record => record.yr + '-' + record.mon + '-' + record.day);
  //  console.log('new date collumn', date);
  return date
}

//Gets the channel names from hru-data.hru
function getName(data) {
  const names = data.map(record => record.name);
  const namesUnique = new Set([...names]);
  return Array.from(namesUnique)
}


//Gets the data for the selected channels 
function getChannelData(data, name) {
  const filteredData = data.filter(record => record.name === name);
  // console.log("selected channel Data", filteredData);
  return filteredData
}





const dataset = fetchData('/data/TxtInOut/channel_sd_day.csv')
  .then(data => {

    const cleanOutput = cleanCsvOutput(data);
    // console.log(cleanOutput)
    //adds "date" to the array 
    const date = getDate(cleanOutput);
    for (var i = 0; i < cleanOutput.length; i++) {
      cleanOutput[i]['date'] = date[i];
    }

    //gets the channel names and adds  them to the select list
    const channelNames = getName(cleanOutput)
    const channelOptions = channelNames.map((el, i) => {
      return `<option value=${el}>${el}</option>`;
    });
    const chanOpts = document.getElementById("channel")
    chanOpts.innerHTML = `${channelOptions}`
    window.CHANOPS = [...channelOptions];

    //when user clicks plot button it filters the data for the selected output of the selected channel
    const plotButton = document.getElementById("plot")
    plotButton.addEventListener('click', () => {
      const channel = getChannelData(cleanOutput, chanOpts.value);
      // console.log('channel',channel)
      const outputOps = document.getElementById("output").value;
      // console.log(outputOps)

      // function returns the values of selected output
      const plotData = channel.map(el => (
        {
          date: el.date,
          [outputOps]: el[outputOps],
        }
      ));

      // const selectedOutput = channel.map(function (value, index) { return value[outputOps.value]; });

      console.log(outputOps, " for ", chanOpts.value, plotData)





      var original = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',


        "data": { "values": plotData },

        "vconcat": [{

          "width": "1350",
          "mark": "line",
          "encoding": {
            "x": {
              "timeUnit": "yearmonthdate",
              "field": "date",
              "title": "date",
              "type": "temporal",
              "scale": { "domain": { "param": "brush" } },
              "axis": { "title": "" }
            },
            "y": {
              "field": [outputOps],
              "type": "quantitative",
              // "title": "flow (m³/s)",
            }
          }
        }, {
          "width": "1350",
          "height": 60,
          "mark": "line",
          "params": [{
            "name": "brush",
            "select": { "type": "interval", "encodings": ["x"] }
          }],
          "encoding": {
            "x": {
              "timeUnit": "yearmonthdate",
              "field": "date",
              "title": "date",
              "type": "temporal"
            },
            "y": {
              "field": [outputOps],
              "type": "quantitative",
              "axis": { "tickCount": 3, "grid": false },
            }
          }
        }]
      }

      vegaEmbed('#vis', original);


    })

  });

function cleanTxtOutput(data) {
  return d3.tsvParse(data
    // Remove the header line produced by SWAT+ Editor
    .substring(data.indexOf('\n') + 1)
    // First, remove all spaces and replace with tabs
    .replace(/  +/gm, '\t')
    // Then remove all leading and trailing tabs
    .replace(/^\t|\t$/gm, '')
  );
}

//finds channel with 0 out_tot in chandeg.con to find the main channel
function getMainChan(data) {
  const filteredData = data.filter(record => record.out_tot == 0);
  return filteredData[0].name
}

const chanadeg = fetchData('data/TxtInOut/chandeg.con')
  .then(data => {
    //clean txt file
    const clean = cleanTxtOutput(data);
    //finds name of the main channnel
    const mainChan = getMainChan(clean)
    //console.log('main channel name', mainChan)

    //channel select
    const channel = document.getElementById('channel')
    //output select
    const output = document.getElementById('output')
    //selects the main chanel to plot
    const mainChanButton = document.getElementById('mainChan')
    mainChanButton.addEventListener('click', () => {
      channel.innerHTML = `<option value=${mainChan}>${mainChan}</option>`;
    });
    //selcets flo_out to plot
    const floOutButton = document.getElementById('floOut')
    floOutButton.addEventListener('click', () => {
      output.innerHTML = `<option value=flo_out>flo_out</option>`;
    })

    //resets both selections 
    const resetPlot = document.getElementById("resetPlot")
    resetPlot.addEventListener('click', () => {
      channel.innerHTML = `${window.CHANOPS}`
      output.innerHTML = `${window.OUTPUTOPS}`
    })
  });



