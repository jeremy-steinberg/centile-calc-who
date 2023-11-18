//TODO

//complete healthy weight range function by researching and finding out what is the WHO healthy weight range.
//add data points
//height velocities


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

// Calculates the age in days and human-readable format based on DOB and DOM.
// @returns {[number, string]} Age in days and human-readable age.
const calculateAge = () => {
  const DOBValue = document.getElementById('DOB').value;
  const DOMValue = document.getElementById('DOM').value;

  const DOB = moment(DOBValue, "DD/MM/YYYY");
  const DOM = moment(DOMValue, "DD/MM/YYYY");

  const ageInDays = DOM.diff(DOB, 'days');
  return [ageInDays, convertToYearsOld(DOB, DOM)];
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
  if (age > 1857) { // Above 5 years old
      return z_bmi > 2 ? "Obese" : z_bmi > 1 ? "Overweight" : z_bmi < -3 ? "Severe Thinness" : z_bmi < -2 ? "Thinness" : "Normal";
  } else if (age > 730 && age <= 1857) { // Ages 2 - 5
      return z_bmi > 3 ? "Obese" : z_bmi > 1.35 ? "Overweight" : z_bmi < -3 ? "Severe Thinness" : z_bmi < -2 ? "Thinness" : "Normal";
  } else { // Age < 2
      return "N/A for age < 2";

  }
};


//output the healthy weight range (note not BMI range)
//need to find out what is determined to be a healthy weight range.
const weightRange = (L, M, S) => {
  let healthyWeight = [getMeasurementFromZ(-2, L, M, S), getMeasurementFromZ(1, L, M, S)];
  return healthyWeight[0].toFixed(1) + " - " + healthyWeight[1].toFixed(1) + " kg";
};

/*
* 3. CORE CALCULATION FUNCTIONS
*/


// The two below functions parse the 0-5 year old and 5-19 year old datasets and returns the LMS values in an array.
// @param {string} dataType - The data type (e.g., 'bmi_data_WHO_0_5').
// @param {number} age_days - Age in days.
// @param {string} gender - Gender ('male' or 'female').
// @returns {[number, number, number]} LMS values.
const getLMSValues_0_5 = (dataType, age_days, gender) => {
  const array = centileData[dataType];
  const entry = array.find(item => item.gender === gender && item.age_days === age_days);
  return entry ? [entry.l, entry.m, entry.s] : [null, null, null];
};

const getLMSValues_5_19 = (dataType, age_months, gender) => {
  const array = centileData[dataType];
  const entry = array.find(item => item.gender === gender && item.age_months === age_months);
  return entry ? [entry.l, entry.m, entry.s] : [null, null, null];
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


// Converts a Z score to a percentile.
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


//Calculates measurement from a Z score.
//@param {number} z - The Z score.
//@param {number} L - L value from LMS data.
//@param {number} M - M value from LMS data.
//@param {number} S - S value from LMS data.
// @returns {number} The corresponding measurement.
const getMeasurementFromZ = (z, L, M, S) => {
  return L !== 0 ? Math.pow(z * L * S + 1, 1 / L) * M : M * Math.exp(S * z);
};



// Modified function to calculate centile value
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

//Handles the click event on the Calculate button.
// Handles the click event on the Calculate button.
const handleCalculateClick = () => {
  clearError();  // Clear any previous errors

  const [theAge, humanAge] = calculateAge();
  const weight = getWeight();
  const height = getHeight();
  const BMI = calculateBMI(weight, height);

  // Error checking
  if (!theAge || theAge < 0) {
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
  if (theAge < 1857) { // Age 0-5 years
    lms_bmi = getLMSValues_0_5('bmi_data_WHO_0_5', theAge, gender);
    lms_wt = getLMSValues_0_5('weight_data_WHO_0_5', theAge, gender);
    lms_ht = getLMSValues_0_5('height_data_WHO_0_5', theAge, gender);
  } else if (theAge <= 6970) { // Age 5-19 years
    const theAgeMonths = Math.ceil(theAge / 30.4375);
    lms_bmi = getLMSValues_5_19('bmi_data_WHO_5_19', theAgeMonths, gender);
    lms_wt = getLMSValues_5_19('weight_data_WHO_5_19', theAgeMonths, gender);
    lms_ht = getLMSValues_5_19('height_data_WHO_5_19', theAgeMonths, gender);
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

  const interpret_bmi = interpretBMI(theAge, z_bmi);
  const weightrange = weightRange(lms_wt[0], lms_wt[1], lms_wt[2]);

  // Update the charts with the new data
  updateCharts(theAge, BMI, weight, height);

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
  document.getElementById("result-bmi").innerHTML = `${formatPercentile(percentile_bmi)}<br><span class="z-score">z-score: ${z_bmi.toFixed(1)}</span>`;
  document.getElementById("result-it").innerHTML = `${interpret_bmi}`;

  // Update weight results
  document.getElementById("result-wt").innerHTML = `${formatPercentile(percentile_wt)}<br><span class="z-score">z-score: ${z_wt.toFixed(1)}</span>`;
  document.getElementById("result-wr").innerHTML = `${weightrange}`;

  // Update height results
  document.getElementById("result-ht").innerHTML = `${formatPercentile(percentile_ht)}<br><span class="z-score">z-score: ${z_ht.toFixed(1)}</span>`;
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
// Function to update BMI, Weight, and Height charts with new data
function updateCharts(age, bmi, weight, height) {
  // Get the selected gender
  const selectedGender = getGender();

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
                const month = Math.round(value / 30.44);
                return month % 3 === 0 ? month : undefined;
            } else {
                // Show every year for ages 5-19
                const year = Math.round(value / 365.25);
                return year;
            }
        },
        stepSize: age <= 1857 ? 30.44 * 3 : 365.25, // Step size adjusted for both age groups
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
  const centiles = [1, 5, 10, 25, 50, 75, 85, 90, 95, 99]; // Define required centiles
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
