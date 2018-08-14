var UziMonitor = (function () {
	
	var monitors = [];
	
	function init() {		
		$("#addGraphButton").on("click", function () {
			addMonitor();
		});

		Uzi.onMonitorUpdate(function () {
			monitors.forEach(function (monitor) {
				var colors = palette('rainbow', Uzi.pins.length);
				var min = 0;
				var max = 0;				
				var pins = Uzi.pins.filter(function (pin) {
					return monitor.pins.indexOf(pin.number) !== -1;
				});
				var data = { 
					datasets: pins.map(function (pin) {
						var i = Uzi.pins.findIndex(function (each) { 
							return each.number == pin.number; 
						});
						var color = "#" + colors[i];
						var dataset = monitor.chart.data.datasets.find(function (each) {
							return each.id === pin.number;
						});
						var oldData = dataset === undefined ? [] : dataset.data;
						var newData = pin.history.map(function (each) {
							timestamp = each.timestamp;
							if (timestamp > max) {
								max = timestamp;
								min = max - 10000;
							}
							return {
								x: timestamp,
								y: each.value
							};
						});
						return {
							id: pin.number,
							label: "Pin " + pin.number,
							fill: false,
							borderColor: color,
							backgroundColor: color,
							//pointBorderWidth: 1,
							pointRadius: 0,
							data: oldData.concat(newData).filter(function (each) {
								return each.x >= min && each.x <= max;
							})
						}
					})
				};
				var options = {
					maintainAspectRatio: false,
					showTooltips: false,
					animation: {
						duration: 0
					},
					scales: {
						xAxes: [{
							display: false,
							type: 'linear',
							position: 'bottom',
							ticks: {
								min: min,
								max: max
							}
						}]
					},
					elements: {
						line: {
							tension: 0,
						}
					}
				};
				monitor.chart.data = data;
				monitor.chart.options = options;
				monitor.chart.update();
			});
		});
	}

	function addMonitor() {		
		choosePins(function (selection) {
			buildLineChartFor(selection);
			updatePinsReporting();
		});	
	}
	
	function removeMonitor(monitor) {		
		var index = monitors.indexOf(monitor);
		monitors.splice(index, 1);
		monitor.container.remove();
		updatePinsReporting();
	}
	
	function updatePinsReporting() {
		var pins = new Set();
		monitors.forEach(function (monitor) {
			monitor.pins.forEach(function (pin) {
				pins.add(pin);
			}); 
		});
		pins.forEach(function (pin) { Uzi.activatePinReport(pin); });
		var toRemove = [];
		Uzi.pinsReporting.forEach(function (pin) {
			if (!pins.has(pin)) { toRemove.push(pin); }
		});
		toRemove.forEach(function (pin) { Uzi.deactivatePinReport(pin); });
	}
	
	function buildLineChartFor(pins) {
		var editor = $("#editor");
		var container = $("<div>").addClass("monitor");
		var closeButton = $("<button>")
			.attr("type", "button")
			.attr("aria-label", "Close")
			.css("position", "absolute")
			.css("right", "10px")
			.addClass("close")
			.append($("<span>")
				.attr("aria-hidden", "true")
				.html("&times;"))
			.on("click", function () {
				removeMonitor(monitor)
			});
		var canvas = $("<canvas>");
		container.draggable({
			containment: "parent",
			scroll: true,
			snap: true
		});
		container.resizable({
			minHeight: 150,
			minWidth: 200,
			handles: "n, e, s, w, ne, se, sw, nw"
		});
		
		// HACK(Richo): JQuery UI seems to add the "position:relative"
		container.attr("style", null);
		
		container.append(closeButton);
		container.append(canvas);
		editor.append(container);
		
		var chart = createChartOn(canvas.get(0));
		var monitor = {
			container: container,
			pins: pins,
			chart: chart,
		};
		monitors.push(monitor);
	}

	function choosePins(callback) {
		$("#monitorSelectionModal #acceptButton").on("click", function () {
			var selected = [];
			$("#monitorSelectionModal input:checked").each(function () { 
				selected.push(parseInt(this.value));
			});
			callback(selected);
			$("#monitorSelectionModal").modal('hide');
		});
		$("#monitorSelectionModal").on("hide.bs.modal", function () {
			$("#monitorSelectionModal #acceptButton").off("click");
			$("#monitorSelectionModal").off("hide.bs.modal");
		});
		$("#monitorSelectionModal input:checkbox").each(function () { 
			this.checked = false; 
		});
		$("#monitorSelectionModal").modal({});
	}
	
	function createChartOn(canvas) {		
		var ctx = canvas.getContext('2d');
		var data = {};
		var options = {};
		return new Chart(ctx, {
			type: 'line',
			data: data,
			options: options
		});
	}

	return {
		init: init,
		monitors: monitors
	};
})();
