

let userName = localStorage.getItem('name');
let userRole = localStorage.getItem('role');

let nameElement = document.getElementById('user-name');
let roleElement = document.getElementById('user-role');

nameElement.textContent = userName;
roleElement.textContent = userRole;


let working = false;

let stopwatchSeconds = 0;
let stopwatchMinutes = 0;
let stopwatchHours = 0;
let stopwatchInterval = null;
let currentTime = '';
let currentDate = '';
const stoppageLog = [];
let pieChartInstance = null;
let columnChartInstance = null;
let debounceTimeout = null;
let previousStoppagePercentage = null;
let bottomBarOpen = false;
let showExcelTable = false;
let userData = null;
let performence = 0;

let stoppageReasons = [];
let stoppageReasonCounts = [];



document.addEventListener("DOMContentLoaded", function() {

const plannedStoppagesTab = document.querySelector('.planned-stoppages-tab');
const pannesTab = document.querySelector('.pannes-tab');
const organisationnellesTab = document.querySelector('.organisationnelles-tab');
const changementRefTab = document.querySelector('.changement-ref-tab');
const nonQualityTab = document.querySelector('.non-quality-tab');
const autresTab = document.querySelector('.autres-tab');

plannedStoppagesTab.addEventListener('click', () => {
    document.getElementById('planned-stoppages').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');

    // Reset stopReason and customReasonText
    stopReason = '';
    customReasonText = '';
});

pannesTab.addEventListener('click', () => {
    document.getElementById('pannes').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');
});

organisationnellesTab.addEventListener('click', () => {
    document.getElementById('organisationnelles').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');
});

changementRefTab.addEventListener('click', () => {
    document.getElementById('changement-ref').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');
});

nonQualityTab.addEventListener('click', () => {
    document.getElementById('non-quality').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');
});

autresTab.addEventListener('click', () => {
    document.getElementById('autres').classList.add('show', 'active');
    document.getElementById('unplanned-stoppages').classList.remove('show', 'active');
});

});

// Function to handle reason selection
function handleReasonSelection(event) {
    const selectedReason = event.target;
    const allReasonInputs = document.querySelectorAll('.unplanned-stoppage-reason, #planned-stoppage-reason');
    allReasonInputs.forEach(input => {
        if (input !== selectedReason) {
            input.value = ''; // Clear the value of other reason inputs
        }
    });
}

// Add change event listeners to all unplanned stoppage reason inputs and planned stoppage reason input
const allStoppageReasonInputs = document.querySelectorAll('.unplanned-stoppage-reason, #planned-stoppage-reason');
allStoppageReasonInputs.forEach(input => {
    input.addEventListener('change', handleReasonSelection);
});


function startClock() {
            setInterval(() => {
                const currentTimeElement = document.getElementById('currentTime');
                const currentDateElement = document.getElementById('currentDate');
                currentTime = new Date().toLocaleTimeString();
                currentDate = new Date().toLocaleDateString();
                currentTimeElement.textContent = currentTime;
                currentDateElement.textContent = currentDate;
            }, 1000);
}

        


function toggleWorkState() {
    const checkbox = document.getElementById("toggleWorkState");
    if (working) {
        stopStopwatch();
    } else {
        showStopReasonForm();
    }
    working = !working;
    if (!working) {
        logStoppage(); 
        document.getElementById('pop-up').classList.remove('is-active');
    }
}

function closeFormReason() {
    const checkbox = document.getElementById("toggleWorkState");
    checkbox.checked = !checkbox.checked
    working = !working
    if(!working) {
        document.getElementById('pop-up').classList.remove('is-active');
    }
}

function showStopReasonForm() {
    document.getElementById('pop-up').classList.add('is-active');
}

function hideStopReasonForm() {
    document.getElementById('pop-up').classList.remove('is-active');
}

function submitStopReason(event) {
    event.preventDefault();
    const plannedStoppageReasonInput = document.getElementById('planned-stoppage-reason');
    const unplannedStoppageReasonInput = document.querySelector('.tab-pane.active .unplanned-stoppage-reason');
    const stoppageDescriptionInput = document.getElementById('stoppage-description');

    let stopReason = '';
    if (plannedStoppageReasonInput.value !== '') {
        stopReason = plannedStoppageReasonInput.value;
    } else if (unplannedStoppageReasonInput.value !== '') {
        stopReason = unplannedStoppageReasonInput.value;
    } else {
        alert('Please select a stoppage reason.');
        return;
    }

    const customReasonText = stoppageDescriptionInput.value.trim();
    console.log('Stop Reason:', stopReason);
    console.log('Custom Reason Text:', customReasonText);

    startStopwatch();
    logStoppage(stopReason, customReasonText); 

    event.stopPropagation();
    document.getElementById('pop-up').classList.remove('is-active');
}

function calculatePerformance() {
    const plannedProductionTime = 8 * 3600; 
    const totalUnplannedDurationInSeconds = calculateTotalUnplannedStoppageDurationInSeconds();
    const netOperatingTime = plannedProductionTime - totalUnplannedDurationInSeconds;
    const performance = (netOperatingTime / plannedProductionTime) * 100;
    return performance.toFixed(2); 
}
function calculateStoppageData() {
    // Get the stoppage logs
    const stoppageLogs = stoppageLog;

    // Initialize an object to store stoppage counts and total duration for each reason
    const stoppageData = {};

    // Loop through the stoppage logs
    stoppageLogs.forEach(log => {
        const { stopReason, duration } = log;
        if (!stoppageData[stopReason]) {
            // If the reason is not yet in the stoppageData object, initialize it
            stoppageData[stopReason] = {
                count: 1,
                totalDuration: duration
            };
        } else {
            // If the reason already exists, increment the count and add to the total duration
            stoppageData[stopReason].count++;
            stoppageData[stopReason].totalDuration += duration;
        }
    });

    // Convert total duration from formatted time (HH:mm:ss) to minutes
    Object.values(stoppageData).forEach(reasonData => {
        // Split duration into hours, minutes, and seconds
        const [hours, minutes, seconds] = reasonData.totalDuration.split(':').map(Number);
        // Calculate total duration in minutes
        reasonData.totalDuration = hours * 60 + minutes + seconds / 60;
    });

    // Convert the stoppageData object to an array of objects
    const stoppageDataArray = Object.keys(stoppageData).map(stopReason => ({
        stopReason,
        count: stoppageData[stopReason].count,
        totalDuration: stoppageData[stopReason].totalDuration
    }));

    console.log(stoppageData); // Log the stoppageData object to the console

    return stoppageDataArray;
}




function logStoppage() {
    if (!working) {
        console.log('Logging Stoppage...');
        const plannedStoppageReasonInput = document.getElementById('planned-stoppage-reason');
        const unplannedStoppageReasonInput = document.querySelector('.tab-pane.active .unplanned-stoppage-reason');
        const stoppageDescriptionInput = document.getElementById('stoppage-description');

        const selectedStopReason = plannedStoppageReasonInput.value || unplannedStoppageReasonInput.value;

        if (!selectedStopReason) {
            console.error('No stoppage reason selected');
            return;
        }
        
        const customReasonText = stoppageDescriptionInput.value.trim();
        const timeOfStop = new Date().toLocaleTimeString();
        const duration = `${formatTime(stopwatchHours)}:${formatTime(stopwatchMinutes)}:${formatTime(stopwatchSeconds)}`;
        stopwatchSeconds = 0;
        stopwatchMinutes = 0;
        stopwatchHours = 0;
        const performance = calculatePerformance();
        console.log(`Performance: ${performance}%`);

        const stoppageData = {
            timeOfStop: timeOfStop,
            duration: duration,
            stopReason: selectedStopReason,
            customReasonText: customReasonText
        };
        stoppageLog.push(stoppageData); // Add the stoppage data to the stoppageLog array
        
        // Check if stoppageReasons and stoppageReasonCounts are initialized
        if (!Array.isArray(stoppageReasons)) {
            stoppageReasons = [];
        }
        if (!Array.isArray(stoppageReasonCounts)) {
            stoppageReasonCounts = [];
        }

        // Update the stoppage reasons and counts
        if (stoppageReasons.includes(selectedStopReason)) {
            const index = stoppageReasons.indexOf(selectedStopReason);
            stoppageReasonCounts[index]++;
        } else {
            stoppageReasons.push(selectedStopReason);
            stoppageReasonCounts.push(1);
        }

        renderCharts(); // Update the charts after logging the stoppage and calculating the duration
        updateStoppageLogTable();

        // Send the stoppage data to the server
        fetch('/logStoppage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stoppageData)
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to send data');
            }
        })
        .catch(error => {
            console.error('Network error:', error);
        });

        console.log('Stop Reason:', selectedStopReason);
        console.log('Custom Reason Text:', customReasonText);
    }
}



function calculateAvailability() {
    const plannedProductionTimeInSeconds = 8 * 3600; // Assuming 8 hours of production time
    const totalStoppageDurationString = calculateTotalStoppageDuration(); // Get the total stoppage duration as a string
    const [hours, minutes, seconds] = totalStoppageDurationString.split(':').map(Number); // Parse the duration string
    const totalStoppageDurationInSeconds = hours * 3600 + minutes * 60 + seconds; // Convert duration to seconds
    const runtime = plannedProductionTimeInSeconds - totalStoppageDurationInSeconds;
    const availability = runtime / plannedProductionTimeInSeconds;
    console.log(`Availability: ${availability * 100}%`);
    return availability; // Return the calculated availability percentage
}


// timer code
// In the startStopwatch() function
function startStopwatch() {
  stopwatchInterval = setInterval(updateStopwatch, 1000);
  document.getElementById('watch-icon').classList.add('blink');
}

// In the stopStopwatch() function
function stopStopwatch() {
  clearInterval(stopwatchInterval);
  document.getElementById('watch-icon').classList.remove('blink');
}
function calculateLastUnplannedStoppageDuration() {
    let unplannedDuration = 0;
    const unplannedReason = document.getElementById('unplanned-stoppage-reason').value;
    console.log('Unplanned Reason:', unplannedReason); // Log the unplanned reason
    const unplannedEntries = stoppageLog.filter(entry => entry.stopReason === unplannedReason);
    if (unplannedEntries.length > 0) {
        const lastEntry = unplannedEntries[unplannedEntries.length - 1];
        // Extract hours, minutes, and seconds from the duration string
        const [hours, minutes, seconds] = lastEntry.duration.split(':').map(Number);
        // Convert hours, minutes, and seconds to seconds
        unplannedDuration = hours * 3600 + minutes * 60 + seconds;
        console.log('Last unplanned stoppage duration for reason', unplannedReason + ':', formatTime(unplannedDuration));
    } else {
        console.log('No unplanned stoppage recorded for reason', unplannedReason);
    }
    return unplannedDuration;
}
function calculateTotalUnplannedStoppageDurationInSeconds() {
    let totalUnplannedDurationInSeconds = 0;
    const unplannedStoppageReasonInput = document.querySelector('.tab-pane.active .unplanned-stoppage-reason');

    stoppageLog.forEach(entry => {
        // Check if the stoppage entry is unplanned (selected by operator in the form)
        if (entry.stopReason === unplannedStoppageReasonInput?.value) { // Ensure unplannedStoppageReasonInput is not null
            // Parse the duration into hours, minutes, and seconds
            const durationParts = entry.duration.split(':');
            const hours = parseInt(durationParts[0]);
            const minutes = parseInt(durationParts[1]);
            const seconds = parseInt(durationParts[2]);

            // Convert the duration to seconds and add to the total
            const durationInSeconds = hours * 3600 + minutes * 60 + seconds;
            totalUnplannedDurationInSeconds += durationInSeconds;
        }
    });

    return totalUnplannedDurationInSeconds;
}



function calculateTotalStoppageDuration() {
    let totalDurationInSeconds = 0;

    stoppageLog.forEach(entry => {
        // Parse the duration into hours, minutes, and seconds
        const durationParts = entry.duration.split(':');
        const hours = parseInt(durationParts[0]);
        const minutes = parseInt(durationParts[1]);
        const seconds = parseInt(durationParts[2]);

        // Convert the duration to seconds and add to the total
        const durationInSeconds = hours * 3600 + minutes * 60 + seconds;
        totalDurationInSeconds += durationInSeconds;
    });

    // Convert the total duration back to hours, minutes, and seconds
    const totalHours = Math.floor(totalDurationInSeconds / 3600);
    const remainingSeconds = totalDurationInSeconds % 3600;
    const totalMinutes = Math.floor(remainingSeconds / 60);
    const totalSeconds = remainingSeconds % 60;

    return `${formatTime(totalHours)}:${formatTime(totalMinutes)}:${formatTime(totalSeconds)}`;
}





function updateStopwatch() {
    stopwatchSeconds++;
    if (stopwatchSeconds === 60) {
        stopwatchSeconds = 0;
        stopwatchMinutes++;
        if (stopwatchMinutes === 60) {
            stopwatchMinutes = 0;
            stopwatchHours++;
        }
    }
    updateStopwatchDisplay()
}

function updateStopwatchDisplay() {
    const formattedTime = `${formatTime(stopwatchHours)}:${formatTime(stopwatchMinutes)}:${formatTime(stopwatchSeconds)}`
    document.getElementById("stopwatch").textContent = formattedTime;
} 

function formatTime(time) {
    return time < 10 ? '0' + time : time;
}

// render charts when load the chart
window.onload = function() {
    renderCharts();
}





function updateStoppageLogTable() {
    const stoppageLogTable = document.getElementById('stoppageLogTable');
    stoppageLogTable.innerHTML = '';
    stoppageLog.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.timeOfStop}</td>
            <td>${entry.duration}</td>
            <td>${entry.stopReason}</td>
            <td>${entry.customReasonText}</td>
        `;
        stoppageLogTable.appendChild(row);
    });
}

function renderCharts() {
    const availability = calculateAvailability();
    const performance = calculatePerformance();
    const oeePercentage = availability * performance;
    const nonOeePercentage = 100 - oeePercentage;

    renderPieChart(oeePercentage, nonOeePercentage);

    // Calculate stoppage data and render column chart
    const stoppageData = calculateStoppageData();
    console.log('Stoppage Data:', stoppageData);
    renderColumnChart(stoppageData);
}



function renderPieChart(oeePercentage, nonOeePercentage) {
    const ctx = document.getElementById('pieChart').getContext('2d');

    if (!pieChartInstance) {
        pieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['TRS', 'Non-TRS'],
                datasets: [{
                    data: [oeePercentage, nonOeePercentage],
                    backgroundColor: ['#39FF14', 'rgb(218, 20, 20)'],
                    hoverBackgroundColor: ['#39FF14', 'rgb(218, 20, 20)'],
                    borderWidth: 0,
                }]
            },
            options: {
                title: {
                    display: false,
                },
                legend: {
                    display: true,
                    position: 'bottom',
                },
                cutoutPercentage: 60,
                responsive: true,
                maintainAspectRatio: true,
            }
        });
    } else {
        pieChartInstance.data.datasets[0].data = [oeePercentage, nonOeePercentage];
        pieChartInstance.update();
    }
}





function renderColumnChart(stoppageData) {
    const data = [
        {
            x: stoppageData.map(reason => reason.stopReason),
            y: stoppageData.map(reason => reason.count),
            type: 'bar',
            name: 'Stoppage Counts',
            marker: {
                color: '#007bff', // Blue color for the bars
            },
        },
        {
            x: stoppageData.map(reason => reason.stopReason),
            y: stoppageData.map(reason => reason.totalDuration),
            type: 'bar',
            name: 'Total Duration (minutes)',
            marker: {
                color: '#ffc107', // Yellow color for the bars
            },
        },
    ];

    const layout = {
        barmode: 'group',
        title: {
            text: 'Stoppage Counts and Total Duration by Reason',
            font: {
                size: 20,
            },
        },
        xaxis: {
            tickangle: -45,
        },

        yaxis: {
            title: {
                text: 'Value',
            },
        },
    };

    if (!columnChartInstance) {
        console.log('Creating a new column chart instance...');
        columnChartInstance = Plotly.newPlot('columnChart', data, layout);
    } else {
        console.log('Updating the existing column chart instance...');
        Plotly.react('columnChart', data, layout);
    }
}









function calculateChartData() {
    const stoppagePercentage = calculateStoppagePercentage();
    const stoppageCounts = calculateStoppageCounts();
    return { stoppagePercentage, stoppageCounts };
}


function calculateStoppagePercentage() {
    let totalStoppageSeconds = 0;

    // Calculate the total duration of all stoppages
    stoppageLog.forEach(entry => {
        const durationParts = entry.duration.split(':');
        const hours = parseInt(durationParts[0]);
        const minutes = parseInt(durationParts[1]);
        const seconds = parseInt(durationParts[2]);
        totalStoppageSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    // Calculate the stoppage percentage relative to the total production time
    const totalSeconds = 8 * 3600; // Assuming 8 hours of full-time work
    return (totalStoppageSeconds / totalSeconds) * 100;
}


function calculateStoppageCounts() {
    const stoppageCounts = {};
    stoppageLog.forEach(entry => {
        const reason = entry.stopReason; // Assuming the stoppage reason is stored in the 'stopReason' property
        stoppageCounts[reason] = stoppageCounts[reason] ? stoppageCounts[reason] + 1 : 1;
    });
    return stoppageCounts;
}


function toggleBottomBar() {
    bottomBarOpen = !bottomBarOpen;
    const excelTableElement = document.getElementById('excelTable');
    if (!bottomBarOpen) {
        showExcelTable = false;
        excelTableElement.classList.remove('open');
    } else {
        setTimeout(() => {
            showExcelTable = true;
            excelTableElement.classList.add('open');
        }, 100);
    }
}

startClock();



