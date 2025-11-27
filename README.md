# Ecole Tres Directe Unblock

[Ecole Tres Directe](https://github.com/newtondotcom/ecole-tres-directe) is a website (unofficial) built by EcoleDirecte users and for EcoleDirecte users.


> [!IMPORTANT]
> Ecole Tres Directe extension only works for the [Ecole Tres Directe](https://ecole-tres-directe.vercel.app) website! If you want an extension changing blocking headers anywhere outside [the official Ecole Tres Directe instance](https://ecole-tres-directe.vercel.app) you may want to fork the extension and edit by yourself or install the [CORS Unblock extension](https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino).


**Haven't tried Ecole Tres Directe yet? Try it at [ecole-tres-directe.vercel.app](https://ecole-tres-directe.vercel.app)**

This extension provides the following features to Ecole Tres Directe :

- [x] Overrides `CORS` restrictions for cross-origin requests (it allows requests against localhost).
- [x] Bypasses the restrictions of the `Origin` and `Referer` headers from EcoleDirecte API.


## Contributing

- Clone the repository: `git clone https://github.com/Magic-Fishes/Ecole-Directe-Plus-Unblock.git`
- Depending on your browser, run `node build.js chromium` or `node build.js firefox`. You will find the output in `dist/`
- Depending on your browser, go to chrome://extensions or about:debugging and enable developer mode
- Load the unpacked extension (the browser looks either for the `manifest.json` or for the folder where the `manifest.json` file is located)
