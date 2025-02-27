<img src="../../assets/OpenFin-Workspace-Starter.png" width="100%" alt="OpenFin Workspace Example Application -- Adding your application to Storefront" />

>**_:information_source: OpenFin Workspace:_** [OpenFin Workspace](https://www.openfin.co/workspace/) is a commercial product and this repo is for evaluation purposes. Use of the OpenFin Container and OpenFin Workspace components is only granted pursuant to a  licence from OpenFin. Please [**contact us**](https://www.openfin.co/workspace/poc/) if you would like to request a developer evaluation key or to discuss a production license.
OpenFin Workspace is currently **only supported on Windows**.

# Migrate from a previous version - From v4 to v5

With Workspace 5.0, OpenFin has extended the ability for Workspace customers to have  more granular control of their Workspace implementation. The **@openfin/workspace** module adds additional capabilities such as an improved ability to theme components. We have also introduced a new npm module **@openfin/workspace-platform** which lets you instantiate a workspace platform instead of the existing platform api. This lets you application launch OpenFin Browser Windows (with pages) under your own application instead of under Workspace giving you greater control and flexibility.

## What dependencies will I need?

You will need the following dependencies

```javascript
"dependencies": {
                    "@openfin/workspace": "^5.0.0",
                    "@openfin/workspace-platform": "^5.0.0"
                }
```

## What changes will I need to do if I want the simplest move from v4 to v5?

Using the register-with-store example as a guide:

* Update your npm dependencies as shown above
* Update your manifest
* Do a few api updates (show below)

### Manifest updates

You will need to do a few manifest updates as you are now responsible for launching views, snapshots and native apps (if you decide to support that).

* Update the runtime version in your manifest to at least: **23.96.67.7**
* Add the following setting to your platform configuration in your manifest:  **"preventQuitOnLastWindowClosed":true**
* Permissions: You need to add a **openUrlWithBrowser** permission (OpenFin Browser gives the option of opening a view using the system browser via right click). Optional: permissions for launching external processes (**launchExternalProcess**) if you wish to enable the launching of native apps and **downloadAsset** (if you want to version and deploy your native app through OpenFin). An example of the platform section of the register-with-store manifest is shown below:


```javascript
 "platform": {
    "uuid": "register-with-store",
    "icon": "http://localhost:8080/favicon.ico",
    "autoShow": false,
    "providerUrl": "http://localhost:8080/platform/provider.html",
    "preventQuitOnLastWindowClosed":true,
    "permissions": {
      "System": {
        "launchExternalProcess": true,
        "downloadAsset": true,
        "openUrlWithBrowser": {
            "enabled": true,
            "protocols": ["mailto"]
        }
      }
    },
    "defaultWindowOptions": {
      "permissions": {
        "System": {
            "openUrlWithBrowser": {
                "enabled": true,
                "protocols": ["mailto"]
            }
        }
      }
    }
  }
```


### Search related filters now need an id

File: [home.ts](../register-with-store/client/src/home.ts)

To make it easier to determine which filter was selected we have added an id so you don't have to rely on 'title' when determining what logic to apply.

So this:
```javascript
 let tagFilter: CLIFilter = {
      title: "Tags",
      type: CLIFilterOptionType.MultiSelect,
      options: [],
    };
```
becomes:
```javascript
 let tagFilter: CLIFilter = {
      id: "tags",
      title: "Tags",
      type: CLIFilterOptionType.MultiSelect,
      options: [],
    };
```
### Store registration now requires an icon (similar to Home registration)

File: [store.ts](../register-with-store/client/src/store.ts)

You now need to specify an icon with your registration. This icon will show in the store dropdown alongside your store name.

So this:
```javascript
return {
  id: settings.storefrontProvider.id,
  title: settings.storefrontProvider.title,
  getNavigation: getNavigation.bind(this),
  getLandingPage: getLandingPage.bind(this),
  getFooter: getFooter.bind(this),
  getApps,
  launchApp: launch,
};
```
becomes:
```javascript
return {
  id: settings.storefrontProvider.id,
  title: settings.storefrontProvider.title,
  icon: settings.storefrontProvider.icon,
  getNavigation: getNavigation.bind(this),
  getLandingPage: getLandingPage.bind(this),
  getFooter: getFooter.bind(this),
  getApps,
  launchApp: launch,
};
```

settings.storefrontProvider.icon is just a setting in the manifest.fin.json file of the sample that provides a string to an icon url.

### TS2305: Module '"@openfin/workspace"' has no exported member 'launchApp'

Launching an app is now a platform responsibility and has moved from @openfin/workspace to @openfin/workspace-platform.

This requires two changes:
  
File: [platform.ts](../register-with-store/client/src/platform.ts)

Instead of initializing an OpenFin Platform you will be initializing an OpenFin Workspace Platform.

So this:
```javascript
import { fin } from 'openfin-adapter/src/mock';

export async function init() {
    console.log("Initialising platform");
    await fin.Platform.init({
    });
} 
```
becomes:
```javascript
import { init as workspacePlatformInit, BrowserInitConfig } from '@openfin/workspace-platform';

export async function init() {
    console.log("Initialising platform");
    let browser: BrowserInitConfig = {};
    await workspacePlatformInit({
        browser
    });
} 
```
Once you know your app has initialized a workspace platform you can now safely reference it and use the launchApp function it provides. The platform.ts file in the sample shows an example of configuring the icons and window title but it was excluded from the snippet above to keep things simple.

File: [launch.ts](../register-with-store/client/src/launch.ts)
  
The following snippet replaces common code with **...** to highlight the changes.

So this:
```javascript
import { launchApp } from "@openfin/workspace";
...

export async function launch(appEntry: App) {
    console.log("Application launch requested: ", appEntry);
    if(appEntry.manifestType === "external") {
        ...
    } else {
        await launchApp(appEntry);
    }
    console.log("Finished application launch request");
}
```
becomes:
```javascript
import { getCurrentSync } from '@openfin/workspace-platform';
...

export async function launch(appEntry: App) {
    console.log("Application launch requested: ", appEntry);
    if(appEntry.manifestType === "external") {
        ...
    } else {
        let platform = getCurrentSync();
        await platform.launchApp({app: appEntry});
    }
    console.log("Finished application launch request");
}
```
### Hand Crafted Snapshots might fail to load correctly

In the store sample there is a [snapshot.json](../register-with-store/public/snapshot.json) file that includes two views showing OpenFin related documentation. The snapshot had the following:

```javascript
...

"workstacks": [
                {
                    "name": "Developer Docs"
                }
            ],
```
It shouldn't have that. It is an incomplete workstacks definition and this has now been renamed to pages. If you have this, remove it from your snapshot and it will load correctly.

## Do I still need Desktop Owner Settings (DOS)?

Desktop Owner Settings are still needed for two things:

* Pinning the version of workspace (we still provide the dos command so you can pin your workspace to version 5.0.0 to run the 5.0.0 sample). Without this the latest version of Workspace will be used.
* Specifying an icon - this is only used by the dock now as everything else is configured using APIs.

## How do I configure the logo and title for the browser?

This is now done when you initialize your workspace platform. You can specify Default Window Options for your Browser Windows. Example taken from the store example: [platform.ts](../register-with-store/client/src/platform.ts) 



```javascript
import { init as workspacePlatformInit, BrowserInitConfig } from '@openfin/workspace-platform';
import { getSettings } from "./settings";

export async function init() {
    console.log("Initialising platform");
    let settings = await getSettings();
    let browser: BrowserInitConfig = {};

    if(settings.browserProvider !== undefined) {
        browser.defaultWindowOptions = {
            icon: settings.browserProvider.windowOptions?.icon,
            workspacePlatform: {
                pages: null,
                title: settings.browserProvider.windowOptions?.title,
                favicon: settings.browserProvider.windowOptions?.icon
            }
        };
    }
    await workspacePlatformInit({
        browser
    });
} 
```
## Behaviour Changes

So now that your code is working what else has changed from a user perspective?

### Workspaces & Pages

Workspaces & Pages are no longer shown by default in the Home UI - We now provide APIs to be able to fetch saved pages and return them in the search results yourself. If you want to implement workspaces then you will need to do that through your workspace platform.

The save icon is present on your browser's window and by default it will save your page to indexdb. Version 5 provides APIs to get these pages. You can also specify a different storage location (e.g. you may decide you want to save them to a rest endpoint).

If you have existing pages from version 1-4 that you need to migrate please contact support@openfin.co who can either help or put you in touch with a solution engineer. Documentation on migration approaches will also be available on the OpenFin site.

### The share capability is gone

The ability to share content will come back but has been removed in order to plan an approach that suits the SDK first approach that we have in place.

Please contact support@openfin.co who can put you in contact with one of our Solution Engineers if you currently use this feature and want to talk about options.

### The Add New Page/View button (and right click context menu option) is hidden by default and needs to be configured

In versions 1-4 you would see a + button next to the page tab (the visibility of this button could be configured through DOS).

This button is now missing by default and needs to be configured. Configuring this option lets you specify the page that should be loaded into the Add New View view.

## New Features

The new features for this release will be covered is covered in our release notes but this section will give a brief overview.

### @openfin/workspace-platform

There is a new npm module available that continues to empower you as the workspace platform developer.

This module lets you initialize a workspace platform instead of a standard OpenFin platform and in doing so gives you the following:

* An API to launch OpenFin Browser windows and Pages (that fall under your platform and not OpenFin Workspace). 
* The ability to specify custom urls for the "Add Page" and "Add View" views.
* The ability to specify default window options so that you can customize the logo shown in the menu and taskbar as well as the Window Title without needing Desktop Owner Settings.
* An API for the retrieval and saving of Pages with a local store as default but with the option of overriding and providing your own logic for where pages should be saved and retrieved.
* The initial introduction of theming support.

### Specifying custom add (view/page) urls and custom title/icon

This is best done through default window options.

```javascript
import { init as workspacePlatformInit, BrowserInitConfig } from '@openfin/workspace-platform';

export async function init() {
    console.log("Initialising platform");
    let browser: BrowserInitConfig = {};
    
    browser.defaultWindowOptions = {
        icon: "http path to icon",
        workspacePlatform: {
            pages: null,
            title: "Title for windows",
            favicon: "http path to favicon",
            newTabUrl: "http url of page to load when someone selects adds a new view",
            newPageUrl: "http url of page to load when someone selects add a page"
        }
    };
    
    await workspacePlatformInit({
        browser
    });
} 
```
### Initial theme support

This is done when you initialize your platform:

```javascript
import { init as workspacePlatformInit, CustomThemes } from '@openfin/workspace-platform';

export async function init() {
    console.log("Initialising platform");
    const theme: CustomThemes = [
     {
              label: "Starter Theme",
              logoUrl: "http://localhost:8080/favicon.ico",
              palette: {
                  brandPrimary: "#504CFF",
                  brandSecondary: "#383A40",
                  backgroundPrimary: "#111214"
              }
          }
    ];
    await workspacePlatformInit({
        theme 
    });
} 
```

### The api to get, delete and save pages as well as launching a page or a view under your own platform

This is taken from the **browser.ts** file (assuming the platform has been initialized) in the how-to register-store as (well as home) examples.

File: [browser.ts](../register-with-store/client/src/browser.ts)

```javascript
import { getCurrentSync, Page } from '@openfin/workspace-platform';

export async function getPage(pageId:string) {
    let platform = getCurrentSync();
    return platform.Storage.getPage(pageId);
}

export async function getPages() {
    let platform = getCurrentSync();
    return platform.Storage.getPages();
}

export async function deletePage(pageId:string) {
    let platform = getCurrentSync();
    return platform.Storage.deletePage(pageId);
}

export async function launchPage(page:Page){
    let platform = getCurrentSync();
    return platform.Browser.createWindow({
        workspacePlatform: {
            pages: [page]
        }
    });
}

export async function launchView(view:OpenFin.PlatformViewCreationOptions | string , targetIdentity?: OpenFin.Identity){
    let platform = getCurrentSync();
    let viewOptions;
    if(typeof view === "string"){
        viewOptions = { "url": view};
    } else {
        viewOptions = view;
    }
    return platform.createView(viewOptions, targetIdentity);
}
```
### Focus - the ability to show/hide tabs to make it easier to focus on the content within a browser window

The following new feature has been added for your end users:

#### Tabs Showing - Click on the focus icon
<img src="workspace-hide-tabs.png" width="100%" alt="Ability to bring a view into focus by removing tabs" />

#### Tabs Hidden - Click on the focus icon again

<img src="workspace-show-tabs.png" width="100%" alt="Ability to bring a view out of focus by adding tabs" />

# Migrate from a previous version - From v1-v3 to v4

With Workspace 4.0, OpenFin has introduced the ability for Workspace customers to have  more granular control of their Workspace implementation. This control is enabled through Workspace by exposing an API that allows for Provider Apps to perform the function of a CLI Provider. This approach allows Provider Apps to register with the Home API and then perform such actions as:

Manage the application, view and workspaces content available in Workspace
Provide an async (aka “lazy”) Search
Provide in-memory auto-complete Search
Display icons for all registered Providers in the Home/Search UI 
Selecting a given CLI provider icon to show the results from that provider
Apply icons/ logos 

With the addition of the CLI Provider concept, OpenFin has deprecated Workspace Desktop Owner Setting overrides (customConfig options ) that pertain to apps and workspaces REST URLs in favor of this programmatic API approach.

## Behavior Changes
* The fins link or desktop icon to start workspace components is no longer supported. These must be started by a workspace platform or CLI provider. The system will now return an error if the fins link is used to start a workspace component.
* The “/W” entry point into the Workspaces directory has been removed. 
* The command buttons (Storefront, Notifications etc) no longer show on the Home UI. They are available as root commands by typing /. 
* You can no longer specify a Content Discovery Service (CDS). An example is available for how to mimic this functionality using the new APIs available in the howto.
* Home and Store are now enabled by default. However, they will not show unless a platform has registered with them.
* Workspace service is no longer supported. Any saved workspaces are only saved locally. Additional workspace related APIs will be released in upcoming releases.
* Unlike the v1 search API, you must select a CLI provider to see the results from that provider. However, if only one provider is registered then it is automatically selected.

## I used DesktopOwnerSettings to configure the logo. How do I do that now?

The logo setting is still supported for Desktop Owners and is used to specify the default logo for Home, Browser, the Dock and TaskBar Icons:

```javascript
"style": {
            "iconUrl": "https://yourserver/favicon-16x16.png"
         }
```
The new API approach will let you register your logo for Home without the need for DesktopOwnerSettings (configuring the logo for Browser etc will be available in a future release).

You can import Home from @openfin/workspace to register your application against Home. The icon setting lets you specify your logo.

```javascript
 const cliProvider: CLIProvider = {
    title: "title",
    id: "id",
    icon: "http://pathto/icon",
    onUserInput: onUserInput,
    onResultDispatch: onResultDispatch
  };

  await Home.register(cliProvider);
```
The how to samples provide a basic how to example ([how-to/register-with-home-basic](../register-with-home-basic/)) as well as a more complex example ([how-to/register-with-home](../register-with-home/)).

## I used DesktopOwnerSettings to configure the apps. How do I do that now?

Instead of configuring the apps endpoint through DesktopOwnerSettings:

```javascript
 "appDirectoryUrl": "https://yourserver/api/apps"
```
You can now import Home from @openfin/workspace to register your application against Home. The onUserInput and onResultDispatch setting lets you specify functions to determine what results to return based on user queries and the ability to respond to a user selection.

```javascript
 const cliProvider: CLIProvider = {
    title: "title",
    id: "id",
    icon: "http://pathto/icon",
    onUserInput: onUserInput,
    onResultDispatch: onResultDispatch
  };

  await Home.register(cliProvider);
``` 
  
We have an example ([how-to/register-with-home](../register-with-home/)) that shows how to register against Home, query a rest endpoint that matches the appDirectoryUrl format and map that to a collection of search results to display in Home.

## I used DesktopOwnerSettings to configure a share url. How do I do that now?
  
If you have never configured a share url in DesktopOwnerSettings then we recommend not starting that now as we are looking at having an API driven approach. If you already have this configured then it will continue to work in version 4 of OpenFin Workspace.

```javascript
 "shareUrl": "https://yourserver/api/share"
```

## I used DesktopOwnerSettings to configure a workspace url. How do I do that now?

This DesktopOwnerSetting is no longer supported in version 4. Please reach out to support or a Solutions Engineer to go over alternate approaches.

```javascript
 "workspacesUrl": "https://yourserver/api/workspaces"
```

## I used the @openfin/search-api npm module to populate Home with my apps. How do I do that now?

We have examples of using the search api to populate a list of applications in our version 3 branch. The example: [how-to/register-with-home](../register-with-home/) is an updated version of the version 3 <a href="https://github.com/built-on-openfin/workspace-starter/tree/workspace/v3.0.0/how-to/add-an-application-to-workspace-via-api" target="_blank">how-to/add-an-application-to-workspace-via-api</a> example. You will notice that both examples still follow the same approach. The main difference can be found by comparing search.ts against home.ts. You will see that @openfin/workspace is used instead of @openfin/search-api and that workspace.ts is also no longer needed.

## Will the views that I developed need changing with version 4?

No. Views will continue to behave in the same way.

## Will I lose my saved pages/workspaces?

No. Your pages and workspaces will still be listed in Home.

## I am still on version 3, have the examples gone?

No. There is a version 3 branch configured to help teams who are still on version 3: <a href="https://github.com/built-on-openfin/workspace-starter/tree/workspace/v3.0.0/" target="_blank">https://github.com/built-on-openfin/workspace-starter/tree/workspace/v3.0.0/</a>

## I am seeing a message when I try to launch OpenFin Workspace. How do I get Workspace running?

![](workspace-dialog.png)

Seeing this messages means you are running version 4+ of OpenFin Workspace. From version 4 OpenFin Workspace is an API driven experience and is launched from an application instead of directly. The how-to samples in this repo show you how to build an application that uses our openfin/workspace APIs.

It may be that your existing shortcuts point to the **latest** version of OpenFin Workspace instead of a specific version. To pin to an earlier version of OpenFin Workspace please look at the question below.

## I am not ready to move to OpenFin Workspace v4, how do I stick with version 3?

To stay on version v3 you can do the following:

##### Use Version 3 Examples 

Clone the <a href="https://github.com/built-on-openfin/workspace-starter/tree/workspace/v3.0.0/" target="_blank">version 3 branch</a> and run the npm run dos command on any of the how-to samples. You will need to have the local server running to serve the dos.json file.

##### Create your own dos file and point to it   

Create your own dos file:
```javascript
 {
  "desktopSettings": {
    "systemApps": {
      "workspace": {
        "version": "3.0.0"
      }
    }
  }
}
```
To configure Desktop Owner Settings you will need to be able to modify your registry settings. This can be done by scripts, applications or by hand. 

You need to add a registry key:

```javascript
Key   :     HKEY_CURRENT_USER\Software\OpenFin\RVM\Settings\DesktopOwnerSettings
Type  :     String
Value :     file:\\\C:\PATH\TO\YOUR\FOLDER\registry_dos_local.json
```

##### Adding/Updating the DesktopOwnerSetting by hand using RegEdit

To add/update this setting we are going to launch RegEdit from the command line (or you can launch it from the Windows Start Bar) by typing regedit and hitting enter.

You will be presented with RegEdit where you can expand the folders until you get to OpenFin\RVM\Settings.
If you see “DesktopOwnerSettings” it means that this has already been set by your organisation. Please check with your organisation’s desktop owner so that configuration can take place with their awareness.

![](registry.png)

If no DesktopOwnerSettings value exists then please add it by right clicking on OpenFin/RVM/Settings and adding a new string value:

![](registry-add-key.png)

You will provided an entry in the Settings Folder that you can rename to **DesktopOwnerSettings**. Double click on the new entry to set the value to a file path e.g.:

**file:\\\C:\PATH\TO\YOUR\FOLDER\registry_dos_local.json**

or a url (if you have a webserver):

**http://localhost:8080/registry_dos_local.json**

##### Once you have configured DesktopOwnerSettings

Once you have done either of the approaches above you need to:

* Use TaskManager, ProcessExplorer or the command line to close all OpenFin applications (so that the new DesktopOwnerSettings will get picked up).

* Launch OpenFin Workspace using the system apps fins link (this will pick up your version setting and update any desktop shortcuts): <a href="fins://system-apps/workspace" target="_blank">fins://system-apps/workspace</a>

You should now see version 3 of OpenFin Workspace.

### Read more about [working with Workspace](https://developers.openfin.co/of-docs/docs/overview-of-workspace). 
