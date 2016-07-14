'use strict';

angular.module("GimmeShows", ["ngRoute", "ui.bootstrap", "duScroll"])
.config(function ($routeProvider) {

	$routeProvider.when("/", {
		controller: 	"HomeController"
	});
})

const TEST_SHOW = "Friends";
const TEST_URL 	= "https://www.tastekid.com/api/similar?q=friends&k=231165-PetProje-6CF21L08";
const OTHER_URL = "http://www.omdbapi.com/?t=" + 'friends' + "&tomatoes=true&plot=full";
const PLACEHOLDER_IMAGE = "http://www.jordans.com/~/media/jordans%20redesign/no-image-found.ashx?h=275&la=en&w=275&hash=F87BC23F17E37D57E2A0B1CC6E2E3EEE312AAD5B";

angular.module("GimmeShows").controller("HomeController",
function HomeController($scope, $http, $document) {

	$scope.showNotFound = false;
	$scope.detailsOn 	= false;

	/* This function gets called when an user enters a search */
	$scope.searchSimilarShows = function (){

		$scope.similarShows 	= [];	/* Former results dissappear right away */
		$scope.inputShow 		= $scope.searchInput;
		$scope.searchInput 		= "";

		var url 				= "https://www.tastekid.com/api/similar?q=" 
									+ $scope.inputShow + "&k=231165-PetProje-6CF21L08"
									+ "&limit=100"; /* The api limits to 100 */
		makeSearchRequest(url);
	}

	/* This function takes care of making a search request to tastekid's API */
	function makeSearchRequest(url){

		$.ajax({
			url: 		url,
			type: 		"GET",
			dataType: 	'jsonp'

		}).success(function (data) {
			if(data.Similar.Results.length === 0){
				$scope.showNotFound = true;
				$scope.similarShows = [];
			} else {
				$scope.showNotFound = false;
				$scope.similarShows = data.Similar.Results;

				for(var i = 0; i < $scope.similarShows.length; i++){
					setShowInfo(i);
				}
			}
			/* Apply the changes and scroll down to the results */
			$scope.$apply();
			scrollToResults();

		}).error(function (data) {
			console.log("ERROR: Error fetching similar shows.");
		})
	}

	/* This function gets called when a single show is selected */
	$scope.getShowDetails = function(id){
		if($scope.detailsOn){
			$scope.detailsOn = false;
			return;
		}

		$scope.selectedShow 	= $scope.similarShows[id.replace("show","")];
		$scope.detailsOn 		= true;

		$http({
			method: 'GET',
			url: "http://api.tvmaze.com/shows/" + $scope.selectedShow.tvmazeId

		}).then(function successCallback(response) {
			var data 					= response.data;
			$scope.selectedShow.summary = cleanHtml(data.summary);

		}, function errorCallback(response) {
			console.log("ERROR: Error fetching from tvmaze.");
		});

	}

	/* HELPER FUNCTIONS */

	/* Helper function for retrieving a link for www.streamallthis.is */
	function setStreamLink(nr, showName){
		showName 				= showName.toLowerCase();
		var wordsInShowName 	= showName.split(" ");
		showName 				= "";

		for(var i = 0; i < wordsInShowName.length -1; i++){
			if(wordsInShowName[i] === "&"){
				showName = showName + "and" + "-";
			} else {
				showName = showName + wordsInShowName[i] + "-";
			}
		}

		showName = showName + wordsInShowName[wordsInShowName.length-1];

		var url= "http://streamallthis.is/watch/" + showName;

		$.ajax({
			url: 		url,
			type: 		"GET",
			dataType: 	'jsonp'

		}).always(function (data) {
			if(data.status === 200){
				$scope.similarShows[nr].streamLink 			= url;
				$scope.similarShows[nr].streamLinkAvailable = true;
			} else {
				$scope.similarShows[nr].streamLinkAvailable = false;
			}
		})
	}

	/* Helper function for setting all kinds of stuff for a single show */
	function setShowInfo(nr){

		$scope.similarShows[nr].id 		= "show" + nr; /* HTML element ID */
		$scope.similarShows[nr].isOpen 	= false;

		/* Sending a request to get an image and imdb link */
		$http({
			method: 	'GET',
			url: 		"http://api.tvmaze.com/search/shows?q=" 
						+ $scope.similarShows[nr].Name

		}).then(function successCallback(response) {
			var data = response.data;
			for(var i = 0; i < data.length; i++){
				if(data[i].show.name.trim().toLowerCase() === $scope.similarShows[nr].Name.trim().toLowerCase()){
					$scope.similarShows[nr].tvmazeId = data[i].show.id;

					if(data[i].show.image && data[i].show.image.medium){
						$scope.similarShows[nr].image = data[i].show.image.medium;
					}
					if(data[i].show.externals.imdb){
						$scope.similarShows[nr].imdb = "http://www.imdb.com/title/" + data[i].show.externals.imdb;
					}
					break;
				}
			}
			/*If there was no image, we set a placeholder image*/
			if(!$scope.similarShows[nr].image){
				$scope.similarShows[nr].image = PLACEHOLDER_IMAGE;
			}/* If there was no imdb id, then we link to an imdb search instead*/
			if(!$scope.similarShows[nr].imdb){
				$scope.similarShows[nr].imdb = 	"http://www.imdb.com/find?ref_=nv_sr_fn&q=" 
												+  $scope.similarShows[nr].Name + "&s=all";
			}

		}, function errorCallback(response) {
			console.log("ERROR: Error fetching image.");
		});
	}

	/* This function takes care of scrolling to the search result location */
	function scrollToResults() {
		var duration 		= 1500;
		var offset 			= 20;
		var resultElement 	= angular.element(document.getElementById('showResults'));

		$document.duScrollToElement(resultElement, offset, duration, easeOutQuint);
	}

	function cleanHtml(string) {
		string 		= string.replace("<p>","");
		string		= string.replace("</p>","");
		string 		= string.replace("<em>","");
		string		= string.replace("</em>","");

		return string;
	}

	/* Ease in functions for scrolling, from https://gist.github.com/gre/1650294
	*/
	function easeInQuart(t) {
		return t*t*t*t;
	}

	function easeOutCubic(t) {
		return (--t)*t*t+1;
	}

	function easeInOutQuint(t) {
		return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t;
	}

	function easeOutQuint(t) {
		return 1+(--t)*t*t*t*t;
	}

	/* ONLY FOR DEVELOPEMENT */

	function searchShowOnStartup(){
		$scope.searchInput = "friends";
		$scope.searchSimilarShows();
	}

	//searchShowOnStartup();

})