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

document.addEventListener('mousedown', function (event) {
    var element = e.visualizer.getSelectedObject();
    if(element) {
        if ( element.parent.name == "Location Pointers") {
            console.log("You selected : " + element.userData.city);
            e.visualizer.updateGeoData(element);
            document.querySelector('.panel-active-firewall').style.display = 'block';
        } else if(element.parent.name == "dialerbars"){
            console.log("Week selected : " + element.name);
        }
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
    // document.querySelector('.panel-active-sonar').style.display = 'none';
    
});

document.querySelector("#btnLeft").addEventListener('click', function (event) {
    var onStart = null;
    var onLoad = function () {
        onTargetChange();
    };
    resetUI();
    e.visualizer.next( onStart, onLoad );
});

document.querySelector("#btnRight").addEventListener('click', function (event) {
    var onStart = null;
    var onLoad = function () {
        onTargetChange();
    };
    resetUI();
    e.visualizer.previous( onStart, onLoad );
});

function resetUI() {
    document.querySelector('#CalenderPanel').style.display = 'none';
    document.querySelector('.panel-active-sonar').style.display = 'none';
    document.querySelector('.panel-active-firewall').style.display = 'none';
    document.querySelector('.panel-active-insight').style.display = 'none';
    document.querySelector('.panel-active-autoprotect').style.display = 'none';
    document.querySelector('#visualizer').style.filter = 'blur(0px)';
}

function onTargetChange() {
    
    var activeGlobe = e.visualizer.getActiveGlobe();

    switch ( activeGlobe ) {
        case 1:
            // Sample Status 1 UI
            document.querySelector('#btnLeft').style.display = 'none';
            document.querySelector('.btnRight-text').innerText = 'Sample1';
            break;
        case 2:
            // Sample Status 2 UI
            document.querySelector('#btnLeft').style.display = 'block';
            document.querySelector('.btnLeft-text').innerText = 'Sample1';
            document.querySelector('.btnRight-text').innerText = 'Sample2';
            break;
        case 3:
            // AutoProtect Status UI
            console.log('this target: autoprotect');
            document.querySelector('.panel-active-autoprotect').style.display = 'block';
            document.querySelector('.btnLeft-text').innerText = 'Sample2';
            document.querySelector('.btnRight-text').innerText = 'Firewall';
            break;
        case 4:
            //Firewall status UI
            console.log('this target: firewall');
            document.querySelector('.panel-active-firewall').style.display = 'block';
            document.querySelector('.btnLeft-text').innerText = 'Autoprotect';
            document.querySelector('.btnRight-text').innerText = 'Sonar';
            break;
        case 5:
            // Sonar Status UI
            console.log('this target: sonar');
            updateCalenderPanel('January');
            document.querySelector('#visualizer').style.filter = 'blur(5px)';
            document.querySelector('.panel-active-sonar').style.display = 'block';
            document.querySelector('.btnLeft-text').innerText = 'Firewall';
            document.querySelector('.btnRight-text').innerText = 'Insight';
            break;
        case 6:
            // insight Status UI
            console.log('this target: insight');
            document.querySelector('#btnRight').style.display = 'block';
            document.querySelector('.panel-active-insight').style.display = 'block';
            document.querySelector('.btnLeft-text').innerText = 'Sonar';
            document.querySelector('.btnRight-text').innerText = 'Sample3';
            break;
        case 7:
            // Sample Status 3 UI
            document.querySelector('#btnRight').style.display = 'none';
            document.querySelector('.btnLeft-text').innerText = 'Sample3';
            break;
        default:
            break;
    }

};