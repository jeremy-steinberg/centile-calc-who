//TODO

//complete healthy weight range function by researching and finding out what is the WHO healthy weight range.
//add data points
//height velocities
//Modify labelling, when hovering over a centile line should just show the name of the line
// Take inspiration from: https://growth.rcpch.ac.uk/
// Math info to cross reference: https://growth.rcpch.ac.uk/clinician/how-the-api-works
// Add correction for gestation
// Zoom and pan function for charts
// Colors of lines - if manage to label things properly, then make pink for girls and blue for boys and alternate solid and dashed lines
/*
* 1. DATA FETCHING AND INITIALIZATION
*/

const centileData = {};


// Change 'data.json' to '/bmi-calculator-data-json' when running on wordpress with my custom plugin.
const fetchCentileData = async () => {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        Object.assign(centileData, await response.json());
        setupEventListeners(); // Set up event listeners after data is loaded
    } catch (error) {
        console.error('Could not fetch centile data:', error);
    }
};

window.onload = fetchCentileData; // Fetch data when the window loads



  
/*
* 2 UTILITY FUNCTIONS
*/

// @returns {string} The selected gender.
const getGender = () => document.querySelector('input[name="gender"]:checked').value;

// Calculates the age in days, human-readable format, and decimal years based on DOB and DOM.
// @returns {[number, string, number]} Age in days and human-readable age.
// The decimalAge accounts for leap years.
const calculateAge = () => {
  const DOBValue = document.getElementById('DOB').value;
  const DOMValue = document.getElementById('DOM').value;

  const DOB = moment(DOBValue, "DD/MM/YYYY");
  const DOM = moment(DOMValue, "DD/MM/YYYY");

  const ageInDays = DOM.diff(DOB, 'days');
  const decimalAge = ageInDays / 365.25;
  
  return [ageInDays, convertToYearsOld(DOB, DOM), decimalAge];
};

//Converts age from date format to a human-readable format (years, months, days).
//@param {moment} DOB - Date of birth.
//@param {moment} DOM - Date of measurement.
//@returns {string} Human-readable age.
const convertToYearsOld = (DOB, DOM) => {
  const years = DOM.diff(DOB, 'years');
  DOB.add(years, 'years');

  const months = DOM.diff(DOB, 'months');
  DOB.add(months, 'months');

  const days = DOM.diff(DOB, 'days');

  return `${years} ${pluralize(years, 'year')} ${months} ${pluralize(months, 'month')} ${days} ${pluralize(days, 'day')}`;
};

// Retrieves the weight input from the form. @returns {number} Weight value.
const getWeight = () => Number(document.getElementById("theweight").value);

// Retrieves the height input from the form. @returns {number} Height value.
const getHeight = () => Number(document.getElementById("theheight").value);

// Function to get ordinal e.g. 1st instead of 1th
const getOrdinalFor = intNum => {
  const ordinals = ["th", "st", "nd", "rd"];
  const v = intNum % 100;
  return intNum + (ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0]);
};

// Function to generate random colors
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//Interprets BMI based on age and Z score.
//@param {number} age - Age in days.
//@param {number} z_bmi - BMI Z score.
//@returns {string} Interpretation of the BMI.
const interpretBMI = (age, z_bmi) => {
  let info = "<br><span class='BMI-criteria'>Based on WHO definitions</span>"
  if (age > 1857) { // Above 5 years old
      return z_bmi > 2 ? "Obese" + info : z_bmi > 1 ? "Overweight" + info : z_bmi < -2 ? "Underweight" + info  : "Normal" + info ;
  } else if (age <= 1857) { // Ages birth - 5
      return z_bmi > 3 ? "Obese" + info : z_bmi > 2 ? "Overweight" + info : z_bmi < -2 ? "Underweight" + info  : "Normal" + info ;
  } 

};


// Function to output the healthy weight range and corresponding z-score range (5-85th centiles), not accounting for height
const weightRange = (L, M, S) => {
  // Calculate the weights for the 5th and 85th percentiles
  let healthyWeight = [
    getMeasurementFromZ(getZScoreFromPercentile(0.05), L, M, S), 
    getMeasurementFromZ(getZScoreFromPercentile(0.85), L, M, S)
  ];

  // Format and return the weight range and centile range
  return healthyWeight[0].toFixed(1) + " - " + healthyWeight[1].toFixed(1) + " kg" +
    "<br><span class='centile-range'>Using centile range: 5th to 85th</span>";
};

//Calculate healthy weight range for child's height
const healthyWeightRange = (L, M, S, height) => {
  let bmi5th = getMeasurementFromZ(getZScoreFromPercentile(0.02), L, M, S);
  let bmi85th = getMeasurementFromZ(getZScoreFromPercentile(0.91), L, M, S);

  let weight5th = bmi5th * (height / 100) ** 2;
  let weight85th = bmi85th * (height / 100) ** 2;

  return weight5th.toFixed(1) + " - " + weight85th.toFixed(1) + " kg" +
  "<br><span class='centile-range'>Using BMI centile range: 2nd to 91st</span>";
};




function toggleInfoBar() {
  var infoBar = document.getElementById("infoBar");
  var toggleButton = document.querySelector("button[onclick='toggleInfoBar()']");
  var toggleIcon = document.getElementById("toggleIcon");

  // Define the SVG icons for open and close states
  var openIcon = '<svg style="width: 20px; height: 7px; padding-left: 5px;" viewBox="0 0 12 8"><polygon points="1.4,7.4 0,6 6,0 12,6 10.6,7.4 6,2.8" fill="black"></polygon></svg>';
  var closeIcon = '<svg style="width: 20px; height: 7px; padding-left: 5px;" viewBox="0 0 12 8"><path d="M1.4.6L0 2l6 6 6-6L10.6.6 6 5.2" fill-rule="nonzero" fill="#fff"></path></svg>';

  if (infoBar.style.display === "none") {
      infoBar.style.display = "block";
      toggleIcon.innerHTML = closeIcon; // Set to close icon when opened
      toggleButton.classList.remove("closedButton");
      toggleButton.classList.add("openButton");
  } else {
      infoBar.style.display = "none";
      toggleIcon.innerHTML = openIcon; // Set to open icon when closed
      toggleButton.classList.remove("openButton");
      toggleButton.classList.add("closedButton");
  }
}



/*
* 3. CORE CALCULATION FUNCTIONS
*/


// The two below functions parse the 0-5 year old and 5-19 year old datasets and returns the LMS values in an array.
// It uses cubic interpolation if not exactly at a reference point.
// @param {string} dataType - The data type (e.g., 'bmi_data_WHO_0_5').
// @param {number} age_days - Age in days.
// @param {string} gender - Gender ('male' or 'female').
// @returns {[number, number, number]} LMS values.
const getLMSValues_0_5 = (dataType, age_days, gender) => {
  const array = centileData[dataType];
  const entry = array.find(item => item.gender === gender && item.age_days === age_days);

  if (entry) {
    return [entry.l, entry.m, entry.s];
  } else {
    const closestAges = array.filter(item => item.gender === gender)
      .map(item => item.age_days)
      .sort((a, b) => Math.abs(age_days - a) - Math.abs(age_days - b))
      .slice(0, 4);

    const [t0, t1, t2, t3] = closestAges;
    const [y0_l, y0_m, y0_s] = getLMS(dataType, t0, gender);
    const [y1_l, y1_m, y1_s] = getLMS(dataType, t1, gender);
    const [y2_l, y2_m, y2_s] = getLMS(dataType, t2, gender);
    const [y3_l, y3_m, y3_s] = getLMS(dataType, t3, gender);

    const l = cubicInterpolation(age_days, t0, t1, t2, t3, y0_l, y1_l, y2_l, y3_l);
    const m = cubicInterpolation(age_days, t0, t1, t2, t3, y0_m, y1_m, y2_m, y3_m);
    const s = cubicInterpolation(age_days, t0, t1, t2, t3, y0_s, y1_s, y2_s, y3_s);

    return [l, m, s];
  }
};

const getLMSValues_5_19 = (dataType, age_months, gender) => {
  const array = centileData[dataType];
  const entry = array.find(item => item.gender === gender && item.age_months === age_months);

  if (entry) {
    return [entry.l, entry.m, entry.s];
  } else {
    const closestAges = array.filter(item => item.gender === gender)
      .map(item => item.age_months)
      .sort((a, b) => Math.abs(age_months - a) - Math.abs(age_months - b))
      .slice(0, 4);

    const [t0, t1, t2, t3] = closestAges;
    const [y0_l, y0_m, y0_s] = getLMS(dataType, t0, gender);
    const [y1_l, y1_m, y1_s] = getLMS(dataType, t1, gender);
    const [y2_l, y2_m, y2_s] = getLMS(dataType, t2, gender);
    const [y3_l, y3_m, y3_s] = getLMS(dataType, t3, gender);

    const l = cubicInterpolation(age_months, t0, t1, t2, t3, y0_l, y1_l, y2_l, y3_l);
    const m = cubicInterpolation(age_months, t0, t1, t2, t3, y0_m, y1_m, y2_m, y3_m);
    const s = cubicInterpolation(age_months, t0, t1, t2, t3, y0_s, y1_s, y2_s, y3_s);

    return [l, m, s];
  }
};


//Calculates the Z score based on the measurement and LMS values.
//@param {number} measurement - The measurement (e.g., BMI, weight, height).
//@param {number} L - L value from LMS data.
//@param {number} M - M value from LMS data.
//@param {number} S - S value from LMS data.
//@returns {number} The Z score.
const getZScoreFromLMS = (measurement, L, M, S) => {
  return L !== 0 ? (Math.pow(measurement / M, L) - 1) / (L * S) : Math.log(measurement / M) / S;
};


// Converts a Z score to a percentile (fraction of 1, e.g. 0.5, so 50th centile is represented as 0.5).
// @param {number} z - The Z score.
// @returns {number} The percentile.

const getPercentileFromZScore = (z) => {
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);

  while(Math.abs(term) > loopStop) {
      term = .3989422804 * Math.pow(-1, k) * Math.pow(z, k) / (2 * k + 1) / Math.pow(2, k) * Math.pow(z, k + 1) / factorial(k);
      sum += term;
      k++;
  }

  return 0.5 + sum;
};


//Calculates factorial of a number.
//@param {number} n - The number.
//@returns {number} Factorial of n.
const factorial = (n) => {
  let fact = 1;
  for (let i = 2; i <= n; i++) {
      fact *= i;
  }
  return fact;
};

//Cubic Interpolation
// Currently the tool uses nearest age for L, M, and S values, while the reference standard suggests using cubic interpolation if your data points do not fall exactly on the given ages. 
// Could apply cubic interpolation to get accurate values whenever need L, M, and S values
// Would need to handle situation where age falls close to reference threshold, and use linear interpolation
const cubicInterpolation = (t, t0, t1, t2, t3, y0, y1, y2, y3) => {
  return (y0 * (t - t1) * (t - t2) * (t - t3)) / ((t0 - t1) * (t0 - t2) * (t0 - t3))
       + (y1 * (t - t0) * (t - t2) * (t - t3)) / ((t1 - t0) * (t1 - t2) * (t1 - t3))
       + (y2 * (t - t0) * (t - t1) * (t - t3)) / ((t2 - t0) * (t2 - t1) * (t2 - t3))
       + (y3 * (t - t0) * (t - t1) * (t - t2)) / ((t3 - t0) * (t3 - t1) * (t3 - t2));
};



//Calculates measurement from a Z score.
//@param {number} z - The Z score.
//@param {number} L - L value from LMS data.
//@param {number} M - M value from LMS data.
//@param {number} S - S value from LMS data.
// @returns {number} The corresponding measurement.
const getMeasurementFromZ = (z, L, M, S) => {
  return L !== 0 ? Math.pow(z * L * S + 1, 1 / L) * M : M * Math.exp(S * z);
};



//  function to calculate centile value
function calculateCentileValue(entry, centile) {
  const zScore = getZScoreFromPercentile(centile / 100);
  return getMeasurementFromZ(zScore, entry.l, entry.m, entry.s);
}



// Convert a percentile into a Z score
function getZScoreFromPercentile(percentile) {
  let lower = -6;
  let upper = 6;
  let zScore = 0;
  let epsilon = 0.0001;
  
  while (Math.abs(upper - lower) > epsilon) {
    zScore = (upper + lower) / 2;
    const calculatedPercentile = getPercentileFromZScore(zScore);

    if (calculatedPercentile > percentile) {
      upper = zScore;
    } else {
      lower = zScore;
    }
  }
  return zScore;
}



// Calculates BMI. @param {number} weight - The weight in kilograms. @param {number} height - The height in centimeters.
// @returns {number} The calculated BMI.
const calculateBMI = (weight, height) => weight / (height / 100) ** 2;

// Basic pluralization utility function. 
// @param {number} count - The number to be evaluated.
// @param {string} singular - Singular form of the word.
// @param {string} [plural] - Plural form of the word (optional).
// @returns {string} Correct form of the word based on the count.
const pluralize = (val, word, plural = word + 's') => {
  const _pluralize = (num, word, plural = word + 's') =>
    [1, -1].includes(Number(num)) ? word : plural;
  if (typeof val === 'object') return (num, word) => _pluralize(num, word, val[word]);
  return _pluralize(val, word, plural);
};

/*
* 4. EVENT HANDLERS
*/

// Handles the click event on the Calculate button.
const handleCalculateClick = () => {
  clearError();  // Clear any previous errors

  const [ageInDays, humanAge, decimalAge] = calculateAge();
  const decimalAgeYears = decimalAge * 365.25;
  const weight = getWeight();
  const height = getHeight();
  const BMI = calculateBMI(weight, height);

  // Error checking
  if (!ageInDays || ageInDays < 0) {
    showError("Invalid Date of Birth or Date of Measurement.");
    return;
  }

  const genderSelected = document.querySelector('input[name="gender"]:checked');
  if (!genderSelected) {
    showError("Please select a gender.");
    return;
  }

  const gender = genderSelected.value;

  if (!weight || !height) {
    showError("Please enter both weight and height.");
    return;
  }

  let lms_bmi, lms_wt, lms_ht;
  if (decimalAgeYears < 5 * 365.25) { // Age 0-5 years
    lms_bmi = getLMSValues_0_5('bmi_data_WHO_0_5', ageInDays, gender);
    lms_wt = getLMSValues_0_5('weight_data_WHO_0_5', ageInDays, gender);
    lms_ht = getLMSValues_0_5('height_data_WHO_0_5', ageInDays, gender);
  } else if (decimalAgeYears <= 19 * 365.25) { // Age 5-19 years
    const ageInMonths = Math.ceil(ageInDays / 30.4375);
    lms_bmi = getLMSValues_5_19('bmi_data_WHO_5_19', ageInMonths, gender);
    lms_wt = getLMSValues_5_19('weight_data_WHO_5_19', ageInMonths, gender);
    lms_ht = getLMSValues_5_19('height_data_WHO_5_19', ageInMonths, gender);
  } else {
    showError("Age out of range.");
    return;
  }






  const z_bmi = getZScoreFromLMS(BMI, lms_bmi[0], lms_bmi[1], lms_bmi[2]);
  const z_wt = getZScoreFromLMS(weight, lms_wt[0], lms_wt[1], lms_wt[2]);
  const z_ht = getZScoreFromLMS(height, lms_ht[0], lms_ht[1], lms_ht[2]);

  const percentile_bmi = getPercentileFromZScore(z_bmi);
  const percentile_wt = getPercentileFromZScore(z_wt);
  const percentile_ht = getPercentileFromZScore(z_ht);

  const interpret_bmi = interpretBMI(ageInDays, z_bmi);
  
  //alternate approach to calculate healthy weight range without taking into account height
  //const weightrange = weightRange(lms_wt[0], lms_wt[1], lms_wt[2]);

  //calculate healthy weight range based on height
  const weightrange = healthyWeightRange(lms_bmi[0], lms_bmi[1], lms_bmi[2], height);

  // Update the charts with the new data
  updateCharts(ageInDays, BMI, weight, height);

  // Display the results
  displayResult(percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge);
};


function switchTab(selectedTab) {
  // Define the canvas IDs corresponding to each tab
  var canvasIds = ['bmiChart', 'weightChart', 'heightChart'];

  // Get all tab buttons
  var tabButtons = document.getElementsByClassName('tab-button');

  // Loop through each tab button
  for (var i = 0; i < tabButtons.length; i++) {
      // Check if the current tab button matches the selected tab
      if (tabButtons[i].getAttribute('onclick') === "switchTab('" + selectedTab + "')") {
          // If it matches, add the "active" class
          tabButtons[i].classList.add('active');
      } else {
          // Otherwise, remove the "active" class
          tabButtons[i].classList.remove('active');
      }
  }

  // Loop through each canvas ID
  canvasIds.forEach(function (id) {
      // Get the canvas element by ID
      var canvas = document.getElementById(id);

      // Check if the current canvas ID matches the selected tab
      if (id === selectedTab + 'Chart') {
          // If it matches, display the canvas
          canvas.style.display = 'block';
      } else {
          // Otherwise, hide the canvas
          canvas.style.display = 'none';
      }
  });
}

    // Set the BMI tab as active when the page is first loaded
  document.addEventListener("DOMContentLoaded", function() {
      switchTab("bmi");
  });


//Sets up event listeners for the application.
const setupEventListeners = () => {
  document.getElementById("calcbutton").addEventListener("click", handleCalculateClick);
};




/*
* 5. DISPLAY AND ERROR HANDLING
*/ 

// Displays calculation results in the user interface
// Displays calculation results in the user interface
const displayResult = (percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge) => {
  // Update age display
  document.getElementById("result-age").innerHTML = humanAge;

  // Update BMI results
  document.getElementById("result-bminumber").innerHTML = `${calculateBMI(getWeight(), getHeight()).toFixed(1)}`;
  document.getElementById("result-bmi").innerHTML = `${formatPercentile(percentile_bmi)}<br><span class="z-score">z-score: ${z_bmi.toFixed(3)}</span>`;
  document.getElementById("result-it").innerHTML = `${interpret_bmi}`;

  // Update weight results
  document.getElementById("result-wt").innerHTML = `${formatPercentile(percentile_wt)}<br><span class="z-score">z-score: ${z_wt.toFixed(3)}</span>`;
  document.getElementById("result-wr").innerHTML = `${weightrange}`;

  // Update height results
  document.getElementById("result-ht").innerHTML = `${formatPercentile(percentile_ht)}<br><span class="z-score">z-score: ${z_ht.toFixed(3)}</span>`;
};


// Formats a percentile for display.
// @param {number} percentile - The percentile to format.
// @returns {string} Formatted percentile.
const formatPercentile = (percentile) => {
  return `${getOrdinalFor((percentile * 100).toFixed(0))} percentile`;
};



//Displays an error message.
//@param {string} message - The error message to display.
const showError = (message) => {
  const errorElement = document.getElementById("error-message");
  errorElement.innerHTML = message;
  errorElement.style.display = 'block';
};

//Clears any displayed error message.
const clearError = () => {
  const errorElement = document.getElementById("error-message");
  errorElement.innerHTML = '';
  errorElement.style.display = 'none';
};

// Global variable to hold the chart instance
let bmiChart;


/*
* 6. CHART FUNCTIONS
*/

// Function to initialize BMI, Weight, and Height charts
function initializeCharts() {
  initializeChart('bmiChart', 'BMI');
  initializeChart('weightChart', 'Weight');
  initializeChart('heightChart', 'Height');
}

// Helper function to initialize a specific chart
function initializeChart(chartId, label) {
  const ctx = document.getElementById(chartId).getContext('2d');
  window[chartId] = new Chart(ctx, {
      type: 'line',
      data: {
          datasets: [{
              label: `${label} Centiles`,
              data: [], // Data will be populated later
              backgroundColor: 'rgba(0, 123, 255, 0.5)',
              borderColor: 'rgba(0, 123, 255, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true, // Enable responsive settings
          maintainAspectRatio: false,
          scales: {
              x: {
                  type: 'linear',
                  position: 'bottom',
                  title: {
                      display: true,
                      text: 'Age (Days)'
                  }
              },
              y: {
                  title: {
                      display: true,
                      text: label
                  }
              }
          }
      }
  });
}

// Function to update the chart with new data
function updateCharts(age, bmi, weight, height) {
  // Get the selected gender
  const selectedGender = getGender();

  let centileHeading = document.getElementById("centileHeading").innerHTML;

  if (selectedGender == "female") {
    centileHeading = "Girls Centile Charts";
    document.getElementById("centileHeading").style.color = "#f448a3";
  } else if (selectedGender == "male") {
    centileHeading = "Boys Centile Charts";
    document.getElementById("centileHeading").style.color = "#009cd5";
  }

  if (age > 1857) { // Above 5 years old
    centileHeading += "<br><span style='font-size:0.8em'>5-19 years</span>"
  } else if (age <= 1857) { // Ages birth - 5
    centileHeading += "<br><span style='font-size:0.8em'>0-5 years</span>";
  }

  // Update the innerHTML of the centileHeading element
  document.getElementById("centileHeading").innerHTML = centileHeading;
  
  // Update each chart with the relevant data
  updateChart(age, bmi, 'bmiChart', 'bmi_data_WHO_0_5', 'bmi_data_WHO_5_19', selectedGender);
  updateChart(age, weight, 'weightChart', 'weight_data_WHO_0_5', 'weight_data_WHO_5_19', selectedGender);
  updateChart(age, height, 'heightChart', 'height_data_WHO_0_5', 'height_data_WHO_5_19', selectedGender);
}


// Helper function to update a specific chart
function updateChart(age, measurement, chartId, dataKeyUnder5, dataKeyOver5, selectedGender) {
  // Determine the dataset to use based on age
  let centileDataset;
  if (age <= 1857) { // Age 5 years or below
      centileDataset = centileData[dataKeyUnder5].filter(entry => entry.gender === selectedGender);
  } else if (age <= 6970) { // Age between 5 and 19 years
      centileDataset = centileData[dataKeyOver5].filter(entry => entry.gender === selectedGender);
  } else {
      console.error("Age out of range for centile data.");
      return;
  }

  // Process and update the chart
  processAndUpdateChartData(age, measurement, centileDataset, chartId);
}

// Function to process and update chart data
function processAndUpdateChartData(age, measurement, centileDataset, chartId) {
  const chart = window[chartId]; // Reference the specific chart instance

  // Clear existing datasets except the first one (for centile lines)
  chart.data.datasets = chart.data.datasets.slice(0, 1);

      // Adjust x-axis based on age
    chart.options.scales.x.title.text = age <= 1857 ? 'Age (Months)' : 'Age (Years)';
    chart.options.scales.x.ticks = {
        callback: function(value) {
            if (age <= 1857) { 
                // Convert days to months and show every 3 months for ages 0-5
                const month = Math.round(value / 30.4375);
                return month % 3 === 0 ? month : undefined;
            } else {
                // Show every year for ages 5-19
                const year = Math.round(value / 365.25);
                return year;
            }
        },
        stepSize: age <= 1857 ? 30.4375 * 3 : 365.25, // Step size adjusted for both age groups
        autoSkip: false, // Disable auto-skipping of ticks
    };

  // Add patient's data point (BMI, weight, or height)
  chart.data.datasets.push({
      label: `Patient's ${chartId.replace('Chart', '')}`,
      data: [{ x: age, y: measurement }],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      type: 'scatter'
  });

  // Process and add centile lines
  const centiles = [3, 10, 25, 50, 75, 90, 97]; // Define required centiles
  centiles.forEach(centile => {
      const sampledCentileLine = centileDataset.filter((entry, index) => {
          // Sample the data (every 12th entry for age <= 5 years, every entry for age > 5 years)
          return age <= 1857 ? index % 12 === 0 : true;
      }).sort((a, b) => a.age_days - b.age_days) // Sort by age_days
      .map(entry => {
          return { x: entry.age_days, y: calculateCentileValue(entry, centile) };
      });

      let centileBorderWidth = centile === 50 ? 3 : 1; // Highlight the 50th centile
      let centileColor = centile === 50 ? "green" : getRandomColor();

      chart.data.datasets.push({
          label: `${getOrdinalFor(centile)} Centile`,
          data: sampledCentileLine,
          borderColor: centileColor,
          borderWidth: centileBorderWidth,
          pointRadius: 0.1, // Dot-like appearance
          pointHitRadius: 10, // Easier interaction
          tension: 0.6, // Line smoothing
          showLine: true,
          fill: false
      });
  });

  chart.update(); // Update the chart with new data
}





// Initialize the chart when the window loads
window.onload = () => {
    fetchCentileData();
    initializeCharts();
};
