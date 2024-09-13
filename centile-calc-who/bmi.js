  //TODO

  //complete healthy weight range function by researching and finding out what is the WHO healthy weight range.
  //Modify labelling, when hovering over a centile line should just show the name of the line
  // Add correction for gestation option
  // add preterm baby data
  // Zoom and pan function for charts

  const centileData = {};

  let dataPoints = {
    bmi: [],
    weight: [],
    height: []
  };

  // Change 'data.json' to '/bmi-calculator-data-json' when running on wordpress with my custom plugin.
  window.onload = () => {
    fetch('data.json')
      .then(res => res.json())
      .then(data => {
        Object.assign(centileData, data);
        setupEventListeners();
        initializeCharts();
      })
      .catch(err => console.error('Could not fetch centile data:', err));
  };

  const getGender = () => document.querySelector('input[name="gender"]:checked')?.value;

  const calculateAge = () => {
    const DOB = moment(document.getElementById('DOB').value, "DD/MM/YYYY");
    const DOM = moment(document.getElementById('DOM').value, "DD/MM/YYYY");
    const ageInDays = DOM.diff(DOB, 'days');
    const decimalAge = ageInDays / 365.25;
    return [ageInDays, convertToYearsOld(DOB.clone(), DOM), decimalAge];
  };

  const convertToYearsOld = (DOB, DOM) => {
    const years = DOM.diff(DOB, 'years');
    DOB.add(years, 'years');
    const months = DOM.diff(DOB, 'months');
    DOB.add(months, 'months');
    const days = DOM.diff(DOB, 'days');
    return `${years} ${pluralize(years, 'year')} ${months} ${pluralize(months, 'month')} ${days} ${pluralize(days, 'day')}`;
  };

  const getWeight = () => +document.getElementById("theweight").value;
  const getHeight = () => +document.getElementById("theheight").value;

  const getOrdinalFor = n => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  function adjustColor(hex, amount) {
    return '#' + hex.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  const interpretBMI = (age, z_bmi) => {
    const info = "<br><span class='BMI-criteria'>Based on WHO definitions</span>";
    if (age > 1857) return z_bmi > 2 ? "Obese" + info : z_bmi > 1 ? "Overweight" + info : z_bmi < -2 ? "Underweight" + info : "Normal" + info;
    else return z_bmi > 3 ? "Obese" + info : z_bmi > 2 ? "Overweight" + info : z_bmi < -2 ? "Underweight" + info : "Normal" + info;
  };

  const healthyWeightRange = (L, M, S, height) => {
    const bmiLow = getMeasurementFromZ(getZScoreFromPercentile(0.02), L, M, S);
    const bmiHigh = getMeasurementFromZ(getZScoreFromPercentile(0.91), L, M, S);
    const weightLow = bmiLow * (height / 100) ** 2;
    const weightHigh = bmiHigh * (height / 100) ** 2;
    return `${weightLow.toFixed(1)} - ${weightHigh.toFixed(1)} kg<br><span class='centile-range'>Using BMI centile range: 2nd to 91st</span>`;
  };

  function toggleInfoBar() {
    const infoBar = document.getElementById("infoBar");
    const toggleButton = document.querySelector("button[onclick='toggleInfoBar()']");
    const toggleIcon = document.getElementById("toggleIcon");
    const openIcon = '<svg style="width: 20px; height: 7px; padding-left: 5px;" viewBox="0 0 12 8"><polygon points="1.4,7.4 0,6 6,0 12,6 10.6,7.4 6,2.8" fill="black"></polygon></svg>';
    const closeIcon = '<svg style="width: 20px; height: 7px; padding-left: 5px;" viewBox="0 0 12 8"><path d="M1.4.6L0 2l6 6 6-6L10.6.6 6 5.2" fill-rule="nonzero" fill="#fff"></path></svg>';
    if (infoBar.style.display === "none") {
      infoBar.style.display = "block";
      toggleIcon.innerHTML = closeIcon;
      toggleButton.classList.replace("closedButton", "openButton");
    } else {
      infoBar.style.display = "none";
      toggleIcon.innerHTML = openIcon;
      toggleButton.classList.replace("openButton", "closedButton");
    }
  }

  const getLMSValues = (dataType, age_days, gender) => {
    const dataKey = age_days < 1857 ? dataType + "_0_5" : dataType + "_5_19";
    const array = centileData[dataKey];
    if (!array) { showError("Age out of range."); return; }
    const entry = array.find(item => item.gender === gender && item.age_days === age_days);
    if (entry) return [entry.l, entry.m, entry.s];
    const closestAges = array.filter(item => item.gender === gender)
      .map(item => item.age_days)
      .sort((a, b) => Math.abs(age_days - a) - Math.abs(age_days - b))
      .slice(0, 4);
    const t = closestAges;
    const y = t.map(age => array.find(item => item.gender === gender && item.age_days === age));
    const L = cubicInterpolation(age_days, ...t, ...y.map(e => e.l));
    const M = cubicInterpolation(age_days, ...t, ...y.map(e => e.m));
    const S = cubicInterpolation(age_days, ...t, ...y.map(e => e.s));
    return [L, M, S];
  };

  const getZScoreFromLMS = (measurement, L, M, S) => L ? (Math.pow(measurement / M, L) - 1) / (L * S) : Math.log(measurement / M) / S;

  const getPercentileFromZScore = z => {
    if (z < -6) return 0;
    if (z > 6) return 1;
    return 0.5 * (1 + erf(z / Math.SQRT2));
  };

  const erf = z => {
    const sign = z >= 0 ? 1 : -1;
    z = Math.abs(z);
    const t = 1 / (1 + 0.5 * z);
    const r = 1 - t * Math.exp(-z*z - 1.26551223 + t * (1.00002368 + t*(0.37409196 + t*(0.09678418 + t*(-0.18628806 + t*(0.27886807 + t*(-1.13520398 + t*(1.48851587 + t*(-0.82215223 + t*0.17087277)))))))));
    return sign * r;
  };

  const cubicInterpolation = (t, t0, t1, t2, t3, y0, y1, y2, y3) => {
    const L = [((t - t1)*(t - t2)*(t - t3))/((t0 - t1)*(t0 - t2)*(t0 - t3)),
              ((t - t0)*(t - t2)*(t - t3))/((t1 - t0)*(t1 - t2)*(t1 - t3)),
              ((t - t0)*(t - t1)*(t - t3))/((t2 - t0)*(t2 - t1)*(t2 - t3)),
              ((t - t0)*(t - t1)*(t - t2))/((t3 - t0)*(t3 - t1)*(t3 - t2))];
    return y0 * L[0] + y1 * L[1] + y2 * L[2] + y3 * L[3];
  };

  const getMeasurementFromZ = (z, L, M, S) => L ? M * Math.pow(1 + L * S * z, 1 / L) : M * Math.exp(S * z);

  const getZScoreFromPercentile = p => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    return Math.sqrt(2) * inverseErf(2 * p - 1);
  };

  const inverseErf = x => {
    const a = 0.147;
    const ln = Math.log(1 - x * x);
    const sgn = x < 0 ? -1 : 1;
    return sgn * Math.sqrt( Math.sqrt((2/(Math.PI * a) + ln / 2) ** 2 - ln / a) - (2/(Math.PI * a) + ln / 2) );
  };

  const calculateBMI = (weight, height) => weight / (height / 100) ** 2;

  const pluralize = (count, word, plural) => count === 1 ? word : (plural || word + 's');

  const handleCalculateClick = () => {
    clearError();
  
    const dobField = document.getElementById("DOB");
    dobField.disabled = true;
    dobField.style.backgroundColor = "#e0e0e0";
  
    const [ageInDays, humanAge, decimalAge] = calculateAge();
    const weight = getWeight(), height = getHeight(), BMI = calculateBMI(weight, height);
    const gender = getGender();
    if (!ageInDays || ageInDays < 0 || !gender || !weight || !height) {
      showError("Please check your inputs.");
      return;
    }
  
    // Check if this data point already exists
    const existingDataPoint = dataPoints.bmi.find(point => point.age === ageInDays);
    if (existingDataPoint) {
      showError("A data point for this age already exists. Please use a different date of measurement.");
      return;
    }
  
    const lms_bmi = getLMSValues('bmi_data_WHO', ageInDays, gender);
    const lms_wt = getLMSValues('weight_data_WHO', ageInDays, gender);
    const lms_ht = getLMSValues('height_data_WHO', ageInDays, gender);
    if (!lms_bmi || !lms_wt || !lms_ht) return;
    const z_bmi = getZScoreFromLMS(BMI, ...lms_bmi);
    const z_wt = getZScoreFromLMS(weight, ...lms_wt);
    const z_ht = getZScoreFromLMS(height, ...lms_ht);
    const percentile_bmi = getPercentileFromZScore(z_bmi);
    const percentile_wt = getPercentileFromZScore(z_wt);
    const percentile_ht = getPercentileFromZScore(z_ht);
    const interpret_bmi = interpretBMI(ageInDays, z_bmi);
    const weightrange = healthyWeightRange(...lms_bmi, height);
  
    // Add the new data point
    dataPoints.bmi.push({ age: ageInDays, value: BMI });
    dataPoints.weight.push({ age: ageInDays, value: weight });
    dataPoints.height.push({ age: ageInDays, value: height });
  
    updateCharts();
    displayResult(percentile_bmi, percentile_wt, percentile_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge);
  };

  function switchTab(selectedTab) {
    ['bmiChart', 'weightChart', 'heightChart'].forEach(id => {
      document.getElementById(id).style.display = id.startsWith(selectedTab) ? 'block' : 'none';
    });
    [...document.getElementsByClassName('tab-button')].forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('onclick') === `switchTab('${selectedTab}')`);
    });
  }

  document.addEventListener("DOMContentLoaded", () => switchTab("bmi"));

  const setupEventListeners = () => {
    document.getElementById("calcbutton").addEventListener("click", handleCalculateClick);
    document.getElementById("clearDataButton").addEventListener("click", handleClearDataClick);
  };

  function handleClearDataClick() {
    const dobField = document.getElementById("DOB");
    dobField.disabled = false;
    dobField.style.backgroundColor = ""; 
    dataPoints.bmi = [];
    dataPoints.weight = [];
    dataPoints.height = [];
    updateCharts();
    document.getElementById("result-age").innerHTML = "";
    document.getElementById("result-bminumber").innerHTML = "";
    document.getElementById("result-bmi").innerHTML = "";
    document.getElementById("result-it").innerHTML = "";
    document.getElementById("result-wt").innerHTML = "";
    document.getElementById("result-wr").innerHTML = "";
    document.getElementById("result-ht").innerHTML = "";
  }

  const displayResult = (p_bmi, p_wt, p_ht, z_bmi, z_wt, z_ht, interpret_bmi, weightrange, humanAge) => {
    document.getElementById("result-age").innerHTML = humanAge;
    document.getElementById("result-bminumber").innerHTML = calculateBMI(getWeight(), getHeight()).toFixed(1);
    document.getElementById("result-bmi").innerHTML = `${formatPercentile(p_bmi)}<br><span class="z-score">z-score: ${z_bmi.toFixed(3)}</span>`;
    document.getElementById("result-it").innerHTML = interpret_bmi;
    document.getElementById("result-wt").innerHTML = `${formatPercentile(p_wt)}<br><span class="z-score">z-score: ${z_wt.toFixed(3)}</span>`;
    document.getElementById("result-wr").innerHTML = weightrange;
    document.getElementById("result-ht").innerHTML = `${formatPercentile(p_ht)}<br><span class="z-score">z-score: ${z_ht.toFixed(3)}</span>`;
  };

  const formatPercentile = p => `${getOrdinalFor((p * 100).toFixed(0))} percentile`;

  const showError = msg => {
    const errorElement = document.getElementById("error-message");
    errorElement.innerHTML = msg;
    errorElement.style.display = 'block';
  };

  const clearError = () => {
    const errorElement = document.getElementById("error-message");
    errorElement.innerHTML = '';
    errorElement.style.display = 'none';
  };

  function initializeCharts() {
    ['bmiChart', 'weightChart', 'heightChart'].forEach(id => initializeChart(id, id.replace('Chart', '').toUpperCase()));
  }

  function initializeChart(chartId, label) {
    const ctx = document.getElementById(chartId).getContext('2d');
    window[chartId] = new Chart(ctx, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Age (Days)' } },
          y: { title: { display: true, text: label } }
        },
        plugins: { annotation: {} }
      }
    });
  }

  function updateCharts() {
    const gender = getGender();
    const centileHeading = document.getElementById("centileHeading");
    centileHeading.innerHTML = gender === 'female' ? "Girls Centile Charts" : "Boys Centile Charts";
    centileHeading.style.color = gender === 'female' ? "#f448a3" : "#009cd5";

    // Determine the age range for centile charts
    const allAges = [...dataPoints.bmi, ...dataPoints.weight, ...dataPoints.height].map(dp => dp.age);
    const maxAge = allAges.length ? Math.max(...allAges) : 0;
    const ageRangeText = maxAge > 1857 ? '5-19 years' : '0-5 years';
    centileHeading.innerHTML += `<br><span style='font-size:0.8em'>${ageRangeText}</span>`;

    const annotation = maxAge <= 1857 ? {
      annotations: {
        line1: {
          type: 'line',
          xMin: 730, xMax: 730,
          borderColor: 'rgb(255, 99, 132)', borderWidth: 1, borderDash: [6, 6],
          label: { content: 'Change from measuring length to height after age 2', enabled: true, position: "start" }
        }
      }
    } : {};

    updateChart(dataPoints.bmi, 'bmiChart', 'bmi_data_WHO_0_5', 'bmi_data_WHO_5_19', gender, annotation);
    updateChart(dataPoints.weight, 'weightChart', 'weight_data_WHO_0_5', 'weight_data_WHO_5_19', gender, {});
    updateChart(dataPoints.height, 'heightChart', 'height_data_WHO_0_5', 'height_data_WHO_5_19', gender, annotation);
  }

  function updateChart(dataPointsArray, chartId, dataKeyUnder5, dataKeyOver5, gender, annotationConfig) {
    if (dataPointsArray.length === 0) {
      // Clear the chart if there are no data points
      const chart = window[chartId];
      chart.data.datasets = [];
      chart.update();
      return;
    }
    const allAges = dataPointsArray.map(dp => dp.age);
    const maxAge = allAges.length ? Math.max(...allAges) : 0;
    const dataKey = maxAge <= 1857 ? dataKeyUnder5 : dataKeyOver5;
    const centileDataset = centileData[dataKey]?.filter(entry => entry.gender === gender);
    if (!centileDataset) return;
    processAndUpdateChartData(dataPointsArray, centileDataset, chartId, maxAge, gender);
    const chart = window[chartId];
    chart.options.plugins.annotation = annotationConfig;
    chart.update();
  }

  function processAndUpdateChartData(dataPointsArray, centileDataset, chartId, maxAge, gender) {
    const chart = window[chartId];
  
    chart.data.datasets = [];
  
    chart.options.scales.x.title.text = maxAge <= 1857 ? 'Age (Months)' : 'Age (Years)';
    chart.options.scales.x.ticks = {
      callback: value => {
        if (maxAge <= 1857) {
          const months = Math.round(value / 30.4375);
          return months % 3 === 0 ? months : '';
        } else {
          return Math.round(value / 365.25);
        }
      },
      stepSize: maxAge <= 1857 ? 30.4375 * 3 : 365.25,
      autoSkip: false,
    };
  
    const centiles = [3, 10, 25, 50, 75, 90, 97];
    const baseColor = gender === 'female' ? '#f448a3' : '#009cd5';
    const fiftiethCentileColor = gender === 'female' ? '#8E44AD' : '#1a5074';
  
    centiles.forEach((centile, index) => {
      const sampledData = centileDataset
        .filter((_, i) => maxAge <= 1857 ? i % 12 === 0 : true)
        .sort((a, b) => a.age_days - b.age_days)
        .map(entry => ({ x: entry.age_days, y: calculateCentileValue(entry, centile) }));
  
      const color = centile === 50 ? fiftiethCentileColor : baseColor;
      
      chart.data.datasets.push({
        label: `${getOrdinalFor(centile)} Centile`,
        data: sampledData,
        borderColor: color,
        borderWidth: centile === 50 ? 3 : 2,
        pointRadius: 0.1,
        pointHitRadius: 10,
        tension: 0.6,
        showLine: true,
        fill: false,
        borderDash: index % 2 === 0 ? [] : [5, 5],
      });
    });
  
    const dataPointsData = dataPointsArray.map(dp => ({ x: dp.age, y: dp.value }));
    chart.data.datasets.push({
      label: `Patient's Data Points`,
      data: dataPointsData,
      backgroundColor: '#E74C3C',
      borderColor: '#E74C3C',
      borderWidth: 1,
      type: 'scatter',
      pointRadius: 5,
      showLine: false,
    });
  
    // Update chart options to modify hover behavior
    chart.options.plugins.tooltip = {
      callbacks: {
        title: (tooltipItems) => {
          // Return only the dataset label (centile name) for centile lines
          const datasetIndex = tooltipItems[0].datasetIndex;
          return chart.data.datasets[datasetIndex].label;
        },
        label: (tooltipItem) => {
          // Return an empty string to hide additional information for centile lines
          if (tooltipItem.datasetIndex < centiles.length) {
            return '';
          }
          // For patient's data points, show the full information
          return `Age: ${tooltipItem.parsed.x} days, Value: ${tooltipItem.parsed.y.toFixed(2)}`;
        }
      }
    };
  
    chart.update();
  }
  
  const calculateCentileValue = (entry, centile) => {
    const z = getZScoreFromPercentile(centile / 100);
    return getMeasurementFromZ(z, entry.l, entry.m, entry.s);
  };
