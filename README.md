![logo](./assets/icon.png)

# CmdTab

## Overview

CmdTab is a tab management Chrome extension. It is built using [shadcn-ui](https://github.com/shadcn-ui/ui) and heavily utilizes [cmdk](https://github.com/pacocoursey/cmdk) for keyboard interactions.

### Installing

Since the extension is not yet available on the Chrome Web Store, you can install it in one of the following ways:

-   Download the build (`/build/chrome-mv3-prod`) from this repository.
-   Build it from the source code.

After that, follow [these](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) steps to add the extension to your browser:

1. Open the extensions page in Chrome (`chrome://extensions or edge://extensions`).
2. Enable Developer Mode.
3. Drag the downloaded build folder onto the extensions page to import it. Do not delete the folder afterward.

### Why yet another tab management extension?

Previously, I've used [OneTab](https://chromewebstore.google.com/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall) and [Toby](https://chromewebstore.google.com/detail/toby-for-chrome/hddnkoipeenegfoeaoibdmnaalmgkpip) but wanted something in-between with the following characteristics:

-   No sign-up required for import/export and customizations.
-   Simple and clean UI.
-   Basic search/filtering capabilities.
-   Intuitive tagging with excellent keyboard support.
-   Smooth performance even with a large number (1000+) of saved tabs.

### Chrome only?

For now, yes. In theory, adding support for other browsers should be straightforward as it's built using [Plasmo](https://github.com/PlasmoHQ/plasmo), but nothing on the roadmap yet.

## Development

To set up the development environment, run the following commands:

```bash
npm install
npm run dev
```

### Generating a consistent development key

It's useful to have a consistent extension ID during development. One way to do it is by using the [Chrome Developer Dashboard](https://developer.chrome.com/docs/extensions/reference/manifest/key#keep-consistent-id) (it requires paying a 5$ fee, though).

You can also generate a key locally by following [these](https://stackoverflow.com/a/46739698) steps:

-   Generate keys:

```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem

openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
```

-   Generate extension ID:

```bash
openssl rsa -in key.pem -pubout -outform DER | shasum -a 256 | head -c32 | tr 0-9a-f a-p
```

### Roadmap

Some features planned for future releases include:

-   AI powered auto-tagging

## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).
