//TODO
//error check: DOB must be earlier than DOM, 
//add interpretation - visual
//complete healthy weight range function by researching and finding out what is the WHO healthy weight range.
//graphing of BMI centile
//graphing of weight and height centile


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
const getZScore = (measurement, L, M, S) => {
  return L !== 0 ? (Math.pow(measurement / M, L) - 1) / (L * S) : Math.log(measurement / M) / S;
};


// Converts a Z score to a percentile.
// @param {number} z - The Z score.
// @returns {number} The percentile.
const getZPercent = (z) => {
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
* 4. EVENT HANDLERS
*/

//Handles the click event on the Calculate button.
const handleCalculateClick = () => {
  clearError();  // Clear any previous errors

  const gender = getGender();
  const [theAge, humanAge] = calculateAge();
  const weight = getWeight();
  const height = getHeight();
  const BMI = calculateBMI(weight, height);

  // Error checking
  if (!theAge || theAge < 0) {
      showError("Invalid Date of Birth or Date of Measurement.");
      return;
  }
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

  const z_bmi = getZScore(BMI, lms_bmi[0], lms_bmi[1], lms_bmi[2]);
  const z_wt = getZScore(weight, lms_wt[0], lms_wt[1], lms_wt[2]);
  const z_ht = getZScore(height, lms_ht[0], lms_ht[1], lms_ht[2]);

  const percentile_bmi = getZPercent(z_bmi);
  const percentile_wt = getZPercent(z_wt);
  const percentile_ht = getZPercent(z_ht);

  const interpret_bmi = interpretBMI(theAge, z_bmi);
  const weightrange = weightRange(lms_wt[0], lms_wt[1], lms_wt[2]);


  // Additional logic to update the chart
  const age = calculateAge()[0]; // Get age in days
  const bmi = calculateBMI(getWeight(), getHeight());
  const centileLines = centileData['bmi_data_WHO_0_5']; // or other relevant data

  updateChart(age, bmi, centileLines);

  displayResult(percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge);
};

//Sets up event listeners for the application.
const setupEventListeners = () => {
  document.getElementById("calcbutton").addEventListener("click", handleCalculateClick);
};




/*
* 5. DISPLAY AND ERROR HANDLING
*/ 

// Displays calculation results in the user interface
const displayResult = (percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge) => {
  document.getElementById("result-age").innerHTML = humanAge;
  document.getElementById("result-bminumber").innerHTML = `${calculateBMI(getWeight(), getHeight()).toFixed(1)}`;
  document.getElementById("result-bmi").innerHTML = `${formatPercentile(percentile_bmi)}<br><span class="z-score">z-score: ${z_bmi.toFixed(1)}</span>`;
  document.getElementById("result-wt").innerHTML = `${formatPercentile(percentile_wt)}<br><span class="z-score">z-score: ${z_wt.toFixed(1)}</span>`;
  document.getElementById("result-ht").innerHTML = `${formatPercentile(percentile_ht)}<br><span class="z-score">z-score: ${z_ht.toFixed(1)}</span>`;
  document.getElementById("result-it").innerHTML = `${interpret_bmi}`;
  document.getElementById("result-wr").innerHTML = `${weightrange}`;
};

// Formats a percentile for display.
// @param {number} percentile - The percentile to format.
// @returns {string} Formatted percentile.
const formatPercentile = (percentile) => {
  return `${(percentile * 100).toFixed(0)}th percentile`;
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

// Function to initialize the BMI chart
function initializeChart() {
    const ctx = document.getElementById('bmiChart').getContext('2d');
    bmiChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'BMI Centiles',
                data: [], // We will populate this later
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
                        text: 'BMI'
                    }
                }
            }
        }
    });
}

// Function to update the chart with new data
function updateChart(age, bmi) {
  // Get the selected gender
  const selectedGender = getGender();

  // Determine the dataset to use based on age
  let centileDataset;
  if (age <= 1857) { // Age 5 years or below
      centileDataset = centileData['bmi_data_WHO_0_5'].filter(entry => entry.gender === selectedGender);
  } else if (age <= 6935) { // Age between 5 and 19 years
      centileDataset = centileData['bmi_data_WHO_5_19'].filter(entry => entry.gender === selectedGender);
  } else {
      console.error("Age out of range for centile data.");
      return;
  }

    // Update the x-axis title and ticks based on the age range
    bmiChart.options.scales.x.title.text = age <= 1857 ? 'Age (Months)' : 'Age (Years)';
    bmiChart.options.scales.x.ticks = {
      callback: function(value, index, values) {
          if (age <= 1857) {
              const month = Math.round(value / 30.44);
              return month % 3 === 0 ? month : null; // Show only every 3rd month
          } else if (age > 1857 && value % 365 === 0) {
              return value / 365; // Convert days to years
          }
      },
      stepSize: age <= 1857 ? 30.44 * 3 : 365, // Use 3 times the month length for the 0-5 dataset
      autoSkip: false,
  };
  

  // Clear existing datasets except the first one (for centile lines)
  bmiChart.data.datasets = bmiChart.data.datasets.slice(0, 1);

  // Add patient's BMI data point
  bmiChart.data.datasets.push({
      label: 'Patient BMI',
      data: [{ x: age, y: bmi }],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      type: 'scatter'
  });

  // Process and add centile lines
  const centiles = [5, 10, 25, 50, 75, 85, 90, 95]; // Define required centiles
  centiles.forEach(centile => {
      const sampledCentileLine = centileDataset.filter((entry, index) => {
          // Sample the data
          if (age <= 1857) {
            return index % 12 === 0;
          } else if (age <= 6935) {
            return index % 1 === 0;
          }
      }).sort((a, b) => a.age_days - b.age_days) // Sort by age_days
      .map(entry => {
          return { x: entry.age_days, y: calculateCentileValue(entry, centile) };
      });

      bmiChart.data.datasets.push({
          label: `${centile}th Centile`,
          data: sampledCentileLine,
          borderColor: getRandomColor(),
          borderWidth: 1,
          pointRadius: 0.1, // Smaller point radius for a dot-like appearance
          pointHitRadius: 5, // Optional: Increase hit radius for easier interaction
          tension: 0.6, // Apply line smoothing (0 for no smoothing, 1 for maximum smoothing)
          showLine: true, // Ensure line is shown
          fill: false // No fill under the line
      });
  });

  bmiChart.update();
}



// Modified function to calculate centile value
function calculateCentileValue(entry, centile) {
  const zScore = getZScoreFromPercentile(centile / 100);
  return getMeasurementFromZ(zScore, entry.l, entry.m, entry.s);
}



// Modified function to convert a percentile into a Z score
function getZScoreFromPercentile(percentile) {
  let lower = -6;
  let upper = 6;
  let zScore = 0;
  let epsilon = 0.0001;
  
  while (Math.abs(upper - lower) > epsilon) {
    zScore = (upper + lower) / 2;
    const calculatedPercentile = getZPercent(zScore);

    if (calculatedPercentile > percentile) {
      upper = zScore;
    } else {
      lower = zScore;
    }
  }
  return zScore;
}



function calculateBMIForZScore(L, M, S, Z) {
  if (L !== 0) {
      return M * Math.pow(1 + L * S * Z, 1 / L);
  } else {
      return M * Math.exp(S * Z);
  }
}


function erfcinv(p) {
  let j = 0;
  let x = 0;
  let err = 0;
  let t = 0;
  let pp = 0;
  if (p >= 2) return -100;
  if (p <= 0) return 100;
  pp = (p < 1) ? p : 2 - p;
  t = Math.sqrt(-2 * Math.log(pp / 2));
  x = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
  for (j = 0; j < 2; j++) {
      err = erfc(x) - pp;
      x += err / (1.12837916709551257 * Math.exp(-Math.pow(x, 2)) - x * err);
  }
  return (p < 1) ? x : -x;
}

function erfc(x) {
  return 1 - erf(x);
}

function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return x < 0 ? -y : y;
}


// Function to generate random colors
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


// Initialize the chart when the window loads
window.onload = () => {
    fetchCentileData();
    initializeChart();
};
