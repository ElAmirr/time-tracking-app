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
function startStopwatch() {
    stopwatchInterval = setInterval(updateStopwatch, 1000) //update every seconds
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
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
    // Render pie chart
    const ctx = document.getElementById('pieChart').getContext('2d');
    const workPercentage = 100 - stoppagePercentage;

    if (!pieChartInstance) {
        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Downtime', 'Prod-Time'],
                datasets: [{
                    data: [stoppagePercentage, workPercentage],
                    backgroundColor: ['#ff6347', '#7fff00'],
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Stoppage vs Work Percentage',
                    fontSize: 20,
                },
                legend: {
                    position: 'bottom',
                },
            }
        });
    } else {
        // Update the data in the chart instance
        pieChartInstance.data.datasets[0].data = [stoppagePercentage, workPercentage];
        pieChartInstance.update();
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