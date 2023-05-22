function removeStyles() {
	document.getElementById("item1").classList.remove("item-selected")
	document.getElementById("item2").classList.remove("item-selected")
	document.getElementById("item3").classList.remove("item-selected")
	document.getElementById("item4").classList.remove("item-selected")
	document.getElementById("item5").classList.remove("item-selected")
	document.getElementById("item6").classList.remove("item-selected")
}

function applyStyle(item) {
	var elem = document.getElementById(item.id);
	elem.classList.add("item-selected");
}

function sendUDP(msg) {
	$.post('/SendUDP', {key: msg})
}