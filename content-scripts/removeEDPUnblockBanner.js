
setTimeout(() => {
	browser.runtime.sendMessage({ type: 'GET_EXTENSION_INFO' }, (response) => {
		if (response) {
			const message = {
				type: "ETD_UNBLOCK",
				payload: {
					message: "EXTENSION_INSTALLED",
					version: response.version
				}
			}

			window.postMessage(message, "*");
		}
	});
}, 500);
