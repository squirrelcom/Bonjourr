
var translator = $('html').translate({lang: "en", t: dict});
var stillActive = false;
const INPUT_PAUSE = 700;
const BLOCK_LIMIT = 16;
const TITLE_LIMIT = 42;
const WEATHER_API_KEY = "7c541caef5fc7467fc7267e2f75649a9";
const UNSPLASH = "https://source.unsplash.com/collection/4933370/1920x1200/daily";
const DATE = new Date();
const HOURS = DATE.getHours();
const START_LINKS = [
	{
		"title": "Unsplash",
		"url": "https://unsplash.com/",
		"icon": "https://besticon-demo.herokuapp.com/icon?url=unsplash.com&size=80"
	},
	{
		"title": "YouTube",
		"url": "https://youtube.com",
		"icon": "https://besticon-demo.herokuapp.com/icon?url=youtube.com&size=80"
	},
	{
		"title": "Bonjourr",
		"url": "https://bonjourr.fr",
		"icon": "https://besticon-demo.herokuapp.com/icon?url=bonjourr.fr&size=80"
	},
	{
		"title": "Wikipédia",
		"url": "http://wikipedia.org",
		"icon": "https://besticon-demo.herokuapp.com/icon?url=wikipedia.org&size=80"
	}
];

//c'est juste pour debug le storage
function deleteBrowserStorage() {
	chrome.storage.sync.clear().then(() => {
		localStorage.clear();
	});
}

//c'est juste pour debug le storage
function getBrowserStorage() {
	chrome.storage.sync.get(null, (data) => {
		console.log(data);
	});
}

function slow(that) {

	$(that).attr("disabled", "");

	stillActive = setTimeout(function() {

		$(that).removeAttr("disabled");

		clearTimeout(stillActive);
		stillActive = false;
	}, INPUT_PAUSE);
}

function tradThis(str) {

	translator.lang(localStorage.lang);
	return translator.get(str);
}

function initTrad() {

	chrome.storage.sync.get(null, (data) => {

		//init
		translator.lang(data.lang);

		//selection de langue
		//localStorage + weather update + body trad
		$(".lang").change(function() {
			chrome.storage.sync.set({"lang": this.value});
			localStorage.lang = this.value;
			translator.lang(this.value);

			date();
			greetings();
		});

		$(".popup .lang").change(function() {
			$(".settings .lang")[0].value = $(this)[0].value;
		});
	});
}

function introduction() {

	chrome.storage.sync.get(null, (data) => {
		
		if (!data.isIntroduced) {
			$("#start_popup").css("display", "flex");
			$(".interface .linkblocks").css("opacity", 0);

			

			chrome.storage.sync.set({"links": START_LINKS});
			quickLinks();

		} else {
			$("#start_popup").remove();
			$(".interface .linkblocks").css("opacity", 1);
		}
	});

	//la marge des popups en pourcentages
	var margin = 0; 
	//init le premier counter avec le style actif
	var premier = $("div.counter span:first-child")[0];
	$(premier).addClass("actif");


	// Start popup
	function dismiss() {

		$("#start_popup").css("background-color", 'transparent');
		$(".popup_window").css("margin-top", "200%");

		//les links modifié en intro sont réinitialisés
		quickLinks();
		
		setTimeout(function() {
			$("#start_popup").remove();
			$(".interface .linkblocks").css("opacity", 1);
		}, 400);

		//mettre ça en false dans la console pour debug la popup
		chrome.storage.sync.set({"isIntroduced": true});
	}

	function countPopup(c) {
		//prend le span qui correspond au margin / 100
		var elem = $("div.counter")[0].children[c / 100];

		//change le style de tous par defaut
		//puis l'element choisi
		$("div.counter span").removeClass("actif");
		$(elem).addClass("actif");
	}

	function btnLang(margin, state) {

		if (state === "pre") {
			if (margin === 0) {
				$(".previous_popup").text(tradThis("Dismiss"));
				$(".next_popup").text(tradThis("Begin"));
			}

			if (margin === 400) {
				$(".next_popup").text(tradThis("Next"));
			}
		}

		if (state === "nxt") {
			if (margin === 100) {
				$(".previous_popup").text(tradThis("Back"));
				$(".next_popup").text(tradThis("Next"));
			}

			if (margin === 500) {
				$(".next_popup").text(tradThis("All set!"));
			}
		}

		if (state === "lng") {
			$(".previous_popup").text(tradThis("Dismiss"));
			$(".next_popup").text(tradThis("Begin"));
		}
	}

	function previous() {

		//event different pour chaque slide
		//le numero du slide = margin / 100
		//ici quand on recule
		margin -= 100;
		btnLang(margin, "pre");

		if (margin === -100) {
			dismiss();
		} else {
			countPopup(margin);
			$(".popup_line").css("margin-left", "-" + margin + "%");
		}
	}

	function next(lang) {

		margin += 100;
		btnLang(margin, "nxt");

		if (margin === 600) {
			dismiss();
		}
		else {
			countPopup(margin);
			$(".popup_line").css("margin-left", "-" + margin + "%");
		}
	}

	$(".previous_popup").click(function() {
		previous();
	});

	$(".next_popup").click(function(){
		next();
	});

	$(".popup .lang").change(function() {
		localStorage.lang = this.value;
		btnLang(null, "lng");
	});
}

function clock() {

	var timesup;

	function start(format) {

		function fixSmallMinutes(i) {
			if (i < 10) {i = "0" + i};
			return i;
		}

		function is12hours(x) {

			if (x > 12) x -= 12; 
			if (x === 0) x = 12;

			return x;
		}

		var h = new Date().getHours();
		var m = new Date().getMinutes();
		m = fixSmallMinutes(m);

		if (format === 12) h = is12hours(h);

		$('#clock').text(h + ":" + m);

		timesup = setTimeout(start, 5000);
	}

	//settings event
	$(".12hour input").change(function() {
		if ($(this)[0].checked) {
			localStorage.clockformat = 12;
			chrome.storage.sync.set({"clockformat": 12});
			clearTimeout(timesup);
			start(12);
		} else {
			localStorage.clockformat = 24;
			chrome.storage.sync.set({"clockformat": 24});
			clearTimeout(timesup);
			start(24);
		}
	});

	start(parseInt(localStorage.clockformat));
}

function date() {

	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

	//la date defini l'index dans la liste des jours et mois pour l'afficher en toute lettres
	$(".date .jour").text(tradThis(days[DATE.getDay()]));
	$(".date .chiffre").text(tradThis(DATE.getDate()));
	$(".date .mois").text(tradThis(months[DATE.getMonth()]));
}

function greetings() {
	var h = DATE.getHours();
	var m;

	if (h >= 6 && h < 12) {
		m = tradThis('Good Morning'); 

	} else if (h >= 12 && h < 17) {
		m = tradThis('Good Afternoon');

	} else if (h >= 17 && h < 23) {
		m = tradThis('Good Evening');

	} else if (h >= 23 && h < 6) {
		m = tradThis('Good Night');
	}

	$('.greetings').text(m);
}

function quickLinks() {

	var stillActive = false, oldURL = false;

	//initialise les blocs en fonction du storage
	//utilise simplement une boucle de appendblock
	function initblocks() {

		$(".linkblocks").empty();

		chrome.storage.sync.get(null, (data) => {

			if (data.links) {

				for (var i = 0; i < data.links.length; i++) {
					appendblock(data.links[i]);
				}
			}
		});
	}

	//rajoute l'html d'un bloc avec toute ses valeurs et events
	function appendblock(arr) {

		//le DOM du block
		var b = "<div class='block_parent'><div class='block' source='" + arr.url + "'><div class='l_icon_wrap'><button class='remove'><img src='src/images/x.png' /></button><img class='l_icon' src='" + arr.icon + "'></div><span>" + arr.title + "</span></div></div>";

		$(".linkblocks").append(b);
	}

	//affiche le bouton pour suppr le link
	function showRemoveLink() {

		var remTimeout;
		var canRemove = false;
		var mobile = mobilecheck();

		//si mobile, un simple hover ative le remove
		//sinon il faut appuyer sur le block
		var eventEnter = (mobile ? "contextmenu" : "mousedown");

		function displaywiggle() {

			$(".block").find(".remove").addClass("visible");
			$(".block").addClass("wiggly");
			$(this).focus();

			canRemove = true;	
		}

		function stopwiggle() {
			clearTimeout(remTimeout);

			$(".block").find(".remove").removeClass("visible");
			$(".block").removeClass("wiggly");

			canRemove = false;
		}

		//j'appuie sur le block pour afficher le remove
		$(".linkblocks").on("mousedown", ".block", function() {

			remTimeout = setTimeout(function() {
				displaywiggle();
			}, 800);
		});

		//click droit pour afficher le remove
		$(".linkblocks").on("contextmenu", ".block", function(event) {

			event.preventDefault();
			displaywiggle();
		});

		//je sors de la zone de linkblocks pour enlever le remove
		$(document).bind("mousedown", function (e) {

			// If the clicked element is not the menu
			if (!$(e.target).parents(".linkblocks").length > 0) {

				stopwiggle();
			}
		});


		//c'est l'event qui active le block comme un lien <a>
		//je l'ai mis la à cause du clearTimeout
		$(".linkblocks").on("click", ".block", function(e) {

			clearTimeout(remTimeout);

			if (canRemove === false) {
				window.location = $(this).attr("source");
			}
		});




		function removeblock(i) {

			chrome.storage.sync.get(null, (data) => {

				//si on supprime un block quand la limite est atteinte
				//réactive les inputs
				if (data.links.length === BLOCK_LIMIT) {

					var input = $("input[name='url']");
					$(input).each(function() {
						$(this).attr("placeholder", "URL");
						$(this).removeAttr("disabled");
					});
				}

				//enleve le html du block
				var block = $(".linkblocks")[0].children[i];
				$(block).addClass("removed");
				
				setTimeout(function() {
					$(block).remove();
				}, 200);
				
				
				//coupe en 2 et concat sans le link a remove
				function ejectIntruder(arr) {
					
					return arr.slice(0, i).concat(arr.slice(i + 1));
				}
				
				var links = data.links;
				chrome.storage.sync.set({"links": ejectIntruder(links)});
			});
		}


		//event de suppression de block
		//prend l'index du parent du .remove clické
		$(".linkblocks").on("click", ".remove", function() {
			
			var index = $(this).parent().parent().parent().index();
			(canRemove ? removeblock(index) : "");
		});
	}

	function linkSubmission() {

		function submissionError(str) {

			oldURL = str;
			var input = $("input[name='url']");

			//affiche le texte d'erreur
			$("p.wrongURL").css("display", "block");
			$("p.wrongURL").css("opacity", 1);

			//l'enleve si le user modifie l'input
			$(input).keypress(function() {

				if ($(this).val() !== oldURL) {
					$("p.wrongURL").css("opacity", 0);
					setTimeout(function() {
						$("p.wrongURL").css("display", "none");
					}, 200);
				}
			});
		}

		function filterUrl(str) {

			var regHTTP = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm;
			var regVal = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;

			//premier regex pour savoir si c'est http
			if (!str.match(regHTTP)) {
				str = "http://" + str;
			}

			//deuxieme pour savoir si il est valide (avec http)
			if (str.match(regVal)) {
				return str.match(regVal)[0];
			} else {
				return false;
			}
		}

		function fetchIcon(str) {

			//prend le domaine de n'importe quelle url
			var a = document.createElement('a');
			a.href = str;
			var hostname = a.hostname;

			return "https://besticon-demo.herokuapp.com/icon?url=" + hostname + "&size=80";
		}

		function saveLink(lll) {

			var full = false;

			chrome.storage.sync.get(null, (data) => {

				var arr = [];

				//array est tout les links + le nouveau
				if (data.links) {

					if (data.links.length < BLOCK_LIMIT - 1) {

						arr = data.links;
						arr.push(lll);

					} else {
						full = true;
					}

				//array est seulement le link
				} else {
					arr.push(lll);
				}
				
				if (!full) {
					chrome.storage.sync.set({"links": arr});
					appendblock(links);
				} else {

					//desactive tout les input url (fonctionne pour popup du coup)
					var input = $("input[name='url']");
					$(input).each(function() {
						$(this).attr("placeholder", "Quick Links full");
						$(this).attr("disabled", "disabled");
					});
				}
			});
		}

		//append avec le titre, l'url ET l'index du bloc
		var title = $(".addlink input[name='title']").val();
		var url = $(".addlink input[name='url']").val();
		var filtered = filterUrl(url);

		//Titre trop long, on rajoute "...""
		if (title.length > TITLE_LIMIT) title = title.slice(0, TITLE_LIMIT) + "...";

		//si l'url filtré est juste
		if (filtered) {
			//et l'input n'a pas été activé ya -1s
			if (!stillActive) {

				var links = {
					title: title,
					url: filtered,
					icon: fetchIcon(filtered)
				}

				saveLink(links);
				slow($(".addlink input[name='url']"));

				//remet a zero les inputs
				$(".addlink input[name='title']").val("");
				$(".addlink input[name='url']").val("");
			}	
		} else {
			if (url.length > 0) submissionError(url);
		}
	}

	$('input[name="title"]').on('keypress', function(e) {
		if (e.which === 13) linkSubmission();
	});

	$('input[name="url"]').on('keypress', function(e) {
		if (e.which === 13) linkSubmission();
	});

	$(".submitlink").click(function() {
		linkSubmission();
	});

	initblocks();
	showRemoveLink();
}

function weather() {

	//init la requete;
	var req;
	
	function dataHandling(data) {

		//si le soleil est levé, renvoi jour
		//le renvoie correspond au nom du répertoire des icones jour / nuit
		function dayOrNight(sunset, sunrise) {
			var ss = new Date(sunset * 1000);
			var sr = new Date(sunrise * 1000);

			if (HOURS > sr.getHours() && HOURS < ss.getHours()) {
				return "day";
			}
			else {
				return "night";
			}
		}

		//prend l'id de la météo et renvoie une description
		//correspond au nom de l'icone (+ .png)
		function imgId(id) {
			if (id >= 200 && id <= 232) {
				return "thunderstorm"
			} 
			else if (id >= 300 && id <= 321) {
				return "showerrain"
			}
			else if (id === 500 || id === 501) {
				return "lightrain"
			}
			else if (id >= 502 && id <= 531) {
				return "showerrain"
			}
			else if (id >= 602 && id <= 622) {
				return "snow"
			}
			else if (id >= 701 && id <= 781) {
				return "mist"
			}
			else if (id === 800) {
				return "clearsky"
			}
			else if (id === 801 || id === 802) {
				return "fewclouds"
			}
			else if (id === 803 || id === 804) {
				return "brokenclouds"
			}
		}


		//pour la description et temperature
		//Rajoute une majuscule à la description
		var meteoStr = data.weather[0].description;
		meteoStr = meteoStr[0].toUpperCase() + meteoStr.slice(1);
		$(".w_desc_meteo").text(meteoStr + ".");



		//si c'est l'après midi (apres 12h), on enleve la partie temp max
		var dtemp, wtemp;

		if (HOURS < 12) {

			//temp de desc et temp de widget sont pareil

			dtemp = wtemp = Math.floor(data.main.temp) + "°";
			$("div.hightemp").css("display", "block");
			$(".w_desc_temp_max").text(Math.floor(data.main.temp_max) + "°");		
		} else {

			//temp de desc devient temp de widget + un point
			//on vide la catégorie temp max
			wtemp = Math.floor(data.main.temp) + "°";
			dtemp = wtemp + ".";
		}

		$(".w_desc_temp").text(dtemp);
		$(".w_widget_temp").text(wtemp);
		
		if (data.icon) {

			$(".w_icon").attr("src", data.icon);
			
		} else {
			//pour l'icone
			var d_n = dayOrNight(data.sys.sunset, data.sys.sunrise);
			var weather_id = imgId(data.weather[0].id);
	 		var icon_src = "src/icons/weather/" + d_n + "/" + weather_id + ".png";
	 		$(".w_icon").attr("src", icon_src);

	 		//sauv l'icone dans wLastState
	 		data.icon = icon_src;
	 		localStorage.wLastState = JSON.stringify(data);
		}

		$(".w_icon").css("opacity", 1);
	}

	function weatherRequest(arg) {

		//a changer
		var url = 'https://api.openweathermap.org/data/2.5/weather?appid=' + WEATHER_API_KEY;

		//auto, utilise l'array location [lat, lon]
		if (arg.geol_lat && arg.geol_long) {
			url += "&lat=" + arg.geol_lat + "&lon=" + arg.geol_long;
		} else {
			url += "&q=" + encodeURI(arg.city);
		}

		url += '&units=' + arg.unit + '&lang=' + arg.lang;


		var request_w = new XMLHttpRequest();
		request_w.open('GET', url, true);

		request_w.onload = function() {
			
			var data = JSON.parse(this.response);

			if (request_w.status >= 200 && request_w.status < 400) {

				//la réponse est utilisé dans la fonction plus haute
				dataHandling(data);

				//sauvegarde la derniere meteo
				localStorage.wLastState = JSON.stringify(data);

				$("p.wrongCity").css("opacity", 0);
				return true;

			} else {
				submissionError(arg.city);
			}
		}

		request_w.send();
	}

	function initWeather() {
		req.city = "Paris";
		req.unit = "metric";

		weatherRequest(req);

		chrome.storage.sync.set({"weather_city": "Paris"});
		chrome.storage.sync.set({"weather_unit": "metric"});
	}
 
	function apply() {

		//enleve les millisecondes
		var now = Math.floor(DATE.getTime() / 1000);
		var lastCall = parseInt(localStorage.wlastCall);
		var lastState = (localStorage.wLastState ? localStorage.wLastState : undefined);

		//if (lastState) dataHandling(JSON.parse(lastState));

		chrome.storage.sync.get(null, (data) => {

			req = {
				city: data.weather_city,
				unit: data.weather_unit,
				geol_lat: data.weather_geol_lat,
				geol_long: data.weather_geol_long,
				lang: data.lang
			};

			if (lastCall) {

				//si weather est vieux d'une demi heure (1800s)
				//faire une requete et update le lastcall
				if (now > lastCall + 1800) {
					weatherRequest(req);
					localStorage.wlastCall = now;
				} else {
					dataHandling(JSON.parse(lastState));
				}

			} else {

				//initialise a Paris + Metric
				//c'est le premier call, requete + lastCall = now
				initWeather();
				localStorage.wlastCall = now;
			}
		});
	}

	function submissionError(str) {

			oldCity = str;
			var input = $(".change_weather input[name='city']");

			//affiche le texte d'erreur
			$("p.wrongCity").css("display", "block");
			$("p.wrongCity").css("opacity", 1);

			//l'enleve si le user modifie l'input
			$(input).keyup(function() {

				if ($(this).val() !== oldCity) {
					$("p.wrongCity").css("opacity", 0);
					setTimeout(function() {
						$("p.wrongCity").css("display", "none");
					}, 200);
				}
			});
	}

	function updateCity() {

		var city = $(".change_weather input[name='city']");
		req.city = city[0].value;

		if (req.city.length < 2) return "";
 		
		chrome.storage.sync.get(null, (data) => {

			weatherRequest(req);

			chrome.storage.sync.set({"weather_city": req.city});

			city.attr("placeholder", req.city);
			city.val("");
			city.blur();
		});
	}

	function updateUnit(that) {

		if ($(that).is(":checked")) {
			req.unit = "imperial";
		} else {
			req.unit = "metric";
		}

		weatherRequest(req);
		
		chrome.storage.sync.set({"weather_unit": req.unit});
	}

	//automatise la meteo
	//demande la geoloc et enleve l'option city
	function updateLocation(that) {

		if ($(that).is(":checked")) {

			$(that).attr("disabled", "");

			navigator.geolocation.getCurrentPosition((pos) => {

				req.geol_lat = pos.coords.latitude
				req.geol_long = pos.coords.longitude;
				chrome.storage.sync.set({"weather_geol_lat": req.geol_lat});
				chrome.storage.sync.set({"weather_geol_long": req.geol_long});

				weatherRequest(req);

				$(".change_weather .city").css("display", "none");
				$(that).removeAttr("disabled");
				
			}, (refused) => {

				//désactive geolocation if refused
				$(that)[0].checked = false;
				$(that).removeAttr("disabled");

				if (!req.city) initWeather();
			});

		} else {

			chrome.storage.sync.remove("weather_geol_lat");
			chrome.storage.sync.remove("weather_geol_long");
			req.geol_lat, req.geol_long = false;
			$(".change_weather .city").css("display", "block");
		}
	}

	//TOUT LES EVENTS

	$(".submitw_city").click(function() {
		if (!stillActive) {
			updateCity();
			slow(this);
		}
		
	});

	$('.change_weather input[name="city"]').on('keypress', function(e) {
		if (!stillActive && e.which === 13) {
			updateCity();
			slow(this);
		}
	});

	$(".units input").change(function() {
		if (!stillActive) {
			updateUnit(this);
			slow(this);
		}
	});


	$(".w_auto input").change(function() {
		if (!stillActive) {
			updateLocation(this);
		}
	});

	$(".lang").change(function() {
		if (!stillActive) {
			req.lang = this.value;
			weatherRequest(req);
			searchbar();
			slow(this);
		}
	});


	//popup checkboxes enables settings checkboxes
	$(".popup .units input").change(function() {
		$(".settings .units input")[0].checked = $(this)[0].checked;
	});

	$(".popup .w_auto input").change(function() {
		$(".settings .w_auto input")[0].checked = $(this)[0].checked;
	});


	apply();
}

function optimizedBgURL(source) {

	//découpe le ".jpg"
	var url = source.slice(0, source.length - 4);
	var res = window.devicePixelRatio * screen.height;

	url += (res > 1200 ? "_large.jpg" : ".jpg");

	return url;
}

//pour rendre le code plus leger
function imgBackground(val) {
	if (val) {
		$(".background").css("background-image", "url(" + val + ")");
	} else {
		return $(".background").css("background-image");
	}
}

function initBackground() {

	chrome.storage.sync.get(null, (data) => {

		var image = data.background_image;
		var type = data.background_type;
		var blur = data.background_blur;
		
		//type un peu useless, mais c'est un ancetre alors je le garde ok
		if (data.background_image) {

			if (type === "default") image = optimizedBgURL(image);
			imgBackground(image);

			//ensuite on blur
			$("input[name='background_blur']").val(data.background_blur);
			blurThis(data.background_blur);
		} else {

			//sans rien l'image de base est utilisé
			imgBackground(optimizedBgURL("src/images/avi-richards-beach.jpg"));
			blurThis(25);
		}

		setTimeout(function() {
			$(".background").css("transition", "filter .2s");
		}, 200);
	});	
}

// render the image in our view
// ces commentaire anglais ne veulent pas dire que j'ai copié collé ok
function renderImage(file) {

	// generate a new FileReader object
	var reader = new FileReader();

	// inject an image with the src url
	reader.onload = function(event) {
		url = event.target.result;

		chrome.storage.sync.set({"background_image": url});
		chrome.storage.sync.set({"background_type": "custom"});

		$('.background').css("background-image", 'url(' + url + ')');

		//enleve le dynamic si jamais
		$("div.dynamic_bg input").prop("checked", false);

		//enleve la selection default bg si jamais
		$(".imgpreview").removeClass("selected");
	}

	// when the file is read it triggers the onload event above.
	reader.readAsDataURL(file);
}


function blurThis(val) {

	var isDark = $("body").attr("class");
	
	if (val > 0) {
		$('.background').css("filter", 'blur(' + val + 'px)');
		$('body, .showSettings button').css("text-shadow", '0 1px 15px rgba(0,0,0,0.5)');
	} else {
		$('.background').css("filter", '');
		$('body, .showSettings button').css("text-shadow", '0 0px 20px rgba(0,0,0,0.9)');
	}

	chrome.storage.sync.set({"background_blur": val});
}


// handle input changes
$(".change_background input[name='background_file']").change(function() {
	renderImage(this.files[0]);
});

// handle input changes
$(".change_background input[name='background_blur']").change(function() {
	blurThis(this.value);
});


function defaultBg() {

	var bgTimeout, oldbg;

	//pour preview le default background
	$(".imgpreview").mouseenter(function() {
		oldbg = imgBackground().slice(4, imgBackground().length - 1);
	});

	//pour preview le default background
	$(".imgpreview img").mouseenter(function() {

		var source = this.attributes.src.value;
		bgTimeout = setTimeout(function() {

			//timeout de 300 pour pas que ça se fasse accidentellement
			//prend le src de la preview et l'applique au background
			imgBackground(source);

		}, 300);
	});


	//pour arreter de preview le default background
	$(".imgpreview").mouseleave(function() {
		clearTimeout(bgTimeout);

		console.log(oldbg);
		imgBackground(oldbg);
	});

	//pour choisir un default background
	$(".imgpreview img").click(function() {

		//prend le src de la preview et l'applique au background
		var source = this.attributes.src.value;

	    imgBackground(optimizedBgURL(source));


		clearTimeout(bgTimeout);
		oldbg = source;

		//enleve le dynamic si jamais
		$("div.dynamic_bg input").prop("checked", false);

		//enleve selected a tout le monde et l'ajoute au bon
		$(".imgpreview").removeClass("selected");
		$(this)[0].parentElement.setAttribute("class", "imgpreview selected");

		//sauve la source
		chrome.storage.sync.set({"background_image": source});
		chrome.storage.sync.set({"background_type": "default"});
	});
}

function dynamicBackground() {

	chrome.storage.sync.get(null, (data) => {

		//quand on active le bg dynamique
		$("div.dynamic_bg input").change(function() {

			if (this.checked) {

				//set un previous background si le user choisi de désactiver ce parametre
				chrome.storage.sync.set({"previous_image": data.background_image});
				chrome.storage.sync.set({"previous_type": data.background_type});

				imgBackground(UNSPLASH);

				chrome.storage.sync.set({"background_image": UNSPLASH});
				chrome.storage.sync.set({"background_type": "dynamic"});

				//enleve la selection default bg si jamais
				$(".imgpreview").removeClass("selected");

			} else {

				//mes yeux
				//previous background devient actuel
				if (data.previous_image !== "undefined") {
					imgBackground(data.previous_image);
					chrome.storage.sync.set({"background_image": data.previous_image});
					chrome.storage.sync.set({"background_type": data.previous_type});
				} else {
					chrome.storage.sync.set({"background_image": optimizedBgURL("src/images/avi-richards-beach.jpg")});
					chrome.storage.sync.set({"background_type": "default"});
					imgBackground(optimizedBgURL("src/images/avi-richards-beach.jpg"));
					blurThis(25);
				}
			}
		});
	});	
}

defaultBg();
dynamicBackground();

function darkmode(choix) {

	function isIOSwallpaper(dark) {

		var bgsrc = $(".background").css("background-image");
		var lbg =  'src/images/ios13wallpaper_l.jpg';
		var dbg = 'src/images/ios13wallpaper_d.jpg';

		if (dark) {

			$("#ios_wallpaper img").attr("src", dbg);

			if (bgsrc.includes(lbg)) {
				imgBackground(dbg);
				chrome.storage.sync.set({"background_image": dbg});
			}

		} else {

			$("#ios_wallpaper img").attr("src", lbg);

			if (bgsrc.includes(dbg)) {
				imgBackground(lbg);
				chrome.storage.sync.set({"background_image": lbg});
			}
		}
	}

	function applyDark(add) {

		if (add) {

			$("body").addClass("dark");
			$(".bonjourr_logo").attr("src", 'src/images/bonjourrpopup_d.png');

			isIOSwallpaper(true);

		} else {

			$("body").removeClass("dark");
			$(".bonjourr_logo").attr("src", 'src/images/bonjourrpopup.png');
		
			isIOSwallpaper(false);
		}
	}

	function auto(blur) {

		var wAPI = JSON.parse(atob(localStorage.wLastState));
		var sunrise = new Date(wAPI.sys.sunrise * 1000);
		var sunset = new Date(wAPI.sys.sunset * 1000);
		var hr = new Date();

		sunrise = sunrise.getHours() + 1;
		sunset = sunset.getHours();
		hr = hr.getHours();

		if (hr < sunrise || hr > sunset) {
			applyDark(true);
		} else {
			applyDark(false);
		}
	}

	function initDarkMode() {

		chrome.storage.sync.get(null, (data) => {

			var dd = (data.dark ? data.dark : "disable");

			if (dd === "enable") {
				applyDark(true);
			}

			if (dd === "disable") {
				applyDark(false);
			}

			if (dd === "auto") {
				auto();
			}
		});		
	}

	function changeDarkMode() {

		chrome.storage.sync.get(null, (data) => {

			if (choix === "enable") {
				applyDark(true);
				chrome.storage.sync.set({"dark": "enable"});
			}

			if (choix === "disable") {
				applyDark(false);
				chrome.storage.sync.set({"dark": "disable"});
			}

			if (choix === "auto") {

				//prend l'heure et ajoute la classe si nuit
				auto();
				chrome.storage.sync.set({"dark": "auto"});
			}
		});
	}

	if (choix) {
		changeDarkMode();
	} else {
		initDarkMode();
	}
}

$(".darkmode select.theme").change(function() {
	darkmode(this.value);
});

$(".popup .darkmode select.theme").change(function() {
	$(".settings .darkmode select.theme")[0].value = this.value;
});


function searchbar() {

	function activate(activated) {

		if (activated) {

			chrome.storage.sync.set({"searchbar": true});

			//pour animer un peu
			$("#searchbar_option .param hr, .popup5 hr, .searchbar_container").css("display", "block");
			$("#choose_searchengine").css("display", 'flex');
			$(".searchbar_container").css("opacity", 1);
			
		} else {

			chrome.storage.sync.set({"searchbar": false});

			//pour animer un peu
			$("#choose_searchengine, #searchbar_option hr, .popup5 hr").css("display", "none");
			$(".searchbar_container").css("opacity", 0);
			setTimeout(function() {
				$(".searchbar_container").css("display", "none");
			}, 200);
		}
	}

	function chooseSearchEngine(choice) {

		var engines = {
			"s_startpage" : ["https://www.startpage.com/do/dsearch?query=", tradThis("Search Startpage")],
			"s_ddg" : ["https://duckduckgo.com/?q=", tradThis("Search DuckDuckGo")],
			"s_ecosia" : ["https://www.ecosia.org/search?q=", tradThis("Search Ecosia")],
			"s_google" : ["https://www.google.com/search", tradThis("Search Google")],
			"s_yahoo" : ["https://search.yahoo.com/search?p=", tradThis("Search Yahoo")],
			"s_bing" : ["https://www.bing.com/search?q=", tradThis("Search Bing")]
		}

		$(".searchbar_container form").attr("action", engines[choice][0]);
		$(".searchbar").attr("placeholder", engines[choice][1]);

		chrome.storage.sync.set({"searchbar_engine": choice});
	}

	//init
	chrome.storage.sync.get(null, (data) => {

		if (data.searchbar) {

			//display
			activate(true);
			$("input.searchbar").focus();

			if (data.searchbar_engine) {
				chooseSearchEngine(data.searchbar_engine);
			} else {
				chooseSearchEngine("s_startpage");
			}
		} else {
			activate(false);
		}
	});

	// Active ou désactive la search bar
	$(".activate_searchbar input").change(function() {

		if (!stillActive) {
			activate($(this).is(":checked"));
		}
		slow(this);
	});

	$(".popup .activate_searchbar input").change(function() {

		var check = $(this)[0].checked;

		if (check) {
			$("#searchbar_option input")[0].checked = true;
			$(".settings #choose_searchengine").css("display", 'flex');
		}
	});


	// Change le moteur de recherche de la search bar selon le select .choose_search
	$(".choose_search").change(function() {
		chooseSearchEngine(this.value);
	});
}

// Signature aléatoire
function signature() {
	var v = "<a href='https://victor-azevedo.me/'>Victor Azevedo</a>";
	var t = "<a href='https://tahoe.be'>Tahoe Beetschen</a>";

    if (Math.random() > 0.5) {
    	$('.signature .rand').append(v + " & " + t);
	} else {
		$('.signature .rand').append(t + " & " + v);
	}
}

function actualizeStartupOptions() {

	chrome.storage.sync.get(null, (data) => {


		//default background 
		$(".choosable_backgrounds .imgpreview img").each(function() {

			//compare l'url des preview avec celle du background
			var previewURL = $(this).attr("src");
			var bgURL = $(".background").css("background-image");

			//si l'url du bg inclu l'url de la preview, selectionne le
			if (bgURL.includes(previewURL)) {
				$(this).parent().addClass("selected");
			}
		});


		//dynamic background
		if (data.background_type === "dynamic") {
			$(".dynamic_bg input")[0].checked = true;
		}


		//dark mode input
		if (data.dark) {
			$(".darkmode select.theme").val(data.dark);
		} else {
			$(".darkmode select.theme").val("disable");
		}
		

		
		//weather city input
		if (data.weather_city) {
			$(".change_weather input[name='city']").attr("placeholder", data.weather_city);
		} else {
			$(".change_weather input[name='city']").attr("placeholder", "Paris");
		}
		

		//check geolocalisation
		//enleve city
		if (data.weather_geol_lat && data.weather_geol_long) {
			$(".w_auto input")[0].checked = true;
			$(".change_weather .city").css("display", "none");
		} else {
			$(".w_auto input")[0].checked = false;
			$(".change_weather .city").css("display", "block");
		}

		//check imperial
		if (data.weather_unit && data.weather_unit === "imperial") {
			$(".units input")[0].checked = true;
		} else {
			$(".units input")[0].checked = false;
		}

		
		//searchbar switch et select
		$(".activate_searchbar input")[0].checked = data.searchbar;

		if (data.searchbar_engine) {
			$(".choose_search")[0].value = data.searchbar_engine;
		} else {
			$(".choose_search")[0].value = "s_startpage";
		}

		//clock
		if (data.clockformat === 12) {
			$(".12hour input")[0].checked = true;
		} else {
			$(".12hour input")[0].checked = false;
		}
			

		//langue
		if (data.lang) {
			$(".lang")[0].value = data.lang;
		} else {
			$(".lang")[0].value = "en";
		}
		
	});
			
}

function mobilecheck() {
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

//affiche les settings
$(".showSettings button").click(function() {

	$(this).toggleClass("shown");
	
	$(".settings").css("display", "block");
	$(".settings").toggleClass("shown");
	$(".interface").toggleClass("pushed");


});

//si settings ouvert, le ferme
$(".interface").click(function() {

	if ($("div.settings").hasClass("shown")) {

		$(".showSettings button").toggleClass("shown");
		$(".settings").removeClass("shown");
		$(".interface").removeClass("pushed");
	}
});


$(document).ready(function() {

	initTrad();

	//very first
	initBackground();
	darkmode();

	//sur la page principale
	clock();
	date();
	greetings();
	weather();
	searchbar();
	quickLinks();

	//moins important, load après
	signature();
	introduction();
	actualizeStartupOptions();
});