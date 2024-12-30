import "@web/src/polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";

import { ModuleRegistry } from "@ag-grid-community/core";
import { LicenseManager } from "@ag-grid-enterprise/core";

import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";


ModuleRegistry.registerModules([ClientSideRowModelModule]);

LicenseManager.setLicenseKey(
	'LICENSE_KEY_BODY[version=v3][0102]_EXPIRY_NDg4NDc0ODcwNTExMw==094bf1c7852b11df1841f4d14457ae96'
);
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
