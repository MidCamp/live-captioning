/*
Copyright 2011-2016 OCAD University
Copyright 2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

var fluid_2_0_0 = fluid_2_0_0 || {};

(function ($, fluid) {

    "use strict";

    /**
     * A configurable component to allow users to load multiple resources via AJAX requests.
     * The resources can be localised by means of options `locale`, `defaultLocale`. Once all
     * resources are loaded, the event `onResourceLoaded` will be fired, which can be used
     * to time the creation of components dependent on the resources.
     *
     * @param {Object} options
     */

    fluid.defaults("fluid.resourceLoader", {
        gradeNames: ["fluid.component"],
        listeners: {
            "onCreate.loadResources": {
                listener: "fluid.resourceLoader.loadResources",
                args: ["{that}", {expander: {func: "{that}.resolveResources"}}]
            }
        },
        defaultLocale: null,
        locale: null,
        terms: {},  // Must be supplied by integrators
        resources: {},  // Must be supplied by integrators
        resourceOptions: {},
        // Unsupported, non-API option
        invokers: {
            transformURL: {
                funcName: "fluid.stringTemplate",
                args: ["{arguments}.0", "{that}.options.terms"]
            },
            resolveResources: {
                funcName: "fluid.resourceLoader.resolveResources",
                args: "{that}"
            }
        },
        events: {
            onResourcesLoaded: null
        }
    });

    fluid.resourceLoader.resolveResources = function (that) {
        var mapped = fluid.transform(that.options.resources, that.transformURL);

        return fluid.transform(mapped, function (url) {
            var resourceSpec = {url: url, forceCache: true, options: that.options.resourceOptions};
            return $.extend(resourceSpec, fluid.filterKeys(that.options, ["defaultLocale", "locale"]));
        });
    };

    fluid.resourceLoader.loadResources = function (that, resources) {
        fluid.fetchResources(resources, function () {
            that.resources = resources;
            that.events.onResourcesLoaded.fire(resources);
        });
    };

})(jQuery, fluid_2_0_0);
