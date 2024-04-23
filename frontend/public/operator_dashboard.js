let userName = localStorage.getItem('name');
let userRole = localStorage.getItem('role');

let nameElement = document.getElementById('user-name');
let roleElement = document.getElementById('user-role');

nameElement.textContent = userName;
roleElement.textContent = userRole;

let working = false;
let stopReason = null;
let customReason = '';
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

// horloge code
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

        
// Rest of the code remains the same

function toggleWorkState() {
    const checkbox = document.getElementById("toggleWorkState");
    if (working) {
        stopStopwatch();
    } else {
        showStopReasonForm();
    }
    working = !working;
    if (!working) {
        logStoppage(); // Log the stoppage when work is resumed
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
    const stopReasonInput = document.getElementById('stopReason');
    const customReasonInput = document.getElementById('customReason');
    stopReason = stopReasonInput.value;
    customReason = customReasonInput.value.trim();
    if (stopReason || customReason !== '') {
        startStopwatch();
        logStoppage(); // Log the stoppage with the selected reason or custom reason
        // Prevent toggle button state change on form submission
        event.stopPropagation();
        document.getElementById('pop-up').classList.remove('is-active'); 
    } else {
        alert('Please select or type a stop reason.');
    }            
}
// timer code
// In the startStopwatch() function
function startStopwatch() {
  stopwatchInterval = setInterval(updateStopwatch, 1000);
  document.getElementById('stopwatch').classList.add('blink');
}

// In the stopStopwatch() function
function stopStopwatch() {
  clearInterval(stopwatchInterval);
  document.getElementById('stopwatch').classList.remove('blink');
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

            
function logStoppage() {
    if (!working) {
        const timeOfStop = new Date().toLocaleTimeString();
        const duration = `${formatTime(stopwatchHours)}:${formatTime(stopwatchMinutes)}:${formatTime(stopwatchSeconds)}`;
        const reason = stopReason;
        const customReasonText = customReason;
        stoppageLog.push({ timeOfStop, duration, reason, customReasonText });
        renderCharts(); // Update the charts after logging the stoppage and calculating the duration
        updateStoppageLogTable();
        // send data to db
        let stoppageData = {
            timeOfStop: timeOfStop,
            duration: duration,
            reason: reason,
            customReasonText: customReason
        };

        // Send a POST request to the server
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
    }
}


function updateStoppageLogTable() {
    const stoppageLogTable = document.getElementById('stoppageLogTable');
    stoppageLogTable.innerHTML = '';
    stoppageLog.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.timeOfStop}</td>
            <td>${entry.duration}</td>
            <td>${entry.reason}</td>
            <td>${entry.customReasonText}</td>
        `;
        stoppageLogTable.appendChild(row);
    });
}


function renderCharts() {
    // Render both pie chart and column chart
    const { stoppagePercentage, stoppageCounts } = calculateChartData();
    renderPieChart(stoppagePercentage);
    renderColumnChart(stoppageCounts);
}

function renderPieChart(stoppagePercentage) {
    // Render doughnut chart
    const ctx = document.getElementById('pieChart').getContext('2d');
    const workPercentage = 100 - stoppagePercentage;

    if (!pieChartInstance) {
        pieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [], // Remove labels
                datasets: [{
                    data: [stoppagePercentage, workPercentage],
                    backgroundColor: ['#e53935', '#7fff00'],
                    hoverBackgroundColor: ['#c62828', '#6cdc00'],
                    borderWidth: 0,
                }]
            },
            options: {
                title: {
                    display: false, // Hide the chart title
                },
                legend: {
                    display: false, // Disable the default legend
                },
                cutoutPercentage: 60, // Adjust the size of the hole in the doughnut
                responsive: true,
                maintainAspectRatio: true, // Set to true to maintain aspect ratio
            }
        });

        // Create custom legend elements
        const legendContainer = document.createElement('div');
        legendContainer.classList.add('custom-legend');

        const downtimeItem = document.createElement('div');
        downtimeItem.classList.add('legend-item');
        downtimeItem.addEventListener('click', () => {
            pieChartInstance.data.datasets[0].backgroundColor = ['#e53935', '#ccc'];
            pieChartInstance.update();
        });

        const downtimeCircle = document.createElement('span');
        downtimeCircle.classList.add('legend-circle');
        downtimeCircle.style.backgroundColor = '#e53935';

        const downtimeText = document.createElement('span');
        downtimeText.classList.add('legend-text');
        downtimeText.textContent = 'Downtime';

        const downtimePercentage = document.createElement('span');
        downtimePercentage.classList.add('legend-percentage');
        downtimePercentage.textContent = `${stoppagePercentage.toFixed(2)}%`;

        downtimeItem.appendChild(downtimeCircle);
        downtimeItem.appendChild(downtimeText);
        downtimeItem.appendChild(downtimePercentage);

        const prodTimeItem = document.createElement('div');
        prodTimeItem.classList.add('legend-item');
        prodTimeItem.addEventListener('click', () => {
            pieChartInstance.data.datasets[0].backgroundColor = ['#ccc', '#7fff00'];
            pieChartInstance.update();
        });

        const prodTimeCircle = document.createElement('span');
        prodTimeCircle.classList.add('legend-circle');
        prodTimeCircle.style.backgroundColor = '#7fff00';

        const prodTimeText = document.createElement('span');
        prodTimeText.classList.add('legend-text');
        prodTimeText.textContent = 'Prod-Time';

        const prodTimePercentage = document.createElement('span');
        prodTimePercentage.classList.add('legend-percentage');
        prodTimePercentage.textContent = `${workPercentage.toFixed(2)}%`;

        prodTimeItem.appendChild(prodTimeCircle);
        prodTimeItem.appendChild(prodTimeText);
        prodTimeItem.appendChild(prodTimePercentage);

        legendContainer.appendChild(downtimeItem);
        legendContainer.appendChild(prodTimeItem);

        const pieChartContainer = document.getElementById('pieChartContainer');
        pieChartContainer.insertBefore(legendContainer, pieChartContainer.firstChild);
    } else {
        // Update the data in the chart instance
        pieChartInstance.data.datasets[0].data = [stoppagePercentage, workPercentage];
        pieChartInstance.update();

        // Update the custom legend elements
        const downtimePercentageElement = document.querySelector('.custom-legend .legend-item:first-child .legend-percentage');
        const prodTimePercentageElement = document.querySelector('.custom-legend .legend-item:last-child .legend-percentage');
        downtimePercentageElement.textContent = `${stoppagePercentage.toFixed(2)}%`;
        prodTimePercentageElement.textContent = `${workPercentage.toFixed(2)}%`;
    }
}

function renderColumnChart(stoppageCounts) {
    // Render column chart
    const ctx = document.getElementById('columnChart').getContext('2d');

    if (!columnChartInstance) {
        columnChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(stoppageCounts),
                datasets: [{
                    label: 'Stoppage Counts',
                    data: Object.values(stoppageCounts),
                    backgroundColor: '#007bff',
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Stoppage Counts by Reason',
                    fontSize: 20,
                },
                legend: {
                    display: false,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                        }
                    }]
                }
            }
        });
    } else {
        // Update the data in the chart instance
        columnChartInstance.data.labels = Object.keys(stoppageCounts);
        columnChartInstance.data.datasets[0].data = Object.values(stoppageCounts);
        columnChartInstance.update();
    }
}

function calculateChartData() {
    const stoppagePercentage = calculateStoppagePercentage();
    const stoppageCounts = calculateStoppageCounts();
    return { stoppagePercentage, stoppageCounts };
}

function calculateStoppagePercentage() {
    const stoppageSeconds = stopwatchHours * 3600 + stopwatchMinutes * 60 + stopwatchSeconds;
    const totalSeconds = 8 * 3600; // Assuming 8 hours of full-time work
    return (stoppageSeconds / totalSeconds) * 100;
}

function calculateStoppageCounts() {
    const stoppageCounts = {};
    stoppageLog.forEach(entry => {
        const reason = entry.reason;
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

