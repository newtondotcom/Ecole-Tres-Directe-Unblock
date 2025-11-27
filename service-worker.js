function getBrowser() {
	if (typeof chrome !== "undefined") {
		if (typeof browser !== "undefined") {
			return "Firefox";
		} else {
			return "Chrome";
		}
	} else {
		return "Edge";
	}
}

const userBrowser = getBrowser();

browser.declarativeNetRequest.updateEnabledRulesets(
	{ enableRulesetIds: ["change_origin"] }
)

// browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
// 	if (changeInfo.status === "complete") {
// 		browser.scripting.executeScript({
// 			target: { tabId: tab.id },
// 			files: ["content-scripts/DOMInjectionBridge.js"]
// 		});
// 	}
// });

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "GET_EXTENSION_INFO") {
		const extensionInfo = {
			name: browser.runtime.getManifest().name,
			version: browser.runtime.getManifest().version
		};
		sendResponse(extensionInfo);
	}
	return true;
});

function sendEdpMessage(message) {
	browser.tabs.query({ url: ["https://*.ecole-tres-directe.vercel.app/*", "http://localhost:3000/*"] }, (tabs) => {
		tabs.forEach(tab => {
			browser.tabs.sendMessage(tab.id, message);
		});
	});
}

async function updateCookiesRules(cookies) {
	const removeRuleIds = await browser.declarativeNetRequest.getDynamicRules()
		.then(rules => rules.map(rule => rule.id));

	const rules = [];
	const gtk = cookies.find((cookie) => cookie.split("=")[0].toLowerCase() === "gtk")?.split("=")[1];

	if (!gtk) {
		sendEdpMessage({ action: "noGtkCookie"})
		return;
	}

	rules.push({
		id: 10,
		priority: 1,
		condition: {
			urlFilter: "||ecoledirecte.com",
			requestMethods: ["post"],
			resourceTypes: ["xmlhttprequest", "main_frame", "sub_frame"],
			excludedInitiatorDomains: ["www.ecoledirecte.com", "ecoledirecte.com"]
		},
		action: {
			type: "modifyHeaders",
			requestHeaders: [
				{
					header: "X-GTK",
					operation: "set",
					value: gtk
				},
				{
					header: "Cookie",
					operation: "set",
					value: cookies.join(";")
				},
			]
		},
	});

	await browser.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: removeRuleIds,
		addRules: rules
	});

	sendEdpMessage({ action: "gtkRulesUpdated" });
}

function interceptCookieGTK(details) {
	const url = new URL(details.url);
	const queryParams = new URLSearchParams(url.search);
	if (queryParams.get("gtk") !== "1") return;

	const headers = details.responseHeaders;
	const cookies = [];

	for (const { name, value } of headers) {
		if (name !== "set-cookie") continue;
		if (userBrowser === "Firefox") {
			value.split("\n").forEach((cookie) => {
				cookies.push(cookie.split(";")[0]);
			})
			break;
		}
		cookies.push(value.split(";")[0]);
	}
	if (cookies.length) {
		updateCookiesRules(cookies);
	} else {
		sendEdpMessage({ action: "noCookie" });
	}

	return { responseHeaders: headers };
}

browser.webRequest.onHeadersReceived.addListener(
	interceptCookieGTK,
	{ urls: ["*://api.ecoledirecte.com/v3/login.awp*"] },
	userBrowser === "Firefox" ? ["responseHeaders"] : ["responseHeaders", "extraHeaders"]
);
