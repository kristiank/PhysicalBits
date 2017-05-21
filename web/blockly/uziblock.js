var UziBlock = (function () {
	
	var blocklyArea, blocklyDiv, workspace;	

	function initToolbox(toolbox) {
		workspace = Blockly.inject(blocklyDiv, { toolbox: toolbox });
	}
	
	function initBlocks(blocks) {		
		Blockly.defineBlocksWithJsonArray(blocks);
	}	
	
	function makeResizable() {
		var onresize = function (e) {
			// Compute the absolute coordinates and dimensions of blocklyArea.
			var element = blocklyArea;
			var x = 0;
			var y = 0;
			do {
			  x += element.offsetLeft;
			  y += element.offsetTop;
			  element = element.offsetParent;
			} while (element);
			// Position blocklyDiv over blocklyArea.
			blocklyDiv.style.left = x + 'px';
			blocklyDiv.style.top = y + 'px';
			blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
			blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
		}
		window.addEventListener('resize', onresize, false);
		onresize();
		Blockly.svgResize(workspace);
	}
	
	function init(area, div) {
		blocklyArea = area;
		blocklyDiv = div;
		
		var counter = 0;
		ajax.request({
			type: 'GET',
			url: 'toolbox.xml',
			success: function (xml) {
				initToolbox(xml);
				makeResizable();
				if (++counter == 2) {
					restore();
				}
			}
		});
		
		ajax.request({
			type: 'GET',
			url: 'blocks.json',
			success: function (json) {
				initBlocks(JSON.parse(json));
				if (++counter == 2) {
					restore();
				}
			}
		});
	}
	
	function getGeneratedCode(){
		return workspace.getTopBlocks().map(function (block) { 
			var code = Blockly.JavaScript.blockToCode(block);
			return JSON.parse(code);
		});
	}
	
	function save() {
		localStorage["uzi"] = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
	}
	
	function restore(){
		Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(localStorage["uzi"]), workspace);
		workspace.addChangeListener(save);
	}
	
	return {
		init: init,
		getGeneratedCode: getGeneratedCode,
		getWorkspace: function () { return workspace; },
		save: save,
		restore: restore
	};
	
})();