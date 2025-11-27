console.log("handlePostMessage Loaded");

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.id === browser.runtime.id) {
		console.log("handlePostMessage message", message);
		window.postMessage({
			type: "EDPU_MESSAGE",
			payload: message
		}, "*");
	}
});