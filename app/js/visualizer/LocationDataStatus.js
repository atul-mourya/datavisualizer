var LocationDataStatus = function () {
		
	var z = -0;

	var solved = 0xffffff;
	var ongoing = 0xffff00;
	var critical = 0xff0000;

	var statusPanel = new THREE.CSS3DObject( document.getElementById('firewall-panel') );
	// statusPanel.rotateY(Math.PI);
	statusPanel.scale.set(0.05, 0.05, 0.05);

	var incidentsText = document.querySelector('#firewall-panel .incidents');
	var solvedText = document.querySelector('#firewall-panel .solved');
	var ongoingText = document.querySelector('#firewall-panel .ongoing');
	var criticalText = document.querySelector('#firewall-panel .critical');
	var locationText = document.querySelector('#firewall-panel .title-dynamic');

	var group = new THREE.Group();
	group.name = 'Location Status';

	var valueText1 = createText('0%');
	var valueText2 = createText('0%');
	var valueText3 = createText('0%');
	var label 	   = createText( 'Live Firewall Status' );

	var geo1 = new THREE.BoxGeometry(3, 0.1, 1);
	var geo2 = new THREE.BoxGeometry(3, 0.1, 1);
	var geo3 = new THREE.BoxGeometry(3, 0.1, 1);

	geo1.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.1/2, z));
	geo2.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.1/2, z));
	geo3.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.1/2, z));

	var mat1 = new THREE.MeshLambertMaterial({ color:0xff0000 });
	var mat2 = new THREE.MeshLambertMaterial({ color:0xff0000 });
	var mat3 = new THREE.MeshLambertMaterial({ color:0xff0000 });

	var bar1 = new THREE.Mesh( geo1, mat1 );
	var bar2 = new THREE.Mesh( geo2, mat2 );
	var bar3 = new THREE.Mesh( geo3, mat3 );

	bar1.position.set( 4, 0, 0 );
	bar2.position.set( 0, 0, 0 );
	bar3.position.set( -4, 0, 0 );

	valueText1.position.set( 4, 0, 0 );
	valueText2.position.set( 0, 0, 0 );
	valueText3.position.set(-4, 0, 0 );
	label.position.set(0, -1, 0 );
	// statusPanel.position.set(-9.5, 5, 0)


	group.add( bar1 );
	group.add( bar2 );
	group.add( bar3 );

	var textGroup = new THREE.Group();
	textGroup.add( valueText1 );
	textGroup.add( valueText2 );
	textGroup.add( valueText3 );
	textGroup.add( label );
	// textGroup.add( statusPanel );

	this.setDisplay = function (boolean) {
		group.visible = boolean;
		
		var a = boolean ? 'block' : 'none';
		valueText1.element.style.display = a;
		valueText2.element.style.display = a;
		valueText3.element.style.display = a;
		label.element.style.display = a;
		statusPanel.element.style.display = a;
		
	};

	this.getObject = function () {
		return group;
	};

	this.getTexts = function () {
		return textGroup;
	};

	this.getStatusPanel = function () {
		return statusPanel;
	};

	this.update = function (params) {

		bar1.material.color.set( setColor(params.data.barlevel1) );
		bar2.material.color.set( setColor(params.data.barlevel2) );
		bar3.material.color.set( setColor(params.data.barlevel3) );

		valueText1.element.innerText = params.data.barlevel1 + ' %';
		valueText2.element.innerText = params.data.barlevel2 + ' %';
		valueText3.element.innerText = params.data.barlevel3 + ' %';


		incidentsText.innerText = "incidents : "+ params.data.incidents;
		solvedText.innerText 	= "solved : " 	+ params.data.solved;
		ongoingText.innerText 	= "ongoing : " 	+ params.data.ongoing;
		criticalText.innerText 	= "critical : " + params.data.critical;
		
		locationText.innerText 	= params.city;
		
		valueText1.position.y = params.data.barlevel1/10 + 0.5;
		valueText2.position.y = params.data.barlevel2/10 + 0.5;
		valueText3.position.y = params.data.barlevel3/10 + 0.5;


		new TweenMax.to(bar1.scale, 1, {ease: Elastic.easeOut.config(1, 1),
			y: params.data.barlevel1
		});
		new TweenMax.to(bar2.scale, 1, {ease: Elastic.easeOut.config(1, 1),
			y: params.data.barlevel2
		});
		new TweenMax.to(bar3.scale, 1, {ease: Elastic.easeOut.config(1, 1),
			y: params.data.barlevel3
		});
	};

	function createText(value) {
		
		var p = document.createElement('p');
		p.innerText = value;
		p.className = 'location-data-value';

		var p1 = new THREE.CSS3DObject(p);
			p1.rotateY(Math.PI);
			p1.scale.set(0.3, 0.3, 0.3);
			
		return p1;

	}



	function setColor(value) {
		if ( value > 90 ) {
			return solved;
		} else if ( value ){
			return ongoing;
		} else {
			return critical;
		}
	}

};
