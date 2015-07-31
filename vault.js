/// events
$(function() {
	requestTable();
});

$(document).on('click.set.cookie', '[data-toggle="tab"]', function (e) {
	e.preventDefault();
	var target = $(this).attr('aria-controls');
	$.cookie('current-tab', target);
	$.cookie('current-lang', 'ru');
});

/// body
function requestTable() {
	$.getJSON("https://raw.githubusercontent.com/luxtau/tera-vault-access/master/vault_access.json", renderTable);
}

function log() { 
	var s = [];
	for (var i = 0; i < arguments.length; i++) {
		s.push(arguments[i].toString());
	}
	console.log(s.join(", "));
}

function renderTable(json) {
	var servers = {}

	// transform servers
	$.each(json.info.servers, function(i, name) {
		var s = {id: 's' + (i+1), name: name, data: json.competition[name]};
		servers[name] = s;
	});


	var currentTab = $.cookie('current-tab') || 's1';

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
		var unions = ['', "Сообщество Торговцев", "Союз Просвещенных", "Железный Орден"]

		var hours = [0,0,0,0];
		$.each(server.data, function(i, h) {
			hours[h.union] += 1;
		});

		$('#day-summary li .badge', tab).each(function(i, el) {
			$(el).text(hours[i+1]);
		});

		$('#today', tab).text(new Date(json.info.date).toLocaleDateString());


		$('table', tab).each(function(i, table) {
			// console.log('table', i, table);

			var list = $('tbody', table);
			var tpl = $('tbody > tr:first-child').first().clone().removeClass('text-muted bg-success');
			list.empty();

			// console.log('template',i, tpl);
			// console.log('data', i, data[i]);

			$.each(data[i], function(j, data) {
				// console.log('hour', i, j, data);

				var li = tpl.clone();
				list.append(li);
				li.attr('union', data.union);

				// console.log('li', typeof(li), li);
				var td = li.children();

				$(td[0]).text(data.hour < 10 ? '0' + data.hour : data.hour).addClass('union' + data.union);
				$(td[1]).text(unions[data.union]);
				$(td[2]).text(data.score.toLocaleString());

				var hour = i * 12 + j;
				if(hour < current_hour)
					li.addClass('text-muted');
				else if(hour == current_hour)
					li.addClass('bg-success');
			});

		});
	};


	function renderContent(servers) {
		var list = $('#content');
		var tpl = $('.tab-pane:first-child', list).clone().removeClass('active');
		list.empty();

		var hour = new Date().getUTCHours() + 3;	// RU region timezone
		hour = new Date().getHours();

		$.each(servers, function(name, server) {
			var tab = tpl.clone();
			list.append(tab);

			tab.attr('id', server.id);
			if(server.id == currentTab)
				tab.toggleClass('active');

			// console.log('render server', server.id, server.name, tab);
			renderServerContent(tab, server, hour);
		});
	};

	renderServerTabs(servers);
	renderContent(servers);
}
