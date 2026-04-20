# Release Notes for Fluid Infusion 2.0.0 #

[Fluid Project](http://fluidproject.org)

[Infusion Documentation](https://github.com/fluid-project/infusion-docs)

## What's New in 2.0.0? ##

See [API Changes from 1.5 to 2.0](http://docs.fluidproject.org/infusion/development/APIChangesFrom1_5To2_0.html) and [Deprecations in 1.5](http://docs.fluidproject.org/infusion/development/DeprecationsIn1_5.html) on the [Infusion Documentation](https://github.com/fluid-project/infusion-docs) site.

For a complete list of Fixes and Improvements see the [Version 2.0](https://issues.fluidproject.org/projects/FLUID/versions/10041) summary in the [JIRA](https://issues.fluidproject.org) issue tracker.

**Note:** Infusion 1.9 was not officially released, but is available as an official branch. It is is available on GitHub at [Infusion 1.9.x](https://github.com/fluid-project/infusion/tree/1.9.x). For a complete list of Fixes and Improvements see the [Version 1.9](https://issues.fluidproject.org/projects/FLUID/versions/10520) summary in the [JIRA](https://issues.fluidproject.org) issue tracker.

### New Features ###

* Constraint-based priorities, supported by `listeners`, `modelListeners`, `modelRelay`, `distributeOptions`, `contextAwareness`, and `components`. This allows the specific order of those items to be configured. (See: [Priorities](http://docs.fluidproject.org/infusion/development/Priorities.html))
* Context Awareness - and things it relies on:
  * Global Instantiator
    * Every Infusion component, regardless of how it is instantiated, ends up in a single-rooted tree of components
    * This enables use of modern IoC features such as model relay and declarative event binding
    * Enables use of the root distributeOptions context "/"
    * Enables the removal of "demands blocks"
    * Useful debugging tip: Watch `fluid.globalInstantiator` in your JS debugging tools to see the structure of your application and its tree.
* `fluid.notImplemented` function for implementing abstract grades
* [Lazy loading for UI Options](http://docs.fluidproject.org/infusion/development/UserInterfaceOptionsAPI.html#lazyload) and instructions for how to use the Preferences Framework with a [zero initial load time](http://docs.fluidproject.org/infusion/development/tutorial-prefsFrameworkMinimalFootprint/MinimalFootprint.html).
  * This should assist in improving performance when using the Preferences Framework, particularly for resource intensive sites and applications
* Much faster invokers and boiled listeners (c. 60x faster)
* Support for using Infusion with npm for both Node.js and web-based projects.
  * Provides a variety of prebuilt versions of Infusion in the module's `dist` directory.
* Source Maps are generated for the concatenated JavaScript files
* View oriented IoC debugging tools
  * Including FluidViewDebugging.js on the page of any Infusion application gives you access to the _IoC View Inspector_. Click on the small cogwheel icon at the bottom right of the page to open a panel which shows the details of the view components and their grades, that are attached to DOM nodes in the browser pane. This interface works similarly to the _DOM Inspector_ familiar from modern web browsers, but is an experimental implementation with an engineer-level UI.


### Removal of Deprecated Features ###

* Manual lifecycle points finalInit, postInit, etc.
* Obsolete syntax for arguments, options, etc.
* `"autoInit"` grade
* Static and dynamic environments, replaced by Global Instantiator
* The old model component hierarchy and "old ChangeApplier" implementation
* `fluid.demands`
* No more distinction between fast and dynamic invokers
* Model Relay specific component grades have been removed, model relay now works with any model grade.

## Obtaining Infusion ##

* [Fork on GitHub](https://github.com/fluid-project/infusion)
* [Download a Build](https://github.com/fluid-project/infusion/releases)
* [NPM](https://www.npmjs.com/package/infusion)

You can create your own custom build of Infusion using the [grunt build script](README.md#how-do-i-create-an-infusion-package).

## Demos ##

Infusion ships with demos of all of the components in action. You can find them in the _**demos**_ folder in the release bundle or on our [build site](http://build.fluidproject.org/).

When running the demos on your local machine, a web server is recommended. Several of the demos make use of AJAX calls; which typically are not allowed by
the browser when run from the local file system.

## License ##

Fluid Infusion is licensed under both the ECL 2.0 and new BSD licenses.

More information is available in our [wiki](http://wiki.fluidproject.org/display/fluid/Fluid+Licensing).
## Third Party Software in Infusion ##

This is a list of publicly available software that is redistributed with Fluid Infusion,
categorized by license:

### Apache 2.0 ###

* [`fluid.load.scripts` is based on Jake Archibald's script loading example](http://www.html5rocks.com/en/tutorials/speed/script-loading/#toc-dom-rescue)
* [Open Sans Light font](http://www.google.com/fonts/specimen/Open+Sans)

### MIT License ###

* [Buzz v1.1.0](http://buzz.jaysalvat.com)
* [Foundation v6.2.3](http://foundation.zurb.com/index.html)
* [HTML5 Boilerplate v4.3](http://html5boilerplate.com/)
* [html5shiv v3.7.2](https://code.google.com/p/html5shiv/)
* [jQuery v3.1.0](http://jquery.com/)
* [jQuery Mockjax v2.2.1](https://github.com/jakerella/jquery-mockjax)
* [jQuery QUnit v1.12.0](http://qunitjs.com)
* [jQuery QUnit Composite v1.0.1](https://github.com/jquery/qunit-composite)
* [jQuery scrollTo v1.4.2](http://flesler.blogspot.com/2007/10/jqueryscrollto.html)
* [jQuery Touch Punch v0.2.2](http://touchpunch.furf.com/)
* [jQuery UI (Core; Interactions: draggable, resizable; Widgets: button, checkboxradio, controlgroup, dialog, mouse, slider, tabs, and tooltip) v1.12.1](http://ui.jquery.com/)
* [jquery.selectbox v0.5 (forked)](https://github.com/fluid-project/jquery.selectbox)
* [jquery.simulate](https://github.com/eduardolundgren/jquery-simulate)
* [Micro Clearfix](http://nicolasgallagher.com/micro-clearfix-hack/)
* [Normalize v4.1.1](https://necolas.github.io/normalize.css/)

### zlib/libpng License ###

* [fastXmlPull is based on XML for Script's Fast Pull Parser v3.1](http://wiki.fluidproject.org/display/fluid/Licensing+for+fastXmlPull.js)

## Documentation ##

Documentation and tutorials can found on the [Infusion Documentation](http://docs.fluidproject.org/infusion/development/) site.

## Supported Browsers ##

Infusion 2.0 was tested with the following browsers:

* Chrome current (version 54)
* Firefox current (versions 49-50)
* Internet Explorer (version 11)
* Microsoft Edge (version 38)
* Safari (version 10)

Additional testing for mobile devices was performed with the following:

* Chrome (Android 6.0.1)
* Safari (iOS 10.1.1)

For more information see the [Fluid Infusion browser support](https://wiki.fluidproject.org/display/fluid/Prior+Browser+Support) wiki page.

### Testing Configurations ####

<table>
    <summary>Testing Configurations</summary>
    <thead>
        <tr>
            <th rowspan="2">Testing Task</th>
            <th colspan="5">Desktop Browser</th>
            <th colspan="2">Mobile Browser</th>
        </tr>
        <tr>
            <th>Chrome</th>
            <th>Firefox</th>
            <th>IE 11</th>
            <th>MS Edge</th>
            <th>Safari</th>
            <th>Chrome for Android</th>
            <th>Safari iOS</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>Run All Unit Tests</th>
            <td>Chrome 54 (macOS 10.12)</td>
            <td>Firefox 49 (macOS 10.12)</td>
            <td>IE 11 (Win 10)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>Chrome 54 (Android 6.0.1 & 7.0.0)</td>
            <td>Safari (iOS 10.1.1)</td>
        </tr>
        <tr>
            <th>Smoke Tests - All Manual Tests</th>
            <td>Chrome 54 (macOS 10.11.6)</td>
            <td>Firefox 50 (macOS 10.12.1)</td>
            <td>IE 11 (Win 8.1)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12.1)</td>
            <td>Chrome 54 (Android 6.0.1)</td>
            <td>Safari (iOS 10.1.1)</td>
        </tr>
        <tr>
            <th>Smoke Tests - All Demos</th>
            <td>Chrome 54 (macOS 10.12.1)</td>
            <td>Firefox 50 (macOS 10.12.1)</td>
            <td>IE 11 (Win 8.1)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12.1)</td>
            <td>Chrome 54 (Android 6.0.1)</td>
            <td>Safari (iOS 10.1.1)</td>
        </tr>
        <tr>
            <th>Smoke Tests - All Examples</th>
            <td>Chrome 54 (macOS 10.12.1)</td>
            <td>Firefox 50 (macOS 10.12.1)</td>
            <td>IE 11 (Win 8.1)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12.1)</td>
            <td>Chrome 54 (Android 6.0.1)</td>
            <td>Safari (iOS 10.1.1)</td>
        </tr>
        <tr>
            <th>Inline Edit QA Test Plan - Simple Text</th>
            <td>Chrome 54 (macOS 10.10)</td>
            <td>Firefox 49 (openSUSE Linux 42.1)</td>
            <td>IE 11 (Win 8.1)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Keyboard Accessibility QA Test Plan</th>
            <td>Chrome 54 (Win 10)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 8.1)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Pager QA Test Plan</th>
            <td>Chrome 54 (Win 10)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Progress QA Test Plan</th>
            <td>Chrome 54 (macOS 10.11.6)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Reorderer QA Test Plan - Image Reorderer</th>
            <td>Chrome 54 (Win 10)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Reorderer QA Test Plan - Layout Reorderer</th>
            <td>Chrome 54 (macOS 10.11.6)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Reorderer QA Test Plan - List Reorderer</th>
            <td>Chrome 54 (macOS 10.11.6)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Reorderer QA Test Plan - Grid Reorderer</th>
            <td>Chrome 54 (macOS 10.11.6)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Preferences Framework QA Test Plan</th>
            <td>Chrome 54 (Win 10)</td>
            <td>Firefox 49.0.2 (macOS 10.12)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>UI Options QA Test Plan - Separated Panel</th>
            <td>Chrome 54 (Win 10)</td>
            <td>Firefox 49.0.2 (Win 10)</td>
            <td>IE 11 (Win 7)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Uploader QA Test Plan</th>
            <td>Chrome 54 (macOS 10.12.1)</td>
            <td>Firefox 49.0.2 (macOS 10.12.1)</td>
            <td>IE 11 (Win 10)</td>
            <td>MS Edge 38 (Win 10)</td>
            <td>Safari 10 (macOS 10.12.1)</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
    </tbody>
</table>

## Known Issues ##

The Fluid Project uses a [JIRA](http://issues.fluidproject.org) website to track bugs. Some of the known issues in this release are described here:

### Framework ###

* [FLUID-5912: "{arguments}" IoC references in dynamicComponents model block are incorrectly interpreted as implicit model relays](https://issues.fluidproject.org/browse/FLUID-5912)
* [FLUID-5546: Framework fails to deregister listeners to events which are injected from other components](https://issues.fluidproject.org/browse/FLUID-5546)
* [FLUID-5519: Timing of "initial transaction" in new model relay system is problematic](https://issues.fluidproject.org/browse/FLUID-5519)

### Inline Edit ###

* [FLUID-5392: Two clicks required to edit an empty inline edit field](https://issues.fluidproject.org/browse/FLUID-5392)
* [FLUID-1600: Pressing the "Tab" key to exit edit mode places focus on the wrong item](http://issues.fluidproject.org/browse/FLUID-1600)

### Layout Reorderer ###
* [FLUID-3864: Layout Reorderer failed to move portlets back to the first column in three-columns view with keyboard](http://issues.fluidproject.org/browse/FLUID-3864)
* [FLUID-3089: If columns become stacked, can't drag item into lower column](http://issues.fluidproject.org/browse/FLUID-3089)

### Pager ###

[FLUID-6081: VoiceOver on Pager doesn't announce the page number when the focus is on a page link](https://issues.fluidproject.org/browse/FLUID-6081)

### Reorderer ###

* [FLUID-6013: The Grid Reorderer and Image Reorderer are missing ARIA role=row containers](https://issues.fluidproject.org/browse/FLUID-6013)
* [FLUID-5870: Reorderer demo failures on IE 11](https://issues.fluidproject.org/browse/FLUID-5870)
* [FLUID-44737: Focus styling persists after moving focus from Reorderer](https://issues.fluidproject.org/browse/FLUID-4437)
* [FLUID-3925: With no wrapping on, the keyboard movement keystrokes are captured by the browser where a wrap would have occurred.](http://issues.fluidproject.org/browse/FLUID-3925)

### UI Options / Preferences Framework ###

* [FLUID-5928: Schema and Grade version save preferences to different values](https://issues.fluidproject.org/browse/FLUID-5928)
* [FLUID-5372: Increasing font size does not increase width of UIO panel](https://issues.fluidproject.org/browse/FLUID-5372)
* [FLUID-5223: If there's exactly one text field in the prefs editor, pressing enter on most inputs causes the form to submit](http://issues.fluidproject.org/browse/FLUID-5223)
* [FLUID-5218: Prefs editor requires iFrame template to be in the same place as panel templates; it probably shouldn't](http://issues.fluidproject.org/browse/FLUID-5218)
* [FLUID-5066: UIO Integrators shouldn't have to edit Infusion's copy of html templates to add panels, css](http://issues.fluidproject.org/browse/FLUID-5066)
* [FLUID-4491: Line spacing doesn't affect elements that have a line-height style set](http://issues.fluidproject.org/browse/FLUID-4491)
* [FLUID-4394: Separated Panel UI Options' iFrame HTML page (SeparatedPanelFrame.html) doesn't play nice with a concatenated build of Infusion](http://issues.fluidproject.org/browse/FLUID-4394)

### Undo ###

* [FLUID-3697: Undo hard-codes selector classes instead of using user-configured values](http://issues.fluidproject.org/browse/FLUID-3697)

### Uploader ###

* [FLUID-6079: Uploader error, when chosen files are too large, is not read by screenreader](https://issues.fluidproject.org/browse/FLUID-6079)
* [FLUID-6065: The focus remains on the "Browse Files" button with 2 keyboard tabbings in IE 11 and IE Edge](https://issues.fluidproject.org/browse/FLUID-6065)
* [FLUID-6045: The table header scrolls out of view as the file queue is scrolled](https://issues.fluidproject.org/browse/FLUID-6045)
* [FLUID-5737: Uploading size is higher than total size](https://issues.fluidproject.org/browse/FLUID-5737)
* [FLUID-4726: Cannot change uploader's button text through the string options.](https://issues.fluidproject.org/browse/FLUID-4726)
