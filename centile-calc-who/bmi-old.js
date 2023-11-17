//TODO
//data as JSON??
//error check: DOB must be earlier than DOM, 
//add interpretation - visual
//complete healthy weight range function by researching and finding out what is the WHO healthy weight range.
//graphing of BMI centile
//graphing of weight and height centile
  
let centileData = {};

async function fetchCentileData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        centileData = await response.json();
    } catch (error) {
        console.error('Could not fetch centile data:', error);
    }
}

// Call the function to fetch data when the page loads
fetchCentileData();
  

// parse the 0-5 year old datasets and return a the lms values in an array
function getLMSValues_0_5(dataType, age_days, gender) {
  const array = centileData[dataType]; // Accessing the correct dataset
  for (let i = 0, l = array.length; i < l; i++) {
      if (array[i].gender === gender && array[i].age_days === age_days) {
          return [array[i].l, array[i].m, array[i].s];
      }
  }
}

// parse the 5-19 year old datasets and return a the lms values in an array
function getLMSValues_5_19(dataType, age_months, gender) {
  const array = centileData[dataType]; // Accessing the correct dataset
  for (let i = 0, l = array.length; i < l; i++) {
      if (array[i].gender === gender && array[i].age_months === age_months) {
          return [array[i].l, array[i].m, array[i].s];
      }
  }
}



// get the gender from the radio button
function getGender(){
  if (document.getElementById("male").checked){
    return "male";
  }
  if (document.getElementById("female").checked){
    return "female";
  } 
}


//calculate age in days as the difference between date of birth and todays date. note WHO uses value of 30.4375 days to one month
//returns an array, item 0 is age in days, item 1 is human age as years + months + days
function calculateAge(){
  var DOB = document.getElementById('DOB').value; //DOB = date of birth
  var DOM = document.getElementById('DOM').value; //DOM = date of measurement

  //convert DOB - NZ to US formatting to allow for calculations
  var DOB_US = moment(DOB, "DD/MM/YYYY").format("MM/DD/YYYY");
  var DOBasdate = moment(DOB_US, "MM/DD/YYYY");

  //convert DOM - NZ to US formatting to allow for calculations
  var DOM_US = moment(DOM, "DD/MM/YYYY").format("MM/DD/YYYY");
  var DOMasdate = moment(DOM_US, "MM/DD/YYYY");

  //calculate difference in days between DOM and date of birth
  var ageInDays = DOMasdate.diff(DOBasdate, 'days');
  var humanAge = convertToYearsOld(DOBasdate, DOMasdate);

  return [ageInDays,humanAge];




}

//convert to a string showing how old in years, months, and days. DOB = date of birth, DOM = date of measurement.
function convertToYearsOld(DOB, DOM){

  var DOB = moment(DOB, "MM/DD/YYYY");
  var years = DOM.diff(DOB, 'year');
  DOB.add(years, 'years');
  var months = DOM.diff(DOB, 'months');
  DOB.add(months, 'months');
  var days = DOM.diff(DOB, 'days');

  return years + pluralize(years, ' year') + " " + months + pluralize(months, ' month') + " " + days + pluralize(days, ' day');
}


//gets the weight from the form
function getWeight() {
  var weight = Number(document.getElementById("theweight").value);
    return weight;
}
 
 //gets the height from the form
function getHeight() {
  var height = Number(document.getElementById("theheight").value);
    return height;

}

//calculates the BMI
function getBMI() {
  var height = getHeight()/100;
  var weight = getWeight();
  var bmi = getWeight()/(Math.pow(height, 2));
  return bmi;
}
 

// get the Z score
function getZScore(measurement, L, M, S){
  
  if (L == 0){
  return Math.log(measurement / M) / S;
  } else {
    return (Math.pow(measurement / M, L) - 1) / (L * S);
  }

}

// get a measurement from a z score
function getMeasurementFromZ(z, L, M, S){
  
  if (L == 0){
    return M * S * z;
  } else {
      return Math.pow(z * L * S + 1, 1 / L) * M;
  }
  
}



// convert Z score into a percentile
function getZPercent(z){

 // z == number of standard deviations from the mean
 // if z is greater than 6.5 standard deviations from the mean the
 // number of significant digits will be outside of a reasonable range

 if (z < -6.5) {
  return 0.0;
  }
 
  if (z > 6.5) {
  return 1.0;
  }
 
  var factK = 1;
  var sum = 0;
  var term = 1;
  var k = 0;
  var loopStop = Math.exp(-23);
 
  while(Math.abs(term) > loopStop) {
  term = .3989422804 * Math.pow(-1,k) * Math.pow(z,k) / (2 * k + 1) / Math.pow(2,k) * Math.pow(z,k+1) / factK;
  sum += term;
  k++;
  factK *= k;
  }
 
  sum += 0.5;
 
  return sum;
}


//take the BMI centile and return and interpretation. age is age in days
//ages 2-5: obese = >3sd (99.8th centile), overweight = ~>1.35SD (91st centile)
//ages 5-19: obese = >2sd (97.8th centile), overweight = >1SD, thinness = <-2SD, severe thinness = <-3SD
//NZ doesn't provide a guide for z score for thinness or severe thinness, WHO says it is -2 and -3 respectively for ages 5-19, but no info for ages 2-5
function interpretBMI(age, z_bmi){

  if (age > 1857) { //above 5 years old
   return z_bmi > 2 ? "Obese" : z_bmi > 1 ? "Overweight" : z_bmi < -3 ? "Severe Thinness" : z_bmi < -2 ? "Thinness" : "Normal";
  } else if (age > 730 && age < 1858){ //ages 2 - 5
    return z_bmi > 3 ? "Obese" : z_bmi > 1.35 ? "Overweight" : z_bmi < -3 ? "Severe Thinness" : z_bmi < -2 ? "Thinness" : "Normal";
  } else if (age < 731){
    return "Not for age < 2"
  }
 
 }

//output the healthy weight range (note not BMI range)
//need to find out what is determined to be a healthy weight range.
function weightRange(L, M, S){
  var healthyWeight = [getMeasurementFromZ(-2, L, M, S), getMeasurementFromZ(1, L, M, S)];
  return healthyWeight[0].toFixed(1) + " - " + healthyWeight[1].toFixed(1) + " kg";
}



//calculate button function
document.getElementById("calcbutton").addEventListener("click", function() {
  var gender = getGender();
  var theAge = calculateAge()[0];
  var weight = getWeight();
  var height = getHeight();
  var BMI = getBMI();

  errorCheck();

  var lms_bmi, lms_wt, lms_ht, theAgeMonths;
  if (theAge < 1857) {
      lms_bmi = getLMSValues_0_5('bmi_data_WHO_0_5', theAge, gender);
      lms_wt = getLMSValues_0_5('weight_data_WHO_0_5', theAge, gender);
      lms_ht = getLMSValues_0_5('height_data_WHO_0_5', theAge, gender);
  } else if (theAge > 1856 && theAge < 6971) {
      theAgeMonths = Math.ceil(theAge / 30.4375); // Convert age to months, as age >5 requires months.
      lms_bmi = getLMSValues_5_19('bmi_data_WHO_5_19', theAgeMonths, gender);
      lms_wt = getLMSValues_5_19('weight_data_WHO_5_19', theAgeMonths, gender);
      lms_ht = getLMSValues_5_19('height_data_WHO_5_19', theAgeMonths, gender);
  } else if (theAge > 6970) {
      displayresult(null, null, null, null);
      return;
  }

  var z_bmi = getZScore(BMI, lms_bmi[0], lms_bmi[1], lms_bmi[2]);
  var z_wt = getZScore(weight, lms_wt[0], lms_wt[1], lms_wt[2]);
  var z_ht = getZScore(height, lms_ht[0], lms_ht[1], lms_ht[2]);
  var interpret_bmi = interpretBMI(theAge, z_bmi);
  var weightrange = weightRange(lms_wt[0], lms_wt[1], lms_wt[2]);

  var percentiles = [getZPercent(z_bmi), getZPercent(z_wt), getZPercent(z_ht)];
  displayresult(percentiles[0], percentiles[1], percentiles[2], z_bmi, z_wt, z_ht, interpret_bmi, weightrange);
});



//displays the results in the result box.
function displayresult(percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange) {

  var theAge = calculateAge()[0];
  var bmiNumber =  getBMI().toFixed(1);
  var weight = getWeight();
  var height = getHeight();

  if (theAge < 6971){ //if 19 or younger
  var ordinal_BMI = Number.getOrdinalFor((percentile_bmi * 100).toFixed(0), true);
  var ordinal_wt = Number.getOrdinalFor((percentile_wt * 100).toFixed(0), true);
  var ordinal_ht = Number.getOrdinalFor((percentile_ht * 100).toFixed(0), true);
  document.getElementById("result-age").innerHTML = calculateAge(0)[1];
  //show the results in the result boxes, and grey out options where not relevant
  weight > 0 && height > 0 ? (document.getElementById("result-bminumber").innerHTML = bmiNumber, document.getElementById("result-bminumber").style.opacity = "1")   : (document.getElementById("result-bminumber").innerHTML = "Enter Weight & Height", document.getElementById("result-bminumber").style.opacity = "0.4");
  weight > 0 && height > 0 ? (document.getElementById("result-bmi").innerHTML = ordinal_BMI + " (Z-score: " + z_bmi.toFixed(1) + ")", document.getElementById("result-bmi").style.opacity = "1")   : (document.getElementById("result-bmi").innerHTML = "Enter Weight & Height", document.getElementById("result-bmi").style.opacity = "0.4");
  weight > 0 && height > 0 ? (document.getElementById("result-it").innerHTML = interpret_bmi, document.getElementById("result-it").style.opacity = "1")  : (document.getElementById("result-it").innerHTML = "Enter Weight & Height", document.getElementById("result-it").style.opacity = "0.4");
  weight > 0 ? (document.getElementById("result-wt").innerHTML = ordinal_wt + " (Z-score: " + z_wt.toFixed(1) + ")", document.getElementById("result-wt").style.opacity = "1") : (document.getElementById("result-wt").innerHTML = "Enter Weight", document.getElementById("result-wt").style.opacity = "0.4");
  height > 0 ? (document.getElementById("result-ht").innerHTML = ordinal_ht + " (Z-score: " + z_ht.toFixed(1) + ")", document.getElementById("result-ht").style.opacity = "1") : (document.getElementById("result-ht").innerHTML = "Enter Height", document.getElementById("result-ht").style.opacity = "0.4");
  weight > 0 ? (document.getElementById("result-wr").innerHTML = weightrange, document.getElementById("result-wr").style.opacity = "1") : (document.getElementById("result-wr").innerHTML = "Enter Weight", document.getElementById("result-wr").style.opacity = "0.4");

  } else { //if an adult then just show BMI
    document.getElementById("result-age").innerHTML = calculateAge(0)[1];
    document.getElementById("result-bmi").innerHTML = "for age <20";
    weight > 0 && height > 0 ? (document.getElementById("result-bminumber").innerHTML = bmiNumber, document.getElementById("result-bminumber").style.opacity = "1")   : (document.getElementById("result-bminumber").innerHTML = "Enter Weight & Height", document.getElementById("result-bminumber").style.opacity = "0.4");
    document.getElementById("result-wt").innerHTML = ordinal_wt = "for age <20";
    document.getElementById("result-ht").innerHTML = ordinal_ht = "for age <20";
    document.getElementById("result-it").innerHTML = "for age <20";
    document.getElementById("result-wr").innerHTML = "for age < 20";
    document.getElementById("result-bmi").style.opacity = "0.4"
    document.getElementById("result-wt").style.opacity = "0.4"
    document.getElementById("result-ht").style.opacity = "0.4"
    document.getElementById("result-it").style.opacity = "0.4"
    document.getElementById("result-it").style.opacity = "0.4"
    document.getElementById("result-wr").style.opacity = "0.4"
  }
}


//error display
function showError(message){
  var error = document.getElementById("error-message");
  error.innerHTML = message;
  document.getElementById("result-age").innerHTML = "";
  document.getElementById("result-bmi").innerHTML = "";
  document.getElementById("result-bminumber").innerHTML = "";
  document.getElementById("result-wt").innerHTML = "";
  document.getElementById("result-ht").innerHTML = "";
  document.getElementById("result-it").innerHTML = "";
  document.getElementById("result-wr").innerHTML = "";
  error.style.display = "block";
}

function clearError(){
  var error = document.getElementById("error-message");
  error.style.display = "none";
}

function errorCheck(){

  if (document.getElementById("DOB").value == ""){
    showError("Please enter date of birth")
    return;
  } else if (document.getElementById("DOM").value == ""){
    showError("Please enter date of measurement")
    return;
  } else if (document.getElementById("theweight").value == "" && document.getElementById("theheight").value == ""){
    showError("Please enter a weight, height, or both")
    return;
  } else {
    clearError();
  }

}


//function to work out ordinals from http://cwestblog.com/2012/09/28/javascript-number-getordinalfor/
(function(o) {
  Number.getOrdinalFor = function(intNum, includeNumber) {
    return (includeNumber ? intNum : "")
      + (o[((intNum = Math.abs(intNum % 100)) - 20) % 10] || o[intNum] || "th");
  };
})([,"st","nd","rd"]);

      

//Basic pluralization #Source https://bit.ly/2neWfJ2 
const pluralize = (val, word, plural = word + 's') => {
  const _pluralize = (num, word, plural = word + 's') =>
    [1, -1].includes(Number(num)) ? word : plural;
  if (typeof val === 'object') return (num, word) => _pluralize(num, word, val[word]);
  return _pluralize(val, word, plural);
};
//console.log(pluralize(0, 'apple'));


const PLURALS = {
  person: 'people',
  radius: 'radii'
};
const autoPluralize = pluralize(PLURALS);
//console.log(autoPluralize(2, 'year'));