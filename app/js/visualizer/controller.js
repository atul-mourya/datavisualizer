/* jshint expr: true */

function getContextPath() {
    return window.context || "" === window.context ? window.context : window.location.pathname.substring(0, window.location.pathname.indexOf("/", 2));
}

var baseUrl = null;
window.location.origin || (window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "")),
baseUrl = window.location.origin + getContextPath();

baseUrl = '/datavisualizer';

var e = {
    settings:{
        container: document.getElementById('visualizer')
    }
};

e.loadDataVisualizer = function() {
    var a = new LoadingManager();
    a.onLoad = function() {
        //onLoad
        // e.loadingData.isLoading = false
    };

    a.onProgress = function(a, t, r) {
        //onProgress
        // e.loadingData.isLoading = true,
        // e.loadingData.itemsLoaded = t,
        // e.loadingData.itemsTotal = r,
        // e.loadingData.progress = Math.floor(t / r * 100),
        // TODO  :  create progressbar here
        // e.loadingData.lastProgress = e.loadingData.progress)
    };

    var t = baseUrl + "/resources/data_lookup.json";
    var r = new DataVisualizer({
        url: t,
        container: e.settings.container,
        cdn: baseUrl
    },a);
    r.initSceneSetup();
    e.visualizer = r;

};

e.loadDataVisualizer();

document.addEventListener('click', function (event) {
    var element = e.visualizer.getSelectedObject();
    if (element) {
        console.log("You selected : " + element.userData.city);
        e.visualizer.updateGeoData(element);
        document.querySelector('.panel-active-firewall').style.display = 'block';
    } else {
        console.log("Nothing Selected");
    }
});
var dailyStatusContainer = document.getElementById('monthStatsPanel');

e.barChart = new BarChart(dailyStatusContainer);
e.barChart.init();
document.querySelector('#CalenderPanel').style.display = 'none';


e.showMonthlyStats = function (month) {
    
    updateCalenderPanel( month );

};

function updateCalenderPanel(month) {

    document.querySelector('.calender-controller-header.selected-month p').innerText = month.toUpperCase();
    e.barChart.update( month.toLowerCase() );
    document.querySelector('#CalenderPanel').style.display = 'block';
    e.visualizer.setDisplayGeoData(false);
    document.querySelector('.panel-active-firewall').style.display = 'none';
    document.querySelector('.panel-active-sonar').style.display = 'block';
    
}

document.querySelector('#CalenderPanel').addEventListener("change", function (event) {

    updateCalenderPanel(event.target.value);
    
});

document.querySelector('#calender-controller i.fas.fa-times').addEventListener('click', function(event) {
    
    document.querySelector('#CalenderPanel').style.display = 'none';
    document.querySelector('.panel-active-sonar').style.display = 'none';

    
});

