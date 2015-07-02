// Here we will add our javacript functions to clarify our design.

//INITIALIZATION

persistence.store.websql.config(persistence, 'tracker', 'A database to store different tracking elements', 5 * 1024 * 1024);

var Track = persistence.define('Track', {
	name: 'TEXT',
	type: 'TEXT'
});

var Value = persistence.define('Value', {
	date: 'DATE',
	value: 'TEXT',
});

Track.hasMany('values', Value, 'track');	
	
persistence.schemaSync();

FlurryAgent.startSession('95363BG8QGGT756JQMJR');

function storeTrack(trackID, trackName,trackType){
	if(!trackName || trackType == "None"){
		// The data provided is wrong. Tell to the user.
		blackberry.ui.dialog.standardAskAsync("You must provide the tracker's name and the data type that will be stored", blackberry.ui.dialog.D_OK,{}, {title:"Incomplete data"});
	}
	else{
		if(!trackID){//NEW TRACKER
			// Check if the trackName is in the database.
			Track.all().filter("name", "=", trackName).count(
				function f(c){
					if(c==0){
						// The provided data its ok, lets save in the database.
						var track = new Track({
							name: trackName,
							type: trackType
						});
						persistence.add(track);
						bb.popScreen();
					}
					else{
						// The provided trackName exists in the database. Inform to the user.
						blackberry.ui.dialog.standardAskAsync("The track name must be unique", blackberry.ui.dialog.D_OK,{}, {title:"Incorrect track name"});
					}
				}
			);
		}
		else{ // EDITING TRACK
			Track.load(trackID, 
				function(x){
					x.name = trackName;
					persistence.add(x);
					persistence.flush();
				}
			);
			bb.popScreen();
			// Trick to change the track name. 
			setTimeout(
				function() {
					document.getElementById('track-data').innerHTML = "Track: "+trackName+" - Type: "+trackType;
				}, 600
			);
		}
	}
}

function CheckValidValue(input){
	var decimal=  /^[-+]?[0-9]+(\.[0-9]+)?$/;
	var yes = "Yes";
	var no = "No";
	if(input.match(decimal) || input.match(no) || input.match(yes) ){
		return true;
	}
	else{
		return false;
	}
		
} 

function storeData(trackID, value, date, valueID){
	if(!CheckValidValue(value) || trackID == "None" || !trackID){
		// The data provided is wrong. Tell to the user.
		blackberry.ui.dialog.standardAskAsync("You must provide a correct value and the tracker related", blackberry.ui.dialog.D_OK,{}, {title:"Incomplete data"});
	}
	else{
		if(!valueID){ // NEW DATA
			Track.load(trackID,
				function saveData(x){
						
					var newValue = new Value({
						date: date,
						value: value
					});
					newValue.track = x;
					persistence.add(newValue);
					bb.popScreen();
				}
			);
		}
		else{// EDITING DATA
			Value.load(valueID, 
				function(x){
					x.value = value;
					x.date = date;
					persistence.add(x);
					persistence.flush();
				}
			);
			bb.popScreen();
			//Trick to change the track name. 
			setTimeout(
				function() {
					document.getElementById('value').innerHTML = value;
					document.getElementById('date').innerHTML = moment(date).format(localStorage.getItem('dateFormat'));

				}, 600
			);
		}
		// Checking if the track is in the database.

	}
}

function removeTrack(trackID, back){
	blackberry.ui.dialog.standardAskAsync("If you remove this track, you will remove the data related too. Are you sure that you want to remove this track?", blackberry.ui.dialog.D_OK_CANCEL, 
		function (response){
			if (response.return == "Ok"){
				Track.load(trackID, 
					function(x){
						persistence.remove(x);
						persistence.flush();
					}
				);
				var values = Value.all().filter("track", '=' , trackID).each(
					function (x) {
						persistence.remove(x);                                                  
						persistence.flush();
					}
				);
				if(back){
					bb.popScreen();
				}	
				else{
					hideTrackAfterRemove(trackID);
				}
			}
		}
	, {title:"Be careful"});
}

function removeValue(valueID, back){
	blackberry.ui.dialog.standardAskAsync("Are you sure that you want to remove this value?", blackberry.ui.dialog.D_OK_CANCEL, 
		function (response){
			if (response.return == "Ok"){ 
				Value.load(valueID, 
					function(x){
						persistence.remove(x);
						persistence.flush();
					
					}
				);
				if(back){
					bb.popScreen();
				}
				else{
					hideValueAfterRemove(valueID);
				}
			}
		}
	, {title:"Be careful"});
}

function loadConfig(){
	document.addEventListener('webworksready', 
		function() {
			console.log('BB10 APIs are ready');	
			bb.init(
			{
				ondomready : 
				function(element, id, params) {
	
					if (id == 'mainScreen'){
						FlurryAgent.logEvent('Main Screen');
						appendTracks();
						bbm.register();
					}

					if (id == 'track') {
						FlurryAgent.logEvent('Track details');
						appendValues(params.trackName, params.trackID, params.trackType);
					}
					
					if (id == 'editTrack'){
						FlurryAgent.logEvent('Edit track');
						editInformationTrack(params.trackID, params.trackName, params.trackType);
					}
					
					if (id == 'editData'){
						FlurryAgent.logEvent('Edit data');
						editInformationValue(params.valueID, params.valueDate, params.valueValue, params.track, params.trackType);
					}
					
					if (id == 'newData'){
						FlurryAgent.logEvent('New Data');
						// If we are adding inside the track screen, we provide the trackName.
						addTrack(params.trackName);
						// // If we are adding inside the track screen, we provide the track type to show the proper input.
						addValueCustomForm(params.trackType);
						preloadDateTime(new Date());
					}
					
					if (id == 'data'){
						FlurryAgent.logEvent('Data details');
						showValue(params.valueID, params.value_, params.valueDate, params.trackName, params.trackType);
					}

					if (id == 'deleteValues'){
						FlurryAgent.logEvent('Deleting data');
						appendValuesToBeRemoved(params.trackID);
					}

					if (id == 'deleteTracks'){
						FlurryAgent.logEvent('Deleting values');
						appendTracksToBeRemoved();
					}
				}
			});

			if (localStorage.getItem('dateFormat') == null) {
				localStorage.setItem('dateFormat', 'DD/MM/YYYY - HH:mm');
			};
			// Open our first screen
			bb.pushScreen('main_screen.html', 'mainScreen');
			
		}
	);
}

function exportData(id){
	alert("HOLA");
	alert(id);
}