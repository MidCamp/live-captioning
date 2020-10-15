
## What Is Infusion? ##

Infusion is a different kind of JavaScript framework. Our approach is to leave you in control—it's your interface, using your markup, your way. Infusion is accessible and very, very configurable.

Infusion includes:
* an application framework for developing flexible stuff with JavaScript and jQuery
* a collection of accessible UI components


## Where Can I See Infusion Components? ##

<http://fluidproject.org/infusion.html>

## How Do I Get Infusion? ##

* [Download a Release](https://github.com/fluid-project/infusion/releases)
* [Install from NPM](https://www.npmjs.com/package/infusion)
* [Fork on GitHub](https://github.com/fluid-project/infusion)


See [How Do I Create an Infusion Package?](#how-do-i-create-an-infusion-package), for details on creating complete or custom packages of Infusion.

## Where is the Infusion Documentation? ##

Infusion has comprehensive documentation at <http://docs.fluidproject.org/infusion>.

## Who Makes Infusion, and How Can I Help? ##

The Fluid community is an international group of designers, developers, and testers who focus on a common mission: improving the user experience and accessibility of the open web.

The best way to join the Fluid Community is to jump into any of our community activities. Visit our [website](http://fluidproject.org/) for links to our mailing lists, chat room, wiki, etc.

## Where is Infusion Used? ##

Infusion is the cornerstone of a number of Fluid's own projects dedicated to supporting inclusive design on the Web. You can see some of them featured on our [Projects page](http://fluidproject.org/projects.html). Infusion is also used in a variety of third-party applications, which are listed on the [Infusion Integrations](https://wiki.fluidproject.org/display/fluid/Infusion+Integrations) wiki page.

## How Do I Create an Infusion Package? ##

For simplicity and performance reasons, you may wish to create a concatenated, minified file. However, such a file is often difficult to read. To address this, source maps for the minified file are automatically generated to make debugging easier.

### Source Maps ###

Source maps are supported in all of the major browsers: [Chrome](https://developer.chrome.com/devtools/docs/javascript-debugging#source-maps), [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map),
[IE 11](https://msdn.microsoft.com/library/dn255007#source_maps), and Safari. To make use of them, enable source maps in your debugging environment, and ensure that the source maps are hosted adjacent to the file they are associated with.

#### Source Map Example ####

* From the command line, run `grunt` to create a build of Infusion
    * All Infusion packages come with a source map for the concatenated JavaScript file
* In the Infusion package, modify one of the demos to replace the individual javascript includes with a reference to "infusion-all.js"
* The "infusion-all.js" includes a reference to the "infusion-all.js.map" file, which is assumed to be hosted as its sibling
* Open the demo in a browser
* In the browser's debugger ensure that source maps are enabled
    *  In Firefox open the debugger
        *  In the debugger options, ensure that "Show Original Sources" is enabled
        * see [MDN: Use a source map](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map)
* In the debugger you should now be able to view and debug the individual JavaScript files as though they were included separately

### Dependencies ###

* [node.js](http://nodejs.org/)
* [grunt-cli](http://gruntjs.com/)

All other development dependencies will be installed by running the following from the project root:

```bash
npm install
```

### Package Types ###

#### Infusion All Build ####

Will include all of Infusion. The source files packaged along with the single concatenated js file will include all of the demos and unit tests. This is a good choice if you are trying to learn Infusion.

```bash
grunt
```

##### Custom Build #####

Will only include the modules you request, and all of their dependencies, minus any that are explicitly excluded. Unlike the "all" build, none of the demos or tests are included with a custom package.

```bash
grunt custom
```

### Build Options ###

#### --source ####

__value__: true (Boolean)
_the value can be omitted if --source is the last flag specified_

By default all packages are minified. This option will allow you to maintain the readable spacing and comments.

```bash
grunt --source=true

grunt custom --source=true
```

#### --include ####

__value__: "module(s)" (String)
_only available to custom packages_

The `--include` option takes in a comma-separated string of the [Modules](#modules) to be included in a custom package. If omitted, all modules will be included (demos and tests will not be included).

```bash
grunt custom --include="inlineEdit, uiOptions"
```

#### --exclude ####

__value__: "module(s)" (String)
_only available to custom packages_

The exclude option takes in a comma-separated string of the [Modules](#modules) to be excluded from a custom package. The `--exclude` option takes priority over `--include`.

```bash
grunt custom --exclude="jQuery"

grunt custom --include="framework" --exclude="jQuery"
```

#### --name ####

__value__: "custom suffix" (String)
_only available to custom packages_

By default, custom packages are given a name with the form _infusion-custom-<version>.zip_ and the concatenated js file is called _infusion-custom.js_. By supplying the `--name` option, you can replace "custom" with any other valid string you like.

```bash
# this produces infusion-myPackage.js
grunt custom --name="myPackage"
```
### Modules ###

#### Framework Modules ####

* enhancement
* framework
* preferences
* renderer

#### Component Modules ####

* inlineEdit
* overviewPanel
* pager
* progress
* reorderer
* slidingPanel
* tableOfContents
* tabs
* textfieldSlider
* textToSpeech
* tooltip
* uiOptions
* undo
* uploader

#### External Libraries ####

* fastXmlPull
* jQuery
* jQueryUI
* jQueryScrollToPlugin
* jQueryTouchPunchPlugin
* normalize

All of these libraries are already bundled within the Infusion image.

## How Do I Run Tests? ##

There are two options available for running tests. The first option involves using browsers installed on your computer and the second uses browsers available in a VM.

### Run Tests Using Browsers Installed On Your Computer ###

Using this option requires the installation of [Testem](https://github.com/testem/testem/#installation) and then running ``testem ci --file tests/testem.json`` in this directory. Any browsers that Testem finds on your platform will be launched sequentially with each browser running the full Infusion test suite. The results will be returned in your terminal in the [TAP](https://testanything.org/) format. You can use the ``testem launchers`` command to get a list of available browsers.

**Note:** Any browser launched will need to be focused and remain the active window. Some of the tests require focus, and will report errors if they are not focused.

### Run Tests Using Browsers Installed In a VM ###

A [Fedora VM](https://github.com/idi-ops/packer-fedora) can be automatically created using tools provided by the [Prosperity4All Quality Infrastructure](https://github.com/GPII/qi-development-environments/). After meeting the [QI development VM requirements](https://github.com/GPII/qi-development-environments/#requirements) the ``vagrant up`` command can be used to launch a VM which will contain Testem and several browsers. Typing ``grunt tests`` will run the Infusion tests in the VM and the results will be displayed in your terminal.

When this VM is first created Chrome and Firefox will be upgraded to the latest versions available in the Fedora and Google package repositories. The ``vagrant provision`` command can be used at a later time to trigger the browser upgrade and general VM provisioning mechanism.

The benefits of using a VM include the following:

* Does not require testem to be installed on the host machine
* Allows other applications on the host machine to have focus while the tests are run

## Developing with the Preferences Framework ##

Infusion is in the process of switching to use [Stylus](http://learnboost.github.io/stylus/) for CSS pre-processing.
CSS files for the Preferences Framework have been re-written in Stylus. Only Stylus files are pushed into the github repository.

For developing the Preferences Framework, run the following from the project root to compile Stylus files to CSS:

```bash
grunt buildStylus
```

A `watch` task using [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) is also supplied to ease Stylus development. This task launches a process that watches all Stylus files in the `src` directory and recompiles them when they are changed. This task can be run using the following command:

```bash
grunt watch:buildStylus
```
