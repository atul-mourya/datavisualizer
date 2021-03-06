/* jshint expr: true */

function isElement(obj) {
    try {
        return obj instanceof HTMLElement;
    } catch (e) {
        return (typeof obj === "object") && (obj.nodeType === 1) && (typeof obj.style === "object") && (typeof obj.ownerDocument === "object");
    }
}

var AbstractDataVisualizer = function (data, loadingManager, scripts) {

    var _this = this;
    var container = data.container;

    var _global = {
        data: data,
        loadingManager: loadingManager,
        sceneReady: false,
        ultraHD: false,
        flipDirection : -1
    };

    if (container) {
        if (!isElement(container)) {
            this.container = document.getElementById(container);
            if (this.container == null) {
                container = document.createElement('div');
                document.body.appendChild(container);
                this.container = container;
            }

        } else {
            this.container = container;
        }
    } else {
        container = document.createElement('div');
        document.body.appendChild(container);
        this.container = container;
    }

    this.setting = {
        //screenshot
        cameraAngle1: { phi: Math.PI / 2, theta: Math.PI / 4 },

        //initial values
        nearCamLimit: 18, 
        farCamLimit: 30, 
        autoRotateSpeed: 4, 
        autoRotate: false, 
        rotationSensitivity: 0.2,
        enableDamping: true,
        userControlledAimation: true, 

        //render engine
        antialias: true, 
        physicallyCorrectLights: false, // for more realistic lighting at cost of computation
        toneMappingExposure: 1,
        toneMappingWhitePoint: 1,
        rendererGammaInput: true,
        rendererGammaOutput: true,
        // fpsLimit                : 60,    // frame per second 

        postprocessing: false,

    };

    var tracker = {
        analysis: false,
        pan: false,
        exportScene: true
    };

    this.initSceneSetup = function () {
        _setup().then(_init);
    };

    function _setup() {
        var scriptLoader = new ScriptLoader();
        return new Promise(function (resolve, reject) {
            scriptLoader.load(data.cdn, scripts).then(function () {
                console.log('scripts are loaded');
                _global.client = new ClientJS();
                _global.clock = new THREE.Clock();
                resolve();
            }).catch(function () {
                console.log("Error");
            });
        });
    }

    function _init() {
        THREE.Cache.enabled = true;
        _initScene();
        _initRenderer3();
        _initRenderer();
        _initCssRenderer();
        _initCamera();
        _initControls();
        _initRayCaster();
        _initLights();
        _importAssets();
        _initGeoChart();
        _registerEventListeners();
    }

    function _initScene() {
        _global.scene = new THREE.Scene();
        _global.scene.name = "Scene";
        // _global.scene.background = new THREE.Color(0xffffff);
        // _global.scene.fog = new THREE.Fog(0, 0.1, 0);
        _global.scene2 = new THREE.Scene();
        _global.scene3 = new THREE.Scene();
        _global.scene4 = new THREE.Scene();

        _global.scene4.background = new THREE.TextureLoader().load(_global.data.cdn + '/resources/3dAssets/textures/Bglmae.png');

        _animateFrame();
        // _global.scene.matrixAutoUpdate  = false;
        if (tracker.exportScene == true) window.scene = _global.scene;
    }

    function _initRenderer() {

        _global.renderer = new THREE.WebGLRenderer({
            antialias: _this.setting.antialias,
            alpha: true,
        });

        _global.renderer.setPixelRatio(window.devicePixelRatio);
        _global.renderer.setClearColor(0x000000, 0);

        _global.renderer.gammaInput = _this.setting.rendererGammaInput;
        _global.renderer.gammaOutput = _this.setting.rendererGammaOutput;
        _global.renderer.physicallyCorrectLights = _this.setting.physicallyCorrectLights;
        _global.renderer.toneMappingExposure = _this.setting.toneMappingExposure;

        _global.canvas = _global.renderer.domElement;
        _global.canvas.style.position = "absolute";
        _global.canvas.style.top = "0px";
        _global.canvas.style.zIndex = 0;
        _global.canvas.height = _this.container.clientHeight;
        _global.canvas.width = _this.container.clientWidth;

        _global.renderer.setSize(_global.canvas.width, _global.canvas.height);

        _this.container.appendChild(_global.canvas);

        if (tracker.analysis) _stats();
    }

    function _initRenderer3() {

        _global.renderer3 = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
        });

        _global.renderer3.setPixelRatio(window.devicePixelRatio);

        _global.renderer3.gammaInput = false;
        _global.renderer3.gammaOutput = false;

        _global.canvas = _global.renderer3.domElement;
        _global.canvas.style.position = "absolute";
        _global.canvas.style.top = "0px";
        _global.canvas.style.zIndex = 0;
        _global.canvas.style.filter = "blur(4px)";
        _global.canvas.height = _this.container.clientHeight;
        _global.canvas.width = _this.container.clientWidth;

        _global.renderer3.setSize(_global.canvas.width, _global.canvas.height);

        _this.container.appendChild(_global.canvas);

    }

    function _initCssRenderer() {
        var rect = _global.canvas.getBoundingClientRect();

        _global.renderer2 = new THREE.CSS3DRenderer();
        _global.renderer2.setSize(rect.width, rect.height);

        _global.renderer2.domElement.style.position = 'absolute';
        _global.renderer2.domElement.style.top = 0;
        _this.container.appendChild(_global.renderer2.domElement);
    }

    function _initCamera() {
        
        _global.camera = new THREE.PerspectiveCamera(45, _global.canvas.width / _global.canvas.height, 1, 5000);
        _global.camera.lookAt(0, 0, 0);

    }

    function _initControls() {

        _this.controls = new THREE.OrbitControls(_global.camera, _global.renderer2.domElement);
        _this.controls.maxPolarAngle = Math.PI / 2;
        _this.controls.target = new THREE.Vector3(0, 0, 0);
        _this.controls.enablePan = tracker.pan;
        _this.controls.rotateSpeed = _this.setting.rotationSensitivity;
        _this.controls.enableDamping = _this.setting.enableDamping;
        _this.controls.dampingFactor = 0.25;
        _this.controls.maxPolarAngle = THREE.Math.degToRad(110);
        _this.controls.minPolarAngle = THREE.Math.degToRad(55);
        _this.controls.autoRotateSpeed = _this.setting.autoRotateSpeed;
        _this.controls.autoRotate = _this.setting.autoRotate;

        _this.controls.target0.set(0, 0, 0);

        _this.controls.addEventListener('change', function (e) {
            _refreshRenderFrame();
        });
    }

    function _initRayCaster() {
        _global.raycaster = new THREE.Raycaster();
        _global.raycaster.params.Points.threshold = 0.5;
        _global.mouse = new THREE.Vector2();
    }

    function _initLights() {
        var hLight = new THREE.HemisphereLight(15658734, 6710886, 1);
        var dLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        dLight.position.set(300, 300, 300);
        
        // _global.scene.add(dLight);
        // _global.scene4.add(dLight);
        _global.scene.add(hLight);
        _global.scene4.add(hLight.clone());
    }

    function _importAssets() {

        var fileloader = new THREE.FileLoader();
        fileloader.load(_global.data.url, function (text) {

            var json = JSON.parse(text);
            var loaded = false;
            
            function onLoad() {
                _refreshRenderFrame();
                loaded = true;
            }

            function onError() {
                _global.loadingManager.onError();
            }

            function onProgress(url, itemsLoaded, itemsTotal) {
                _global.loadingManager.onProgress(url, itemsLoaded, itemsTotal);
            }

            if (json.scene) {

                var loadingManager = new LoadingManager(onLoad, onProgress, onError);

                Promise.all([

                    _loadEnvironment(json.scene, loadingManager),
                    // _loadBackground(json.scene, loadingManager),
                    _loadData(json.data, loadingManager),
                    _initDialer(7)

                ]).then(function () {

                    console.log('Environment loaded');
                    _loadBackground(json.scene, loadingManager),

                    _global.sceneReady = true;
                    _global.loadingManager.onLoad();

                    var passes = [
                        // {
                        //     type: "msaa",
                        //     config: {
                        //         "sampleLevel": 2
                        //     },
                        // },
                        {
                            type: "bokeh",
                            config: {
                                focus       : 1,
                                aperture    : 0.025,
                                maxBlur     : 0.008
                            }
                        }
                    ];
                    if (_this.setting.postprocessing && passes.length > 0) {
                        // _global.msaaFilterActive = true;
                        _global.postProcessor = new PostProcessingManager(data, _global.scene4, _global.camera, _global.renderer3, _this.container.clientWidth, _this.container.clientHeight, passes);
                    }
                    
                    _global.mainObject = _global.scene.getObjectByName( 'MainGlobe' );


                    _setCameraDistanceRange( _global.mainObject, _this.setting.nearCamLimit, _this.setting.farCamLimit );
                    _adjustCameraPosition( _this.setting.cameraAngle1 );

                });

            }
            

        });
    }

    function _loadEnvironment(json, loadManager) {
        return new Promise(function (resolve, reject) {

            var objectloader = new THREE.ObjectLoader(loadManager);
            objectloader.setCrossOrigin("anonymous");
            
            objectloader.setTexturePath(_global.data.cdn + json.texturePath );
            objectloader.load(_global.data.cdn + json.url, function (env) {

                // if (env.background != undefined) _global.scene.background = env.background;
                // if (env.fog != undefined) _global.scene.fog = env.fog;
                
                env.rotateY(-Math.PI);

                var geometry1 = new THREE.BufferGeometry().fromGeometry( env.children[0].children[0].geometry );
                var geometry2 = new THREE.BufferGeometry().fromGeometry( env.children[0].children[1].geometry );

                env.children[0].children[0].geometry.dispose();
                env.children[0].children[0].geometry = geometry1;

                env.children[0].children[1].geometry.dispose();
                env.children[0].children[1].geometry = geometry2;
                
                // env.visible = false;

                _global.scene.add(env);
                _global.environmentParts = env;

                resolve();
            });

            // _global.reflectionCube = _loadCubeMap(_global.data.cdn + defaultEnviroment.directory, undefined, loadManager);
            // _global.sceneList = json;

        });
    }

    function _loadBackground(json, loadManager) {
        
        return new Promise(function (resolve, reject) {
            
            _global.bgObj = _createEarthArray(7, 10);
            
            var box = new THREE.Box3().setFromObject(_global.bgObj);
            var cVec3 = new THREE.Vector3(0,0,0).copy(box.getCenter());

            _global.bgObj.position.x = -cVec3.x;

            _global.scene4.add(_global.bgObj);

            resolve();

        });

    }

    function _loadBackground1(json, loadManager) {
        return new Promise(function (resolve, reject) {

            var objectloader = new THREE.ObjectLoader(loadManager);
            objectloader.setCrossOrigin("anonymous");
            
            objectloader.load(_global.data.cdn + json.background, function (bg) {

                // _rotateFromWorld(bg, {x:0, y: Math.PI, z:0});
                // bg.rotateY(-Math.PI);
                bg.translateX(-30);
                // env.visible = false;
                // _global.scene.add(bg);
                
                _global.camera.add(bg);
                _global.scene.add(_global.camera);
                _global.backgroundParts = bg;

                resolve();
            });

            // _global.reflectionCube = _loadCubeMap(_global.data.cdn + defaultEnviroment.directory, undefined, loadManager);
            // _global.sceneList = json;

        });
    }

    function _loadData(url, loadManager) {
        if (url) {
            
            new THREE.FileLoader(loadManager).load(_global.data.cdn + url, function (text) {
                
                var json = JSON.parse(text);

                _global.locationPointer = new THREE.Group();
                _global.locationPointer.name = "Location Pointers";
                _global.scene.add(_global.locationPointer);
                _global.worldWideIncidents =  json.global.weeklyincidents;
                json.locations.forEach(function (element) {
                    _addHotspots(element);
                });
                _this.updateDialer( _global.worldWideIncidents );


            });

        } else {
            
            throw "data not available";

        }
    }

    function _addHotspots(json) {

        if (!_global.mapPointer) _global.mapPointer = new THREE.TextureLoader().load(_global.data.cdn + "/app/images/33622.svg");

        var point = _locationToVector(json.lat, json.lon, 5);
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(point);
        var dotMaterial = new THREE.PointsMaterial({
            size: 0.8,
            sizeAttenuation: true,
            map: _global.mapPointer || new THREE.TextureLoader().load(_global.data.cdn + "/app/images/33622.svg"),
            transparent : true,
            color: new THREE.Color('#34d66e')
        });
        var dot = new THREE.Points(dotGeometry, dotMaterial);
        dot.userData.city = json.name;
        dot.userData.data = json.data;
        dot.userData.latitude = json.lat;
        dot.userData.longitude = json.lon;
        dot.userData.weeklyincidents = json.data.weeklyincidents;
        _global.locationPointer.add(dot);
    }

    function _initDialer(radius, data) {
        
        _global.dialerPanel = new THREE.Group();
        _global.dialerPanel.name = 'dialer panel';

        _global.dialerPanelStatic = new THREE.Group();
        _global.dialerPanelStatic.name = "Dialer Panel Static";

        var months = new THREE.Group();
        months.name = "Months";

        var weekNums = new THREE.Group();
        weekNums.name = "Week Numbers";

        var monthText = document.getElementsByClassName('month');        

        var segments = 500;
        var circleMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.1, gapSize: 0.05 });
        var circleGeo = new THREE.CircleGeometry(radius, segments);
        
        circleGeo.vertices.shift();
        
        var circle = new THREE.Line(circleGeo, circleMat);
        circle.computeLineDistances();
        circle.name = "Dialer Base Circle";

        var weeks = 52;
        var weekAngle = 0;
        var monthAngle = -Math.PI/15;

        _global.dialerBars = new THREE.Group();
        _global.dialerBars.name = "dialerbars";
        
        var barWidth = 0.1;
        var barHeigth = 0.8;
        var barGeo = new THREE.PlaneBufferGeometry(barHeigth, barWidth, 1, 1);

        for (var i = 0; i < weeks; i++) {
            
            var barMat = new THREE.MeshBasicMaterial({
                color: "#34d66e"
            });
            
            var bar = new THREE.Mesh( barGeo, barMat );
            bar.name = 'week' + (i + 1);
            bar.position.y = radius - barHeigth / 2 - 0.65 ;
            bar.rotateZ(Math.PI / 2 + weekAngle);
            _rotateFromWorld(bar, new THREE.Vector3(0, 0, weekAngle));

            var weekNum = document.createElement('p');
            weekNum.innerText = i+1;
            weekNum.className = 'week';

            var p1 = new THREE.CSS3DObject(weekNum);
            p1.position.y = radius - barHeigth / 2 + 0.1;
            p1.rotateZ(weekAngle);
            p1.scale.set(0.3, 0.3, 0.3);
            _rotateFromWorld(p1, new THREE.Vector3(0, 0, weekAngle));

            weekAngle += -2 * Math.PI / weeks;
            
            weekNums.add(p1);
            _global.dialerBars.add(bar);

        }
        _global.dialerPanel.add(_global.dialerBars);

        _global.dialerPanel.add(circle);   

        for(var j = 0; j < monthText.length; j++){

            var p = new THREE.CSS3DObject(monthText[j]);
                      
            p.position.y = radius + 0.25;
            p.rotateZ( monthAngle );
            p.scale.set(0.35, 0.35, 0.35);
            
            _rotateFromWorld(p, new THREE.Vector3(0, 0, monthAngle));
            monthAngle += -2 * Math.PI / 12;

            months.add(p);

        }
            
        _global.dialerPanelStatic.add(months);
        _global.dialerPanelStatic.add(weekNums);

        _global.scene2.add(_global.dialerPanelStatic);
        _global.scene.add(_global.dialerPanel);

    }

    function _initGeoChart() {
        _global.geoData = new LocationDataStatus();
        
        _global.object = _global.geoData.getObject();
        _global.texts = _global.geoData.getTexts();
        _global.statusPanel = _global.geoData.getStatusPanel();
        
        _global.geoData.setDisplay(false);

        _global.object.position.set(2,0,-12);
        _global.texts.position.set(2,0,-12);
        _global.statusPanel.position.set(2,2,-16.5);

        _global.object.scale.set(0.5, 0.5, 0.5);
        _global.texts.scale.set(0.5, 0.5, 0.5);
        _global.statusPanel.scale.set(0.025, 0.025, 0.025);
        
        _global.object.rotateY(Math.PI/4);
        _global.texts.rotateY(Math.PI/4);
        _global.statusPanel.rotateY(Math.PI/4);

        _rotateFromWorld(_global.object, {x:0, y: -Math.PI/4, z:0});
        _rotateFromWorld(_global.texts, {x:0, y: -Math.PI/4, z:0});
        // _rotateFromWorld( _global.statusPanel, {x:0, y: -Math.PI/4, z:0});

        _global.scene3.add(_global.texts);
        _global.scene3.add( _global.statusPanel);
        _global.scene.add(_global.object);
        // _global.camera.add(object);
        // _global.scene.add(_global.camera);

    }

    function _rotateFromWorld( object, angles) {

        object.position.applyEuler(new THREE.Euler(angles.x, angles.y, angles.z, 'XYZ'));

    }

    function _loadCubeMap(path, callback, loadManager) {
        var format = '.jpg';
        var urls = [
            path + 'r' + format, path + 'l' + format,
            path + 'u' + format, path + 'd' + format,
            path + 'f' + format, path + 'b' + format
        ];
        var reflectionCube = new THREE.CubeTextureLoader(loadManager).load(urls, callback);
        return reflectionCube;
    }

    function _setCameraDistanceRange(targetObject, nearLimit, farLimit) {
        var bbox = new THREE.Box3().setFromObject(targetObject);
        _global.nearestCamDist = Math.max(bbox.max.x, bbox.max.y, bbox.max.z);
        _this.controls.minDistance = _global.nearestCamDist + nearLimit;
        _this.controls.maxDistance = _global.nearestCamDist + farLimit;
    }

    function _adjustCameraPosition(cameraAngle) {
        var camPos = _this.controls.minDistance + (_this.setting.nearCamLimit + _this.setting.farCamLimit) / 2;
        var maxDist = _global.nearestCamDist + _this.setting.farCamLimit;
        var offset = _this.setting.extendedFarCamLimit;

        if (_global.client.isMobile() == true) {

            // andriod portrait
            if (screen.orientation && screen.orientation.angle == 0) {
                _setView(camPos + offset, maxDist + offset, cameraAngle);

                // andriod landscape
            } else if (screen.orientation && screen.orientation.angle == (90 || -90)) {
                _setView(camPos, maxDist, cameraAngle);

                // ios portrait
            } else {
                _setView(camPos + offset, maxDist + offset, cameraAngle);
            }

            // Desktop
        } else {
            _setView(camPos, maxDist, cameraAngle);
        }
    }

    function _setView(camPos, maxDist, cameraAngle) {
        var sphericalCoord = new THREE.Spherical(-camPos, cameraAngle.phi, cameraAngle.theta);
        _global.camera.position.setFromSpherical(sphericalCoord);
        _this.controls.maxDistance = maxDist;
        _global.camera.updateProjectionMatrix();
        _this.controls.position0.setFromSpherical(sphericalCoord);
    }

    function _applyMaterial(material, object) {
        for (var field in material) {
            if (object && object.material && object.material[field]) {
                switch (field) {
                    case 'color':
                    case 'emissive':
                        object.material[field] = new THREE.Color().setHex(material[field]);
                        break;
                    default:
                        object.material[field] = material[field];
                        break;
                }
            }
        }
        object.material.needsUpdate = true;
    }

    function _disposeObjMemory(obj) {
        if (obj) {
            if (obj.type === "Mesh" || "Line") {

                if (obj.material) {
                    obj.material.map && obj.material.map.dispose();
                    obj.material.aoMap && obj.material.aoMap.dispose();
                    obj.material.emissiveMap && obj.material.emissiveMap.dispose();
                    obj.material.lightMap && obj.material.lightMap.dispose();
                    obj.material.bumpMap && obj.material.bumpMap.dispose();
                    obj.material.normalMap && obj.material.normalMap.dispose();
                    obj.material.specularMap && obj.material.specularMap.dispose();
                    obj.material.envMap && obj.material.envMap.dispose();
                    obj.material.dispose();
                }
                obj.geometry && obj.geometry.dispose();

            } else if (obj.type === "Group") {
                for (var i = 0; i < obj.children.length; i++) {
                    _disposeObjMemory(obj.children[i]);
                }
            }
        }
    }

    function _render() {
        _global.scene.updateMatrix();
        _global.camera.updateProjectionMatrix();
        if (_this.setting.postprocessing && _global.postProcessor && _global.postProcessor.composer ) {
            _global.postProcessor.update();
            _global.renderer2.render(_global.scene2, _global.camera);
            _global.renderer2.render(_global.scene3, _global.camera);
            _global.renderer3.render(_global.scene4, _global.camera);
        } else {
            
            _global.renderer.render(_global.scene, _global.camera);
            _global.renderer2.render(_global.scene2, _global.camera);
            _global.renderer2.render(_global.scene3, _global.camera);
            _global.renderer3.render(_global.scene4, _global.camera);

        }
    }

    function _animate(doAnimate, timeout) {
        _global.doAnimate = doAnimate;
        if (timeout) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve();
                }, timeout);
            });
        }
    }

    function _startAnimate() {
        if (!_global.doAnimate) {
            _global.doAnimate = true;
        }
    }

    function _stopAnimate() {
        _global.doAnimate = false;
    }

    function _animateFrame() {
        requestAnimationFrame(_animateFrame);
        if (_global.sceneReady && (_global.doAnimate == true || _this.setting.userControlledAimation == true)) {
            _this.controls.update();
            _global.dialerPanel.lookAt(_global.camera.position);
            
            if ( _global.geoData.isVisible ) {
                
                var v = new THREE.Vector3(0,0,0).copy(_global.texts.position);
                var n =  v.project(_global.camera);

                if ( n.x > 0 && _global.flipDirection == -1) {
                    
                    _global.flipDirection = 1;
                    _global.texts.children.forEach(function(element){
                        element.rotateY(Math.PI);
                    });

                } else if( n.x < 0 && _global.flipDirection == 1 ) {
                    
                    _global.flipDirection = -1;
                    _global.texts.children.forEach(function(element){
                        element.rotateY(-Math.PI);
                    });
    
                }

            } 

            _global.statusPanel.lookAt(_global.camera.position); 
            _global.scene4.lookAt(_global.camera.position);

            // _global.scene4.quaternion.copy(_global.camera.quaternion);
            // _global.texts.quaternion.copy(_global.camera.quaternion);
            
            _global.dialerPanelStatic.lookAt(_global.camera.position); 
            if (tracker.analysis) _this.rendererStats.update(_global.renderer), _this.stats.update();
            _render();
        }
    }

    function _refreshRenderFrame() {
        _startAnimate();
        clearTimeout(_global.canvas.renderFrameTimeoutObj);
        _global.canvas.renderFrameTimeoutObj = setTimeout(function () {
            _stopAnimate();
        }, 1000);
    }

    function _onMouseMove(event) {

        var rect = _global.canvas.getBoundingClientRect();

        _global.mouse.x = (event.clientX / rect.width) * 2 - 1;
        _global.mouse.y = -(event.clientY / rect.height) * 2 + 1;

        var detectableObjects = [];

        _global.locationPointer.children.forEach(function (object) {
            detectableObjects.push(object);
        });
        _global.dialerBars.children.forEach(function (object) {
            detectableObjects.push(object);
        });

        _global.raycaster.setFromCamera(_global.mouse, _global.camera);
        var intersects = _global.raycaster.intersectObjects(detectableObjects);

        intersects && _pickObject(intersects);
        // intersects2 && _pickObject(intersects2);

    }

    function _pickObject(intersects) {
        if (intersects.length > 0) {
            if (intersects[0].object != _global.INTERSECTED) {
                if (_global.INTERSECTED)
                    _global.INTERSECTED.material.color.setHex(_global.INTERSECTED.currentHex);
                _global.INTERSECTED = intersects[0].object;
                _global.INTERSECTED.currentHex = _global.INTERSECTED.material.color.getHex();
                _global.INTERSECTED.material.color.set('yellow');
            }
        }
        else {
            if (_global.INTERSECTED)
                _global.INTERSECTED.material.color.setHex(_global.INTERSECTED.currentHex);
            _global.INTERSECTED = null;
        }
    }

    function _createEarthArray(num, separation) {
         
        var bgObjects = new THREE.Group();
        bgObjects.name = 'BGObjects';

        var plainMaterial = new THREE.MeshBasicMaterial({color:0xc4c4c4});
        var wireframeMaterial = new THREE.MeshBasicMaterial({color:0xffffff, blending: THREE.AdditiveBlending, wireframe:true});

        var obj = _global.environmentParts.children[0].clone();
        obj.children[0].material = plainMaterial;
        obj.children[1].material = wireframeMaterial;


        for ( var i = 0 ; i < num ; i++ ){
            
            var objcloned = obj.clone();
            objcloned.name = "bgObj" + i;
            objcloned.scale.set( 0.5, 0.5, 0.5 );
            objcloned.position.set( separation * i, 0, 0 );
            bgObjects.add( objcloned );

        }

        return bgObjects;
    }

    function _clearAll() {
        _global.locationPointer.visible = false;
        _global.object.visible = false;
        if( _global.linePointer ) {
            _disposeObjMemory( _global.linePointer );
            _global.linePointer.parent && _global.linePointer.parent.remove ( _global.linePointer );
        }
        
        _global.texts.children.forEach(function(object){
            object.element.style.display = 'none';
        });

        _global.statusPanel.element.style.display = 'none';
    }

    function _slideTarget( direction, onStart, onLoad ){
        
        onStart && onStart();

        _clearAll();

        var pos =  _global.bgObj.position.x;
        switch ( pos + ( 10 * direction ) ) {
            case 0:
                console.log('zeroth');
                break;
            case -10:
                console.log('first');
                break;
            case -20:
                console.log('second');
                
                break;
            case -30:
                console.log('thrid');
                setTimeout(() => {
                    _global.locationPointer.visible = true;
                }, 1500); 
                break;
            case -40:
                console.log('forth');
                
                break;
            case -50:
                console.log('fifth');
                break;
            case -60:
                console.log('sixth');
                
                break;
        
            default:

                break;
        }


        var callback = function (direction) {
            tween1 (direction)
        }

        var callback2 = function (direction) {

            _global.environmentParts.visible = true;
            TweenMax.to(_global.environmentParts.scale, 0.5, {
                x : 1,
                y : 1,
                z : 1,
                delay: 0.01,
                onComplete: callback3,
                onCompleteParams: [direction]
            });
        }
        
        var callback3 = function (direction) {
            onLoad && onLoad(direction);
        } 

        
        new TweenMax.to(_global.environmentParts.scale, 0.5, {
            x : 0.5,
            y : 0.5,
            z : 0.5,
            onComplete: callback,
            onCompleteParams: [direction],
        });

        function tween1 (direction){
            new TweenMax.to(_global.bgObj.position, 0.5, {
                x: _global.bgObj.position.x + ( 10 * direction ),
                onStart: function () {   
                    _global.environmentParts.visible = false;
                },
                onComplete : callback2,
                onCompleteParams: [direction]
                
            });
        } 
    }

    this.next = function ( onStart, onLoad ) {
        _slideTarget( 1, onStart, onLoad );
    };

    this.previous = function ( onStart, onLoad ) {
        _slideTarget( -1, onStart, onLoad  )
    };

    this.getActiveGlobe= function(){
        
        var result;
        
        switch ( _global.bgObj.position.x ) {
            case 0:
                result = 1;
                break;
            case -10:
                result = 2;
                break;
            case -20:
                result = 3;
                break;
            case -30:
                result = 4;
                break;
            case -40:
                result = 5;
                break;
            case -50:
                result = 6;
                break;
            case -60:
                result = 7;
                break;
            default:
                result = 0;
                break;
        }
        return result;
    };

    this.updateDialer = function(data){
        for( var i = 0; i < 52; i++ ) {
            if ( data[i] <= 10 ) { 
                _global.dialerBars.children[i].material.color.set('#34d66e');
            } else if ( data[i] > 10 && data[i] < 20 ){
                _global.dialerBars.children[i].material.color.set('#eec200');
            } else {
                _global.dialerBars.children[i].material.color.set('#e65038');
            }
        }
    };

    this.updateGeoData = function (obj) {
        var point = _locationToVector(0, obj.userData.longitude-45, 12);
        var point2 = _locationToVector(0, obj.userData.longitude-45, 16.5);
        point2.y += 2; 
        
        _global.object.position.copy(point);
        _global.texts.position.copy(point);
        _global.statusPanel.position.copy(point2);

        var lookAtPos = new THREE.Vector3(0,0,0);

        _global.object.lookAt(lookAtPos);
        _global.texts.lookAt(lookAtPos);
        _global.statusPanel.lookAt(lookAtPos);

        _global.object.rotateY(Math.PI/2);
        _global.texts.rotateY(Math.PI/2);
        _global.statusPanel.rotateY(Math.PI/2);

        _this.updateDialer(obj.userData.weeklyincidents);
        _global.geoData.setDisplay(true);
        
        if( _global.linePointer ) {
            
            _disposeObjMemory( _global.linePointer );
            _global.linePointer.parent && _global.linePointer.parent.remove ( _global.linePointer );

        } 

        _global.object.updateMatrixWorld();

        var p = _global.object.children[3].geometry.attributes.position.array;
        var lPoint = new THREE.Vector3(p[3], p[4], p[5]);
        lpoint = _global.object.localToWorld(lPoint);

        _global.linePointer = _createPointerLine(obj.geometry.vertices[0],  lPoint);
        _global.scene.add(_global.linePointer);

        _global.geoData.update(obj.userData);
        _global.geoData.isVisible = true;
    
    };

    this.setDisplayGeoData = function(boolean){
        _global.geoData.setDisplay(boolean);
        _global.geoData.isVisible = boolean;
    };

    this.getSelectedObject = function () {
        return _global.INTERSECTED ? _global.INTERSECTED : null;
    };

    this.rotate = function (param) {
        if (param && param.direction) {
            _animate(param.play);
            _this.controls.autoRotateSpeed = param.direction * _this.setting.autoRotateSpeed;
            _this.controls.autoRotate = param.play;
        }
    };

    this.resetView = function () {
        _global.scene.position.set(0, 0, 0);
        _global.scene.rotation.set(0, 0, 0);
        _global.scene.scale.set(1, 1, 1);
        _this.controls.reset();
        _render();
    };

    this.screenShot = function (height, width, cameraPosition) {
        if (!_global.sceneReady) return;

        var originalFOV = _global.camera.fov;

        var offsetDepth = 300;
        var adjustFOV = 15;

        return new Promise(function (resolve, reject) {

            _global.renderer.setSize(width, height);
            _global.camera.aspect = width / height;
            _global.camera.fov = adjustFOV;
            _this.controls.maxDistance = _this.controls.maxDistance + offsetDepth;

            if (!cameraPosition) {
                _global.camera.position.set(-466, 142, -591);
                _global.camera.lookAt(0, _this.setting.ground_clearence, 0);
            } else {
                _global.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            }

            _global.environmentParts.children.forEach(function (element) {
                if (element.type == "Mesh" || element.type == "Group") element.visible = false;
            });

            _animate(true, 100).then(function () {

                _stopAnimate();
                _render();
                resolve(_global.canvas.toDataURL());

            }).then(function () {

                _global.renderer.setSize(_this.container.clientWidth, _this.container.clientHeight);
                _global.camera.aspect = _this.container.clientWidth / _this.container.clientHeight;

                _global.camera.fov = originalFOV;
                _this.controls.maxDistance = _this.controls.maxDistance - offsetDepth;

                _global.environmentParts.children.forEach(function (element) {
                    if (element.type == "Mesh" || element.type == "Group") element.visible = true;
                });
                _refreshRenderFrame();
            });


        });
    };

    this.fullscreen = function () {
        var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) || (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) || (document.mozFullScreenElement && document.mozFullScreenElement !== null) || (document.msFullscreenElement && document.msFullscreenElement !== null);
        var docElm = document.documentElement;
        if (!isInFullScreen) {
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            } else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            } else if (docElm.webkitRequestFullScreen) {
                docElm.webkitRequestFullScreen();
            } else if (docElm.msRequestFullscreen) {
                docElm.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    this.experimentalHD = function (boolean) {
        (boolean) ? _global.renderer.setPixelRatio(window.devicePixelRatio * 2): _global.renderer.setPixelRatio(window.devicePixelRatio);
    };

    function _createPointerLine(point1, point2) {
        var geometry = new THREE.BufferGeometry();

        var positions = new Float32Array( 6 ); // 3 vertices per point
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

        var line = new THREE.Line( geometry,  new THREE.LineBasicMaterial() );
        
        line.geometry.attributes.position.array[0] = point1.x;
        line.geometry.attributes.position.array[1] = point1.y;
        line.geometry.attributes.position.array[2] = point1.z;

        line.geometry.attributes.position.array[3] = point2.x - 0.25;
        line.geometry.attributes.position.array[4] = point2.y;
        line.geometry.attributes.position.array[5] = point2.z;

        return line;

    }

    function _locationToVector (latitude, longitude, radius) {
        var phi = (90 - latitude) * (Math.PI / 180),
            theta = (longitude + 180) * (Math.PI / 180),
            x = -((radius) * Math.sin(phi) * Math.cos(theta)),
            z = ((radius) * Math.sin(phi) * Math.sin(theta)),
            y = ((radius) * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    }

    function _registerEventListeners() {

        var targetWindow = [];
        if (window.self !== window.top) {
            targetWindow = [window.parent, window];
        } else {
            targetWindow = [window];
        }

        targetWindow.forEach(function (element) {
            _keyPressEvent(element);
        });

        window.focus();
        window.addEventListener('resize', _onWindowResize, false);
        window.addEventListener("orientationchange", _onOrientationChange, false);
        window.addEventListener('mousemove', _onMouseMove, false);

        $(window).focus(function () {
            _refreshRenderFrame();
        });
        $(window).blur(function () {
            _stopAnimate();
        });
    }

    function _keyPressEvent(element) {
        element.addEventListener('keypress', function (event) {
            var x = event.key;
            switch (x) {
                case "h" || "H":
                    !_global.ultraHD ? _global.ultraHD = true : _global.ultraHD = false;
                    console.warn('UltraHD set to ' + _global.ultraHD + '. Performance may reduce if UltraHD is enabled. Toggle by pressing key H');
                    _this.experimentalHD(_global.ultraHD);
                    break;
                case "j" || "J":
                    if (_global.postProcessor) {
                        if (!_global.msaaFilterActive) {
                            _this.setting.antialias = false;
                            _recreateRendererContext();
                            _global.postProcessor.composer.renderer = _global.renderer;
                            _refreshRenderFrame();
                            _global.msaaFilterActive = true;

                        } else {
                            _this.setting.antialias = true;
                            _recreateRendererContext();
                            _global.postProcessor.composer.renderer = _global.renderer;
                            _refreshRenderFrame();
                            _global.msaaFilterActive = false;
                        }
                        console.warn('MSAA Quality set to ' + _global.msaaFilterActive + '. Performance may reduce if MSAA Quality is enabled. Toggle by pressing key J');
                    } else {
                        console.warn("Post Processing is enabled but no passes assigned. Ignoring this event.");
                    }
                    break;
                case "q" || "Q":
                        _global.geoData.setDisplay(false); 
                        if( _global.linePointer ) {
                            _disposeObjMemory( _global.linePointer );
                            _global.linePointer.parent && _global.linePointer.parent.remove ( _global.linePointer );
                        }
                    break;
            }
        });
    }

    function _recreateRendererContext() {
        var tempCamRangeMax = _this.controls.maxDistance;
        var tempCamRangeMin = _this.controls.minDistance;

        _global.renderer.dispose();
        _global.renderer.forceContextLoss();
        _global.renderer.context = undefined;
        var targetDOM = _global.renderer.domElement;
        targetDOM.parentNode.removeChild(targetDOM);
        _initRenderer();

        _this.controls.dispose();
        _initControls();
        _this.controls.minDistance = tempCamRangeMin;
        _this.controls.maxDistance = tempCamRangeMax;
    }

    function _onOrientationChange() {
        _adjustCameraPosition(_this.setting.cameraAngle1);
        _startAnimate();
        setTimeout(function () {
            _stopAnimate();
        }, 1000);
    }

    function _onWindowResize() {
        _global.canvas.height = _this.container.clientHeight;
        _global.canvas.width = _this.container.clientWidth;
        _global.postProcessor && _global.postProcessor.composer.setSize(_global.canvas.width, _global.canvas.height);
        _global.renderer.setSize(_global.canvas.width, _global.canvas.height);
        _global.renderer2.setSize(_global.canvas.width, _global.canvas.height);
        _global.renderer3.setSize(_this.container.clientWidth, _this.container.clientHeight);
        _global.camera.aspect = _global.canvas.width / _global.canvas.height;

        _refreshRenderFrame();
    }

    function _stats() {
        _this.stats = new Stats();
        _this.stats.dom.style.position = 'absolute';
        _this.stats.dom.style.top = '0px';
        _this.stats.dom.style.left = '80px';
        document.body.appendChild(_this.stats.dom);
        _this.rendererStats = new THREEx.RendererStats();
        _this.rendererStats.domElement.style.position = 'absolute';
        _this.rendererStats.domElement.style.left = '0px';
        _this.rendererStats.domElement.style.top = '0px';
        document.body.appendChild(_this.rendererStats.domElement);
    }

};

function find(array, key, value) {
    if (array) {
        for (i = 0; i < array.length; i++) {
            x = array[i];
            if (x[key] === value) {
                return x;
            }
        }
    }
    return null;
}

DataVisualizer = function (data, loadingManager, overrides) {
    var scripts = [
        [
            "/app/js/vendor/threejs/r93/three.js"
        ],
        [
            "/app/js/vendor/threejs/r93/OrbitControls.js",
            "/app/js/vendor/threejs/r93/stats.min.js",
            "/app/js/vendor/threejs/r93/CSS3DRenderer.js",
            "/app/js/vendor/threex/threex.rendererstats.js",
            "/app/js/vendor/clientjs/client.min.js",
            "/app/js/vendor/greensock/TweenMax.min.js",
        ],
        [
            "/app/js/visualizer/LocationDataStatus.js",
            "/app/js/visualizer/PostProcessor.js",
        ]
    ];
    AbstractDataVisualizer.call(this, data, loadingManager, scripts);
    if (overrides) {
        for (var key in overrides) {
            this[key] = overrides[key];
        }
    }
};

DataVisualizer.prototype = Object.create(AbstractDataVisualizer.prototype);
DataVisualizer.prototype.constructor = DataVisualizer;

function LoadingManager(onLoad, onProgress, onError) {

    var scope = this;

    var isLoading = false;
    var itemsLoaded = 0;
    var itemsTotal = 0;
    var urlModifier;

    this.onStart = undefined;
    this.onLoad = onLoad;
    this.onProgress = onProgress;
    this.onError = onError;
    this.itemsStart = function (numberOfItems) {

        itemsTotal += numberOfItems;
        isLoading = true;

    };

    this.itemStart = function (url) {

        itemsTotal++;

        if (isLoading === false) {

            if (scope.onStart !== undefined) {

                scope.onStart(url, itemsLoaded, itemsTotal);

            }

        }

        isLoading = true;

    };

    this.itemEnd = function (url) {

        itemsLoaded++;

        if (scope.onProgress !== undefined) {

            scope.onProgress(url, itemsLoaded, itemsTotal);

        }

        if (itemsLoaded === itemsTotal) {

            isLoading = false;

            if (scope.onLoad !== undefined) {

                scope.onLoad();

            }

        }

    };

    this.itemError = function (url) {

        if (scope.onError !== undefined) {

            scope.onError(url);

        }

    };

    this.resolveURL = function (url) {

        if (urlModifier) {

            return urlModifier(url);

        }

        return url;

    };

    this.setURLModifier = function (transform) {

        urlModifier = transform;
        return this;

    };
}

function ScriptLoader() {
    function _add(basepath, urls, loadingManager) {
        var promises = [];
        if (urls && urls.length > 0) {
            for (var i in urls) {

                (function (url) {
                    var promise = new Promise(function (resolve, reject) {
                        loadingManager && urls && loadingManager.itemStart(url);
                        var script = document.createElement('script');
                        script.src = url;

                        script.addEventListener('load', function () {
                            loadingManager && loadingManager.itemEnd(url);
                            console.log("Loaded: " + url);
                            resolve(url);
                        }, false);

                        script.addEventListener('error', function () {
                            console.log("Error: " + url);
                            loadingManager && loadingManager.itemEnd(url);
                            reject(url);
                        }, false);

                        document.body.appendChild(script);
                    });

                    promises.push(promise);
                })(basepath + urls[i]);
            }
        }
        return promises;
    }

    this.load = function (basepath, urls, loadingManager) {

        var promise = null;
        basepath = !basepath ? "" : basepath;
        if (urls && urls.length > 0) {
            for (var i in urls) {
                (function (basepath, item) {
                    if (promise) {
                        promise = promise.then(function () {
                            console.log('loaded');
                            return Promise.all(_add(basepath, item, loadingManager));
                        });
                    } else {
                        promise = Promise.all(_add(basepath, item, loadingManager));
                    }
                })(basepath, urls[i]);
            }
        }
        console.log(promise);
        // loadingManager && urls && loadingManager.itemsStart(urls.length);
        // var promises = _add(urls,loadingManager);
        // console.log(promises);
        return promise;
    };
}
