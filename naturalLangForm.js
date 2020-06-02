function clearFilter() {
	window.location = $(location).attr("href").split("?")[0];
}
function applyFilter() {
	let queryString = [];
	document.querySelectorAll(".naturalLanguageInput").forEach((nli) => {
		nli.querySelectorAll(".nlf-pill").forEach((pill) => {
			queryString.push(
				encodeURIComponent(nli.id) +
					"=" +
					encodeURIComponent(pill.getAttribute("value"))
			);
		});
	});
	window.location =
		$(location).attr("href").split("?")[0] + "?" + queryString.join("&");
}
function repopulateInputs() {
	let url = new URL(window.location.href);
	let groupableColumnsJson = JSON.parse(
		document.getElementById(
			document.getElementById("group_by").dataset.suggestJson
		).innerText
	);
	document.querySelectorAll(".naturalLanguageInput").forEach((nli) => {
		url.searchParams.getAll(nli.id).forEach((value) => {
			let label;
			if (nli.id === "group_by") {
				label = groupableColumnsJson.filter((e) => e.value === value)[0]
					.label;
			} else {
				label = value;
			}
			insertPill(value, label, nli.querySelector(".nlf-query input"));
		});
	});
}
function insertPill(value, label, queryInputElement) {
	let stringNode = document.createElement("span");
	stringNode.className = "nlf-pill";
	stringNode.setAttribute("value", value);
	stringNode.setAttribute("label", label);
	stringNode.innerHTML =
		label + '<i class="fa fa-times-circle" aria-hidden="true"></i>';
	stringNode.lastChild.addEventListener("click", (event) => {
		event.target.parentNode.remove();
	});
	queryInputElement.parentElement.insertBefore(
		stringNode,
		queryInputElement.parentElement.lastElementChild
	);
	updateDropdownPosition(
		queryInputElement.parentElement.parentElement.querySelector(
			".nlf-dropdown"
		)
	);
}
function updateDropdownPosition(dropDown) {
	$(dropDown).position({
		my: "left top",
		at: "left bottom",
		of: dropDown.parentElement,
	});
}
function hideDropdown(dropDown) {
	dropDown.classList.remove("active");
}
function showDropdown(dropDown) {
	dropDown.classList.add("active");
}
function populateSuggestions(naturalLanguageInput, suggestions) {
	let dropdown = naturalLanguageInput.querySelector(".nlf-dropdown");
	let dropdownItems = dropdown.querySelector("ul");
	dropdownItems.querySelectorAll("*").forEach((c) => {
		c.remove();
	});
	suggestions.forEach((suggestion) => {
		dropdownItems.insertAdjacentHTML(
			"beforeend",
			'<li value="' +
				suggestion.value +
				'"  label="' +
				suggestion.label +
				'" class="nlf-dropdown-item"><span class="dropdown-string">' +
				suggestion.label +
				"</span></li>"
		);
	});
	showDropdown(dropdown);
}
function getSuggestions(naturalLanguageInput) {
	if ("suggestUrl" in naturalLanguageInput.dataset) {
		$.get(
			naturalLanguageInput.dataset.suggestUrl,
			{
				column: naturalLanguageInput.dataset.suggestColumn,
				expression: naturalLanguageInput.querySelector(
					".nlf-query input"
				).value,
			},
			(suggestions) =>
				populateSuggestions(naturalLanguageInput, suggestions)
		);
	} else {
		const suggestions = JSON.parse(
			document.getElementById(naturalLanguageInput.dataset.suggestJson)
				.innerText
		);
		populateSuggestions(naturalLanguageInput, suggestions);
	}
}
function getFont(element) {
	let style = window.getComputedStyle(element, null);
	return [
		style.getPropertyValue("font-style"),
		style.getPropertyValue("font-variant"),
		style.getPropertyValue("font-weight"),
		style.getPropertyValue("font-size"),
		style.getPropertyValue("font-family"),
	].join(" ");
}
function getTextWidth(text, element) {
	let font = getFont(element);
	const canvas =
		getTextWidth.canvas ||
		(getTextWidth.canvas = document.createElement("canvas"));
	const context = canvas.getContext("2d");
	context.font = font;
	const metrics = context.measureText(text);
	return metrics.width;
}
function resizeInput(element, text) {
	element.style.minWidth =
		Math.ceil(
			getTextWidth(
				text ? text : element.getAttribute("placeholder"),
				element
			)
		) + "px";
}
function updatePlaceholder(queryElement) {
	let queryInputElement = queryElement.querySelector("input");
	if (queryElement.children.length > 1) {
		queryInputElement.setAttribute("placeholder", "...");
	} else {
		queryInputElement.setAttribute(
			"placeholder",
			queryInputElement.dataset.placeholder
		);
	}
	resizeInput(queryInputElement, queryInputElement.value);
}
function initializeNaturalLanguageInput(queryInputElement) {
	let queryElement = queryInputElement.parentElement;
	let dropDown = queryElement.parentElement.querySelector(".nlf-dropdown");
	let dropDownItems = dropDown.querySelector("ul");
	let inputContainer = queryInputElement.parentElement.parentElement;
	updatePlaceholder(queryElement);
	let observer = new MutationObserver(() => {
		updatePlaceholder(queryElement);
		updateDropdownPosition(dropDown);
	});
	observer.observe(queryElement, { childList: true });
	dropDown.addEventListener("mousedown", (event) => {
		event.preventDefault();
	});
	updateDropdownPosition(dropDown);
	dropDownItems.addEventListener("click", (event) => {
		if (event.target.classList.contains("nlf-dropdown-item")) {
			insertPill(
				event.target.getAttribute("value"),
				event.target.getAttribute("label"),
				queryInputElement
			);
			queryInputElement.value = "";
			hideDropdown(dropDown);
		}
	});
	queryInputElement.addEventListener("keydown", (event) => {
		let activeItem = dropDownItems.querySelector(".active");
		switch (event.key) {
			case "ArrowUp":
				if (activeItem == null) {
					dropDownItems.lastElementChild.classList.add("active");
				} else if (activeItem.previousElementSibling != null) {
					activeItem.classList.remove("active");
					activeItem.previousElementSibling.classList.add("active");
				} else {
					activeItem.classList.remove("active");
					dropDownItems.lastElementChild.classList.add("active");
				}
				break;
			case "ArrowDown":
				if (activeItem == null) {
					dropDownItems.firstElementChild.classList.add("active");
				} else if (activeItem.nextElementSibling != null) {
					activeItem.classList.remove("active");
					activeItem.nextElementSibling.classList.add("active");
				} else {
					activeItem.classList.remove("active");
					dropDownItems.firstElementChild.classList.add("active");
				}
				break;
			case "Enter":
				if (activeItem != null) {
					insertPill(
						activeItem.getAttribute("value"),
						activeItem.getAttribute("label"),
						queryInputElement
					);
					queryInputElement.value = "";
					dropDownItems.querySelectorAll("li").forEach((c) => {
						c.classList.remove("active");
					});
				} else if (
					inputContainer.dataset.freetype === "true" &&
					queryInputElement.value != ""
				) {
					insertPill(
						queryInputElement.value,
						queryInputElement.value,
						queryInputElement
					);
					queryInputElement.value = "";
				}
				break;
			case "Escape":
				hideDropdown(dropDown);
				dropDownItems.querySelectorAll("li").forEach((c) => {
					c.classList.remove("active");
				});
				break;
			case "Backspace":
				if (
					!queryInputElement.value &&
					queryInputElement.previousElementSibling != null
				) {
					queryInputElement.previousElementSibling.remove();
				}
				break;
			case "Tab":
				if (activeItem != null) {
					event.preventDefault();
					insertPill(
						activeItem.getAttribute("value"),
						activeItem.getAttribute("label"),
						queryInputElement
					);
					queryInputElement.value = "";
					dropDownItems.querySelectorAll("li").forEach((c) => {
						c.classList.remove("active");
					});
				}
				break;
		}
	});
	queryInputElement.addEventListener("focusout", (e) => {
		let dropdown = e.target.parentElement.parentElement.querySelector(
			".nlf-dropdown"
		);
		if (
			queryInputElement.value &&
			inputContainer.dataset.freetype === "true"
		) {
			insertPill(
				queryInputElement.value,
				queryInputElement.value,
				queryInputElement
			);
			queryInputElement.value = "";
		} else if (
			dropDownItems.querySelector("li") &&
			queryInputElement.value
		) {
			insertPill(
				dropDownItems.querySelector("li").getAttribute("value"),
				dropDownItems.querySelector("li").getAttribute("label"),
				queryInputElement
			);
			queryInputElement.value = "";
		} else {
			queryInputElement.value = "";
			updatePlaceholder(queryElement);
		}
		hideDropdown(dropdown);
	});
	queryInputElement.addEventListener("focusin", (e) => {
		getSuggestions(e.target.parentElement.parentElement);
	});
	queryInputElement.addEventListener("click", (e) => {
		getSuggestions(e.target.parentElement.parentElement);
	});
	queryInputElement.addEventListener("input", (e) => {
		getSuggestions(e.target.parentElement.parentElement);
		resizeInput(e.target, e.target.value);
		updateDropdownPosition(dropDown);
	});
}
document.addEventListener("DOMContentLoaded", function () {
	repopulateInputs();
	document.querySelectorAll(".naturalLanguageInput input").forEach((nli) => {
		initializeNaturalLanguageInput(nli);
		resizeInput(nli, nli.getAttribute("placeholder"));
	});
	document.querySelector("#clearFilter").addEventListener("click", () => {
		clearFilter();
	});
	document.querySelector("#applyFilter").addEventListener("click", () => {
		applyFilter();
	});
});
