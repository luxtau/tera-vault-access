/// body
var GITHUB_URL = "https://raw.githubusercontent.com/luxtau/tera-vault-access/";

function requestTable(region) {
	var url = GITHUB_URL + region;
	$.getJSON(url + "/vault_access.json", function(data) {
		renderTable(data, region, null)
	});

	$(document).on('click.set-cookie', '[data-toggle="tab"]', function (e) {
		e.preventDefault();
		var target = $(this).attr('aria-controls');
		$.cookie('current-tab', target);
		$.cookie('current-lang', region);
	});
}

function requestHistory(region, callback) {
	var url = GITHUB_URL + "history/" + region + ".json";
	$.getJSON(url, function(json) {
		var history = json.dates;
		var days = Object.keys(history).sort();
		days.pop();
		callback(days, history);
	});
}

function requestDay(region, history, date) {
	var commit = history[date];
	if(commit) $.getJSON(GITHUB_URL + commit + "/vault_access.json", function(data) {
		renderTable(data, region, date);
	});
}

function renderTable(json, region, date) {
	var servers = {}

	// transform servers
	$.each(json.info.servers, function(i, name) {
		var s = {id: 's' + (i+1), name: name, data: json.competition[name]};
		servers[name] = s;
	});

	var dt = new Date(json.info.date);
	var infoDate = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
	var shouldRenderHours = infoDate.getDate() == new Date().getDate();
	var shouldRenderTabs = date == null;

	var currentTab = $.cookie('current-tab') || 's1';
	// if(date)
	// 	currentTab = $('#servers > li.active a').attr('aria-controls');

	$('#content').attr('day', shouldRenderHours ? 'today' : 'tomorrow');

	function renderServerTabs(servers) {
		var list = $('#servers');
		var tpl = $('li:first-child', list).clone().removeClass('active');
		list.empty();

		$.each(servers, function(name, server) {
			var li = tpl.clone();

			list.append(li);
			if(server.id == currentTab)
				li.addClass('active');

			$('a:first-child', li)
				.attr('href', '#' + server.id)
				.attr('aria-controls', server.id)
				.text(server.name);
		});
	};

	function renderServerContent(tab, server, current_hour) {

		var data = [server.data.slice(0,12), server.data.slice(12,24)];
		var unions;
		if(region == "NA") 			unions = ['', "Free Traders", "Enlightened Union", "Iron Order"];
		else if(region == "RU")	unions = ['', "Сообщество Торговцев", "Союз Просвещенных", "Железный Орден"];

		var hours = [0,0,0,0];
		$.each(server.data, function(i, h) {
			hours[h.union] += 1;
		});

		$('#day-summary li .badge', tab).each(function(i, el) {
			$(el).text(hours[i+1]);
		});

		$('#today', tab).text(infoDate.toLocaleDateString());

		var startTime = new Date(json.info.start_time);
		var startHour = startTime.getHours();
		var pastHours = true;

		$('table', tab).each(function(i, table) {

			var list = $('tbody', table);
			var tpl = $('tbody > tr:first-child').first().clone().removeClass('text-muted bg-success');
			list.empty();

			$.each(data[i], function(j, data) {

				var li = tpl.clone();
				list.append(li);
				li.attr('union', data.union);

				var td = li.children();

				var hour = data.hour + startHour;
				if(hour >= 24) hour -= 24;

				$(td[0]).text(hour < 10 ? '0' + hour : hour);
				$(td[1]).text(unions[data.union]);
				$(td[2]).text(data.score.toLocaleString());

				if(shouldRenderHours) {
					if(hour == current_hour) {
						pastHours = false;
						li.addClass('bg-success');
					} else if(pastHours) {
						li.addClass('text-muted');
					}
				}
			});

		});
	};


	function renderContent(servers) {
		var list = $('#content');
		var tpl = $('.tab-pane:first-child', list).clone().removeClass('active');
		list.empty();

		var hour = new Date().getHours();

		$.each(servers, function(name, server) {
			var tab = tpl.clone();
			list.append(tab);

			tab.attr('id', server.id);
			if(server.id == currentTab)
				tab.toggleClass('active');

			renderServerContent(tab, server, hour);
		});
	};

	if(shouldRenderTabs)
		renderServerTabs(servers);
	renderContent(servers);
}
