/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 Lucendo Development Ltd.
Copyright 2010-2014 OCAD University
Copyright 2012-2014 Raising the Floor - US
Copyright 2014-2016 Raising the Floor - International

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

var fluid_2_0_0 = fluid_2_0_0 || {};

(function ($, fluid) {
    "use strict";

    /** NOTE: The contents of this file are by default NOT PART OF THE PUBLIC FLUID API unless explicitly annotated before the function **/

    /** MODEL ACCESSOR ENGINE **/

    /** Standard strategies for resolving path segments **/

    fluid.model.makeEnvironmentStrategy = function (environment) {
        return function (root, segment, index) {
            return index === 0 && environment[segment] ?
                environment[segment] : undefined;
        };
    };

    fluid.model.defaultCreatorStrategy = function (root, segment) {
        if (root[segment] === undefined) {
            root[segment] = {};
            return root[segment];
        }
    };

    fluid.model.defaultFetchStrategy = function (root, segment) {
        return root[segment];
    };

    fluid.model.funcResolverStrategy = function (root, segment) {
        if (root.resolvePathSegment) {
            return root.resolvePathSegment(segment);
        }
    };

    fluid.model.traverseWithStrategy = function (root, segs, initPos, config, uncess) {
        var strategies = config.strategies;
        var limit = segs.length - uncess;
        for (var i = initPos; i < limit; ++i) {
            if (!root) {
                return root;
            }
            var accepted;
            for (var j = 0; j < strategies.length; ++j) {
                accepted = strategies[j](root, segs[i], i + 1, segs);
                if (accepted !== undefined) {
                    break; // May now short-circuit with stateless strategies
                }
            }
            if (accepted === fluid.NO_VALUE) {
                accepted = undefined;
            }
            root = accepted;
        }
        return root;
    };

    /** Returns both the value and the path of the value held at the supplied EL path **/
    fluid.model.getValueAndSegments = function (root, EL, config, initSegs) {
        return fluid.model.accessWithStrategy(root, EL, fluid.NO_VALUE, config, initSegs, true);
    };

    // Very lightweight remnant of trundler, only used in resolvers
    fluid.model.makeTrundler = function (config) {
        return function (valueSeg, EL) {
            return fluid.model.getValueAndSegments(valueSeg.root, EL, config, valueSeg.segs);
        };
    };

    fluid.model.getWithStrategy = function (root, EL, config, initSegs) {
        return fluid.model.accessWithStrategy(root, EL, fluid.NO_VALUE, config, initSegs);
    };

    fluid.model.setWithStrategy = function (root, EL, newValue, config, initSegs) {
        fluid.model.accessWithStrategy(root, EL, newValue, config, initSegs);
    };

    fluid.model.accessWithStrategy = function (root, EL, newValue, config, initSegs, returnSegs) {
        // This function is written in this unfortunate style largely for efficiency reasons. In many cases
        // it should be capable of running with 0 allocations (EL is preparsed, initSegs is empty)
        if (!fluid.isPrimitive(EL) && !fluid.isArrayable(EL)) {
            var key = EL.type || "default";
            var resolver = config.resolvers[key];
            if (!resolver) {
                fluid.fail("Unable to find resolver of type " + key);
            }
            var trundler = fluid.model.makeTrundler(config); // very lightweight trundler for resolvers
            var valueSeg = {root: root, segs: initSegs};
            valueSeg = resolver(valueSeg, EL, trundler);
            if (EL.path && valueSeg) { // every resolver supports this piece of output resolution
                valueSeg = trundler(valueSeg, EL.path);
            }
            return returnSegs ? valueSeg : (valueSeg ? valueSeg.root : undefined);
        }
        else {
            return fluid.model.accessImpl(root, EL, newValue, config, initSegs, returnSegs, fluid.model.traverseWithStrategy);
        }
    };

    // Implementation notes: The EL path manipulation utilities here are equivalents of the simpler ones
    // that are provided in Fluid.js and elsewhere - they apply escaping rules to parse characters .
    // as \. and \ as \\ - allowing us to process member names containing periods. These versions are mostly
    // in use within model machinery, whereas the cheaper versions based on String.split(".") are mostly used
    // within the IoC machinery.
    // Performance testing in early 2015 suggests that modern browsers now allow these to execute slightly faster
    // than the equivalent machinery written using complex regexps - therefore they will continue to be maintained
    // here. However, there is still a significant performance gap with respect to the performance of String.split(".")
    // especially on Chrome, so we will continue to insist that component member names do not contain a "." character
    // for the time being.
    // See http://jsperf.com/parsing-escaped-el for some experiments

    fluid.registerNamespace("fluid.pathUtil");

    fluid.pathUtil.getPathSegmentImpl = function (accept, path, i) {
        var segment = null;
        if (accept) {
            segment = "";
        }
        var escaped = false;
        var limit = path.length;
        for (; i < limit; ++i) {
            var c = path.charAt(i);
            if (!escaped) {
                if (c === ".") {
                    break;
                }
                else if (c === "\\") {
                    escaped = true;
                }
                else if (segment !== null) {
                    segment += c;
                }
            }
            else {
                escaped = false;
                if (segment !== null) {
                    segment += c;
                }
            }
        }
        if (segment !== null) {
            accept[0] = segment;
        }
        return i;
    };

    var globalAccept = []; // TODO: reentrancy risk here. This holder is here to allow parseEL to make two returns without an allocation.

    /** A version of fluid.model.parseEL that apples escaping rules - this allows path segments
     * to contain period characters . - characters "\" and "}" will also be escaped. WARNING -
     * this current implementation is EXTREMELY slow compared to fluid.model.parseEL and should
     * not be used in performance-sensitive applications */
    // supported, PUBLIC API function
    fluid.pathUtil.parseEL = function (path) {
        var togo = [];
        var index = 0;
        var limit = path.length;
        while (index < limit) {
            var firstdot = fluid.pathUtil.getPathSegmentImpl(globalAccept, path, index);
            togo.push(globalAccept[0]);
            index = firstdot + 1;
        }
        return togo;
    };

    // supported, PUBLIC API function
    fluid.pathUtil.composeSegment = function (prefix, toappend) {
        toappend = toappend.toString();
        for (var i = 0; i < toappend.length; ++i) {
            var c = toappend.charAt(i);
            if (c === "." || c === "\\" || c === "}") {
                prefix += "\\";
            }
            prefix += c;
        }
        return prefix;
    };

    /** Escapes a single path segment by replacing any character ".", "\" or "}" with
     * itself prepended by \
     */
    // supported, PUBLIC API function
    fluid.pathUtil.escapeSegment = function (segment) {
        return fluid.pathUtil.composeSegment("", segment);
    };

    /**
     * Compose a prefix and suffix EL path, where the prefix is already escaped.
     * Prefix may be empty, but not null. The suffix will become escaped.
     */
    // supported, PUBLIC API function
    fluid.pathUtil.composePath = function (prefix, suffix) {
        if (prefix.length !== 0) {
            prefix += ".";
        }
        return fluid.pathUtil.composeSegment(prefix, suffix);
    };

    /**
     * Compose a set of path segments supplied as arguments into an escaped EL expression. Escaped version
     * of fluid.model.composeSegments
     */

    // supported, PUBLIC API function
    fluid.pathUtil.composeSegments = function () {
        var path = "";
        for (var i = 0; i < arguments.length; ++i) {
            path = fluid.pathUtil.composePath(path, arguments[i]);
        }
        return path;
    };

    /** Helpful utility for use in resolvers - matches a path which has already been
     * parsed into segments **/

    fluid.pathUtil.matchSegments = function (toMatch, segs, start, end) {
        if (end - start !== toMatch.length) {
            return false;
        }
        for (var i = start; i < end; ++i) {
            if (segs[i] !== toMatch[i - start]) {
                return false;
            }
        }
        return true;
    };

    fluid.model.unescapedParser = {
        parse: fluid.model.parseEL,
        compose: fluid.model.composeSegments
    };

    // supported, PUBLIC API record
    fluid.model.defaultGetConfig = {
        parser: fluid.model.unescapedParser,
        strategies: [fluid.model.funcResolverStrategy, fluid.model.defaultFetchStrategy]
    };

    // supported, PUBLIC API record
    fluid.model.defaultSetConfig = {
        parser: fluid.model.unescapedParser,
        strategies: [fluid.model.funcResolverStrategy, fluid.model.defaultFetchStrategy, fluid.model.defaultCreatorStrategy]
    };

    fluid.model.escapedParser = {
        parse: fluid.pathUtil.parseEL,
        compose: fluid.pathUtil.composeSegments
    };

    // supported, PUBLIC API record
    fluid.model.escapedGetConfig = {
        parser: fluid.model.escapedParser,
        strategies: [fluid.model.defaultFetchStrategy]
    };

    // supported, PUBLIC API record
    fluid.model.escapedSetConfig = {
        parser: fluid.model.escapedParser,
        strategies: [fluid.model.defaultFetchStrategy, fluid.model.defaultCreatorStrategy]
    };

    /** MODEL COMPONENT HIERARCHY AND RELAY SYSTEM **/

    fluid.initRelayModel = function (that) {
        fluid.deenlistModelComponent(that);
        return that.model;
    };

    // TODO: This utility compensates for our lack of control over "wave of explosions" initialisation - we may
    // catch a model when it is apparently "completely initialised" and that's the best we can do, since we have
    // missed its own initial transaction

    fluid.isModelComplete = function (that) {
        return "model" in that && that.model !== fluid.inEvaluationMarker;
    };

    // Enlist this model component as part of the "initial transaction" wave - note that "special transaction" init
    // is indexed by component, not by applier, and has special record type (complete + initModel), not transaction
    fluid.enlistModelComponent = function (that) {
        var instantiator = fluid.getInstantiator(that);
        var enlist = instantiator.modelTransactions.init[that.id];
        if (!enlist) {
            enlist = {
                that: that,
                applier: fluid.getForComponent(that, "applier"), // required for FLUID-5504 even though currently unused
                complete: fluid.isModelComplete(that)
            };
            instantiator.modelTransactions.init[that.id] = enlist;
        }
        return enlist;
    };

    fluid.clearTransactions = function () {
        var instantiator = fluid.globalInstantiator;
        fluid.clear(instantiator.modelTransactions);
        instantiator.modelTransactions.init = {};
    };

    fluid.failureEvent.addListener(fluid.clearTransactions, "clearTransactions", "before:fail");

    // Utility to coordinate with our crude "oscillation prevention system" which limits each link to 2 updates (presumably
    // in opposite directions). In the case of the initial transaction, we need to reset the count given that genuine
    // changes are arising in the system with each new enlisted model. TODO: if we ever get users operating their own
    // transactions, think of a way to incorporate this into that workflow
    fluid.clearLinkCounts = function (transRec, relaysAlso) {
        // TODO: Separate this record out into different types of records (relays are already in their own area)
        fluid.each(transRec, function (value, key) {
            if (typeof(value) === "number") {
                transRec[key] = 0;
            } else if (relaysAlso && value.options && typeof(value.relayCount) === "number") {
                value.relayCount = 0;
            }
        });
    };

    fluid.sortCompleteLast = function (reca, recb) {
        return (reca.completeOnInit ? 1 : 0) - (recb.completeOnInit ? 1 : 0);
    };

    // Operate all coordinated transactions by bringing models to their respective initial values, and then commit them all
    fluid.operateInitialTransaction = function (that, mrec) {
        var transId = fluid.allocateGuid();
        var transRec = fluid.getModelTransactionRec(that, transId);
        var transac;
        var transacs = fluid.transform(mrec, function (recel) {
            transac = recel.that.applier.initiate(null, "init", transId);
            transRec[recel.that.applier.applierId] = {transaction: transac};
            return transac;
        });
        // TODO: This sort has very little effect in any current test (can be replaced by no-op - see FLUID-5339) - but
        // at least can't be performed in reverse order ("FLUID-3674 event coordination test" will fail) - need more cases
        var recs = fluid.values(mrec).sort(fluid.sortCompleteLast);
        fluid.each(recs, function (recel) {
            var that = recel.that;
            var transac = transacs[that.id];
            if (recel.completeOnInit) {
                fluid.initModelEvent(that, that.applier, transac, that.applier.listeners.sortedListeners);
            } else {
                fluid.each(recel.initModels, function (initModel) {
                    transac.fireChangeRequest({type: "ADD", segs: [], value: initModel});
                    fluid.clearLinkCounts(transRec, true);
                });
            }
            var shadow = fluid.shadowForComponent(that);
            if (shadow) { // Fix for FLUID-5869 - the component may have been destroyed during its own init transaction
                shadow.modelComplete = true; // technically this is a little early, but this flag is only read in fluid.connectModelRelay
            }
        });

        transac.commit(); // committing one representative transaction will commit them all
    };

    // This modelComponent has now concluded initialisation - commit its initialisation transaction if it is the last such in the wave
    fluid.deenlistModelComponent = function (that) {
        var instantiator = fluid.getInstantiator(that);
        var mrec = instantiator.modelTransactions.init;
        if (!mrec[that.id]) { // avoid double evaluation through currently hacked "members" implementation
            return;
        }
        that.model = undefined; // Abuse of the ginger system - in fact it is "currently in evaluation" - we need to return a proper initial model value even if no init occurred yet
        mrec[that.id].complete = true; // flag means - "complete as in ready to participate in this transaction"
        var incomplete = fluid.find_if(mrec, function (recel) {
            return recel.complete !== true;
        });
        if (!incomplete) {
            fluid.operateInitialTransaction(that, mrec);
            // NB: Don't call fluid.concludeTransaction since "init" is not a standard record - this occurs in commitRelays for the corresponding genuine record as usual
            instantiator.modelTransactions.init = {};
        }
    };

    fluid.parseModelReference = function (that, ref) {
        var parsed = fluid.parseContextReference(ref);
        parsed.segs = that.applier.parseEL(parsed.path);
        return parsed;
    };

    /** Given a string which may represent a reference into a model, parses it into a structure holding the coordinates for resolving the reference. It specially
     * detects "references into model material" by looking for the first path segment in the path reference which holds the value "model". Some of its workflow is bypassed
     * in the special case of a reference representing an implicit model relay. In this case, ref will definitely be a String, and if it does not refer to model material, rather than
     * raising an error, the return structure will include a field <code>nonModel: true</code>
     * @param that {Component} The component holding the reference
     * @param name {String} A human-readable string representing the type of block holding the reference - e.g. "modelListeners"
     * @param ref {String|ModelReference} The model reference to be parsed. This may have already been partially parsed at the original site - that is, a ModelReference is a
     * structure containing
     *     segs: {Array of String} An array of model path segments to be dereferenced in the target component (will become `modelSegs` in the final return)
     *     context: {String} An IoC reference to the component holding the model
     * @param implicitRelay {Boolean} <code>true</code> if the reference was being resolved for an implicit model relay - that is,
     * whether it occured within the `model` block itself. In this case, references to non-model material are not a failure and will simply be resolved
     * (by the caller) onto their targets (as constants). Otherwise, this function will issue a failure on discovering a reference to non-model material.
     * @return A structure holding:
     *    that {Component} The component whose model is the target of the reference. This may end up being constructed as part of the act of resolving the reference
     *    applier {Component} The changeApplier for the component <code>that</code>. This may end up being constructed as part of the act of resolving the reference
     *    modelSegs {Array of String} An array of path segments into the model of the component
     *    path {String} the value of <code>modelSegs</code> encoded as an EL path (remove client uses of this in time)
     *    nonModel {Boolean} Set if <code>implicitRelay</code> was true and the reference was not into a model (modelSegs/path will not be set in this case)
     *    segs {Array of String} Holds the full array of path segments found by parsing the original reference - only useful in <code>nonModel</code> case
     */
    fluid.parseValidModelReference = function (that, name, ref, implicitRelay) {
        var reject = function (message) {
            fluid.fail("Error in " + name + ": ", ref, message);
        };
        var parsed; // resolve ref into context and modelSegs
        if (typeof(ref) === "string") {
            if (fluid.isIoCReference(ref)) {
                parsed = fluid.parseModelReference(that, ref);
                var modelPoint = parsed.segs.indexOf("model");
                if (modelPoint === -1) {
                    if (implicitRelay) {
                        parsed.nonModel = true;
                    } else {
                        reject(" must be a reference into a component model via a path including the segment \"model\"");
                    }
                } else {
                    parsed.modelSegs = parsed.segs.slice(modelPoint + 1);
                    parsed.contextSegs = parsed.segs.slice(0, modelPoint);
                    delete parsed.path;
                }

            } else {
                parsed = {
                    path: ref,
                    modelSegs: that.applier.parseEL(ref)
                };
            }
        } else {
            if (!fluid.isArrayable(ref.segs)) {
                reject(" must contain an entry \"segs\" holding path segments referring a model path within a component");
            }
            parsed = {
                context: ref.context,
                modelSegs: fluid.expandOptions(ref.segs, that)
            };
        }
        var target; // resolve target component, which defaults to "that"
        if (parsed.context) {
            target = fluid.resolveContext(parsed.context, that);
            if (!target) {
                reject(" must be a reference to an existing component");
            }
            if (parsed.contextSegs) {
                target = fluid.getForComponent(target, parsed.contextSegs);
            }
        } else {
            target = that;
        }
        if (!parsed.nonModel) {
            if (!target.applier) {
                fluid.getForComponent(target, ["applier"]);
            }
            if (!target.applier) {
                reject(" must be a reference to a component with a ChangeApplier (descended from fluid.modelComponent)");
            }
        }
        parsed.that = target;
        parsed.applier = target.applier;
        if (!parsed.path) { // ChangeToApplicable amongst others rely on this
            parsed.path = target.applier.composeSegments.apply(null, parsed.modelSegs);
        }
        return parsed;
    };

    // Gets global record for a particular transaction id, allocating if necessary - looks up applier id to transaction,
    // as well as looking up source id (linkId in below) to count/true
    // Through poor implementation quality, not every access passes through this function - some look up instantiator.modelTransactions directly
    fluid.getModelTransactionRec = function (that, transId) {
        var instantiator = fluid.getInstantiator(that);
        if (!transId) {
            fluid.fail("Cannot get transaction record without transaction id");
        }
        if (!instantiator) {
            return null;
        }
        var transRec = instantiator.modelTransactions[transId];
        if (!transRec) {
            transRec = instantiator.modelTransactions[transId] = {
                relays: [], // sorted array of relay elements (also appear at top level index by transaction id)
                sources: {}, // hash of the global transaction sources (includes "init" but excludes "relay" and "local")
                externalChanges: {} // index by applierId to changePath to listener record
            };
        }
        return transRec;
    };

    fluid.recordChangeListener = function (component, applier, sourceListener, listenerId) {
        var shadow = fluid.shadowForComponent(component);
        fluid.recordListener(applier.modelChanged, sourceListener, shadow, listenerId);
    };

    fluid.registerRelayTransaction = function (transRec, targetApplier, transId, options, npOptions) {
        var newTrans = targetApplier.initiate("relay", null, transId); // non-top-level transaction will defeat postCommit
        var transEl = transRec[targetApplier.applierId] = {transaction: newTrans, relayCount: 0, namespace: npOptions.namespace, priority: npOptions.priority, options: options};
        transEl.priority = fluid.parsePriority(transEl.priority, transRec.relays.length, false, "model relay");
        transRec.relays.push(transEl);
        return transEl;
    };

    // Configure this parameter to tweak the number of relays the model will attempt per transaction before bailing out with an error
    fluid.relayRecursionBailout = 100;

    // Used with various arg combinations from different sources. For standard "implicit relay" or fully lensed relay,
    // the first 4 args will be set, and "options" will be empty

    // For a model-dependent relay, this will be used in two halves - firstly, all of the model
    // sources will bind to the relay transform document itself. In this case the argument "targetApplier" within "options" will be set.
    // In this case, the component known as "target" is really the source - it is a component reference discovered by parsing the
    // relay document.

    // Secondly, the relay itself will schedule an invalidation (as if receiving change to "*" of its source - which may in most
    // cases actually be empty) and play through its transducer. "Source" component itself is never empty, since it is used for listener
    // degistration on destruction (check this is correct for external model relay). However, "sourceSegs" may be empty in the case
    // there is no "source" component registered for the link. This change is played in a "half-transactional" way - that is, we wait
    // for all other changes in the system to settle before playing the relay document, in order to minimise the chances of multiple
    // firing and corruption. This is done via the "preCommit" hook registered at top level in establishModelRelay. This listener
    // is transactional but it does not require the transaction to conclude in order to fire - it may be reused as many times as
    // required within the "overall" transaction whilst genuine (external) changes continue to arrive.

    // TODO: Vast overcomplication and generation of closure garbage. SURELY we should be able to convert this into an externalised, arg-ist form
    fluid.registerDirectChangeRelay = function (target, targetSegs, source, sourceSegs, linkId, transducer, options, npOptions) {
        var targetApplier = options.targetApplier || target.applier; // implies the target is a relay document
        var sourceApplier = options.sourceApplier || source.applier; // implies the source is a relay document - listener will be transactional
        var applierId = targetApplier.applierId;
        targetSegs = fluid.makeArray(targetSegs);
        sourceSegs = sourceSegs ? fluid.makeArray(sourceSegs) : sourceSegs; // take copies since originals will be trashed
        var sourceListener = function (newValue, oldValue, path, changeRequest, trans, applier) {
            var transId = trans.id;
            var transRec = fluid.getModelTransactionRec(target, transId);
            if (applier && trans && !transRec[applier.applierId]) { // don't trash existing record which may contain "options" (FLUID-5397)
                transRec[applier.applierId] = {transaction: trans}; // enlist the outer user's original transaction
            }
            var existing = transRec[applierId];
            transRec[linkId] = transRec[linkId] || 0;
            // Crude "oscillation prevention" system limits each link to maximum of 2 operations per cycle (presumably in opposite directions)
            var relay = true; // TODO: See FLUID-5303 - we currently disable this check entirely to solve FLUID-5293 - perhaps we might remove link counts entirely
            if (relay) {
                ++transRec[linkId];
                if (transRec[linkId] > fluid.relayRecursionBailout) {
                    fluid.fail("Error in model relay specification at component ", target, " - operated more than " + fluid.relayRecursionBailout + " relays without model value settling - current model contents are ", trans.newHolder.model);
                }
                if (!existing) {
                    existing = fluid.registerRelayTransaction(transRec, targetApplier, transId, options, npOptions);
                }
                if (transducer && !options.targetApplier) {
                    // TODO: This is just for safety but is still unusual and now abused. The transducer doesn't need the "newValue" since all the transform information
                    // has been baked into the transform document itself. However, we now rely on this special signalling value to make sure we regenerate transforms in
                    // the "forwardAdapter"
                    transducer(existing.transaction, options.sourceApplier ? undefined : newValue, sourceSegs, targetSegs);
                } else if (newValue !== undefined) {
                    existing.transaction.fireChangeRequest({type: "ADD", segs: targetSegs, value: newValue});
                }
            }
        };
        var spec;
        if (sourceSegs) {
            spec = sourceApplier.modelChanged.addListener({
                isRelay: true,
                segs: sourceSegs,
                transactional: options.transactional
            }, sourceListener);
            fluid.log(fluid.logLevel.TRACE, "Adding relay listener with listenerId " + spec.listenerId + " to source applier with id " +
                sourceApplier.applierId + " from target applier with id " + applierId + " for target component with id " + target.id);
        }
        if (source) { // TODO - we actually may require to register on THREE sources in the case modelRelay is attached to a
            // component which is neither source nor target. Note there will be problems if source, say, is destroyed and recreated,
            // and holder is not - relay will in that case be lost. Need to integrate relay expressions with IoCSS.
            fluid.recordChangeListener(source, sourceApplier, sourceListener, spec.listenerId);
            if (target !== source) {
                fluid.recordChangeListener(target, sourceApplier, sourceListener, spec.listenerId);
            }
        }
    };

    // When called during parsing a contextualised model relay document, these arguments are reversed - "source" refers to the
    // current component, and "target" refers successively to the various "source" components.
    // "options" will be transformPackage
    fluid.connectModelRelay = function (source, sourceSegs, target, targetSegs, options) {
        var linkId = fluid.allocateGuid();
        function enlistComponent(component) {
            var enlist = fluid.enlistModelComponent(component);

            if (enlist.complete) {
                var shadow = fluid.shadowForComponent(component);
                if (shadow.modelComplete) {
                    enlist.completeOnInit = true;
                }
            }
        }
        enlistComponent(target);
        enlistComponent(source); // role of "source" and "target" may have been swapped in a modelRelay document
        var npOptions = fluid.filterKeys(options, ["namespace", "priority"]);

        if (options.update) { // it is a call via parseImplicitRelay for a relay document
            if (options.targetApplier) {
                // register changes from the model onto changes to the model relay document
                fluid.registerDirectChangeRelay(source, sourceSegs, target, targetSegs, linkId, null, {
                    transactional: false,
                    targetApplier: options.targetApplier,
                    update: options.update
                }, npOptions);
            } else {
                // We are in the middle of parsing a contextualised relay, and this call has arrived via its parseImplicitRelay.
                // Rather than bind source-source, instead register the "half-transactional" listener which binds changes
                // from the relay itself onto the target
                fluid.registerDirectChangeRelay(target, targetSegs, source, [], linkId + "-transform", options.forwardAdapter, {transactional: true, sourceApplier: options.forwardApplier}, npOptions);
            }
        } else { // more efficient branch where relay is uncontextualised
            fluid.registerDirectChangeRelay(target, targetSegs, source, sourceSegs, linkId, options.forwardAdapter, {transactional: false}, npOptions);
            if (sourceSegs) {
                fluid.registerDirectChangeRelay(source, sourceSegs, target, targetSegs, linkId, options.backwardAdapter, {transactional: false}, npOptions);
            }
        }
    };

    fluid.parseSourceExclusionSpec = function (targetSpec, sourceSpec) {
        targetSpec.excludeSource = fluid.arrayToHash(fluid.makeArray(sourceSpec.excludeSource || (sourceSpec.includeSource ? "*" : undefined)));
        targetSpec.includeSource = fluid.arrayToHash(fluid.makeArray(sourceSpec.includeSource));
        return targetSpec;
    };

    fluid.isExcludedChangeSource = function (transaction, spec) {
        if (!spec || !spec.excludeSource) { // mergeModelListeners initModelEvent fabricates a fake spec that bypasses processing
            return false;
        }
        var excluded = spec.excludeSource["*"];
        for (var source in transaction.fullSources) {
            if (spec.excludeSource[source]) {
                excluded = true;
            }
            if (spec.includeSource[source]) {
                excluded = false;
            }
        }
        return excluded;
    };

    fluid.model.guardedAdapter = function (transaction, cond, func, args) {
        if (!fluid.isExcludedChangeSource(transaction, cond)) {
            func.apply(null, args);
        }
    };

    // TODO: This rather crummy function is the only site with a hard use of "path" as String
    fluid.transformToAdapter = function (transform, targetPath) {
        var basedTransform = {};
        basedTransform[targetPath] = transform;
        return function (trans, newValue /*, sourceSegs, targetSegs */) {
            // TODO: More efficient model that can only run invalidated portion of transform (need to access changeMap of source transaction)
            fluid.model.transformWithRules(newValue, basedTransform, {finalApplier: trans});
        };
    };

    // TODO: sourcePath and targetPath should really be converted to segs to avoid excess work in parseValidModelReference
    fluid.makeTransformPackage = function (componentThat, transform, sourcePath, targetPath, forwardCond, backwardCond, namespace, priority) {
        var that = {
            forwardHolder: {model: transform},
            backwardHolder: {model: null}
        };
        that.generateAdapters = function (trans) {
            // can't commit "half-transaction" or events will fire - violate encapsulation in this way
            that.forwardAdapterImpl = fluid.transformToAdapter(trans ? trans.newHolder.model : that.forwardHolder.model, targetPath);
            if (sourcePath !== null) {
                that.backwardHolder.model = fluid.model.transform.invertConfiguration(transform);
                that.backwardAdapterImpl = fluid.transformToAdapter(that.backwardHolder.model, sourcePath);
            }
        };
        that.forwardAdapter = function (transaction, newValue) { // create a stable function reference for this possibly changing adapter
            if (newValue === undefined) {
                that.generateAdapters(); // TODO: Quick fix for incorrect scheduling of invalidation/transducing
                // "it so happens" that fluid.registerDirectChangeRelay invokes us with empty newValue in the case of invalidation -> transduction
            }
            fluid.model.guardedAdapter(transaction, forwardCond, that.forwardAdapterImpl, arguments);
        };
        // fired from fluid.model.updateRelays via invalidator event
        that.runTransform = function (trans) {
            trans.commit(); // this will reach the special "half-transactional listener" registered in fluid.connectModelRelay,
            // branch with options.targetApplier - by committing the transaction, we update the relay document in bulk and then cause
            // it to execute (via "transducer")
            trans.reset();
        };
        that.forwardApplier = fluid.makeHolderChangeApplier(that.forwardHolder);
        that.forwardApplier.isRelayApplier = true; // special annotation so these can be discovered in the transaction record
        that.invalidator = fluid.makeEventFirer({name: "Invalidator for model relay with applier " + that.forwardApplier.applierId});
        if (sourcePath !== null) {
            that.backwardApplier = fluid.makeHolderChangeApplier(that.backwardHolder);
            that.backwardAdapter = function (transaction) {
                fluid.model.guardedAdapter(transaction, backwardCond, that.backwardAdapterImpl, arguments);
            };
        }
        that.update = that.invalidator.fire; // necessary so that both routes to fluid.connectModelRelay from here hit the first branch
        var implicitOptions = {
            targetApplier: that.forwardApplier, // this special field identifies us to fluid.connectModelRelay
            update: that.update,
            namespace: namespace,
            priority: priority,
            refCount: 0
        };
        that.forwardHolder.model = fluid.parseImplicitRelay(componentThat, transform, [], implicitOptions);
        that.refCount = implicitOptions.refCount;
        that.namespace = namespace;
        that.priority = priority;
        that.generateAdapters();
        that.invalidator.addListener(that.generateAdapters);
        that.invalidator.addListener(that.runTransform);
        return that;
    };

    fluid.singleTransformToFull = function (singleTransform) {
        var withPath = $.extend(true, {inputPath: ""}, singleTransform);
        return {
            "": {
                transform: withPath
            }
        };
    };

    // Convert old-style "relay conditions" to source includes/excludes as used in model listeners
    fluid.model.relayConditions = {
        initOnly: {includeSource: "init"},
        liveOnly: {excludeSource: "init"},
        never:    {includeSource: []},
        always:   {}
    };

    fluid.model.parseRelayCondition = function (condition) {
        if (condition === "initOnly") {
            fluid.log(fluid.logLevel.WARN, "The relay condition \"initOnly\" is deprecated: Please use the form 'includeSource: \"init\"' instead");
        } else if (condition === "liveOnly") {
            fluid.log(fluid.logLevel.WARN, "The relay condition \"initOnly\" is deprecated: Please use the form 'excludeSource: \"init\"' instead");
        }
        var exclusionRec;
        if (!condition) {
            exclusionRec = {};
        } else if (typeof(condition) === "string") {
            exclusionRec = fluid.model.relayConditions[condition];
            if (!exclusionRec) {
                fluid.fail("Unrecognised model relay condition string \"" + condition + "\": the supported values are \"never\" or a record with members \"includeSource\" and/or \"excludeSource\"");
            }
        } else {
            exclusionRec = condition;
        }
        return fluid.parseSourceExclusionSpec({}, exclusionRec);
    };

    fluid.parseModelRelay = function (that, mrrec, key) {
        var parsedSource = mrrec.source ? fluid.parseValidModelReference(that, "modelRelay record member \"source\"", mrrec.source) :
            {path: null, modelSegs: null};
        var parsedTarget = fluid.parseValidModelReference(that, "modelRelay record member \"target\"", mrrec.target);
        var namespace = mrrec.namespace || key;

        var transform = mrrec.singleTransform ? fluid.singleTransformToFull(mrrec.singleTransform) : mrrec.transform;
        if (!transform) {
            fluid.fail("Cannot parse modelRelay record without element \"singleTransform\" or \"transform\":", mrrec);
        }
        var forwardCond = fluid.model.parseRelayCondition(mrrec.forward), backwardCond = fluid.model.parseRelayCondition(mrrec.backward);
        var transformPackage = fluid.makeTransformPackage(that, transform, parsedSource.path, parsedTarget.path, forwardCond, backwardCond, namespace, mrrec.priority);
        if (transformPackage.refCount === 0) { // There were no implicit relay elements found in the relay document - it can be relayed directly
            // This first call binds changes emitted from the relay ends to each other, synchronously
            fluid.connectModelRelay(parsedSource.that || that, parsedSource.modelSegs, parsedTarget.that, parsedTarget.modelSegs,
                fluid.filterKeys(transformPackage, ["forwardAdapter", "backwardAdapter", "namespace", "priority"]));
            // Primarily, here, we want to get rid of "update" which is what signals to connectModelRelay that this is a invalidatable relay
        } else {
            if (parsedSource.modelSegs) {
                fluid.fail("Error in model relay definition: If a relay transform has a model dependency, you can not specify a \"source\" entry - please instead enter this as \"input\" in the transform specification. Definition was ", mrrec, " for component ", that);
            }
            // This second call binds changes emitted from the relay document itself onto the relay ends (using the "half-transactional system")
            fluid.connectModelRelay(parsedSource.that || that, parsedSource.modelSegs, parsedTarget.that, parsedTarget.modelSegs, transformPackage);
        }
    };

    fluid.parseImplicitRelay = function (that, modelRec, segs, options) {
        var value;
        if (fluid.isIoCReference(modelRec)) {
            var parsed = fluid.parseValidModelReference(that, "model reference from model (implicit relay)", modelRec, true);
            if (parsed.nonModel) {
                value = fluid.getForComponent(parsed.that, parsed.segs);
            } else {
                ++options.refCount; // This count is used from within fluid.makeTransformPackage
                fluid.connectModelRelay(that, segs, parsed.that, parsed.modelSegs, options);
            }
        } else if (fluid.isPrimitive(modelRec) || !fluid.isPlainObject(modelRec)) {
            value = modelRec;
        } else if (modelRec.expander && fluid.isPlainObject(modelRec.expander)) {
            value = fluid.expandOptions(modelRec, that);
        } else {
            value = fluid.freshContainer(modelRec);
            fluid.each(modelRec, function (innerValue, key) {
                segs.push(key);
                var innerTrans = fluid.parseImplicitRelay(that, innerValue, segs, options);
                if (innerTrans !== undefined) {
                    value[key] = innerTrans;
                }
                segs.pop();
            });
        }
        return value;
    };


    // Conclude the transaction by firing to all external listeners in priority order
    fluid.model.notifyExternal = function (transRec) {
        var allChanges = transRec ? fluid.values(transRec.externalChanges) : [];
        fluid.sortByPriority(allChanges);
        for (var i = 0; i < allChanges.length; ++i) {
            var change = allChanges[i];
            var targetApplier = change.args[5]; // NOTE: This argument gets here via fluid.model.storeExternalChange from fluid.notifyModelChanges
            if (!targetApplier.destroyed) { // 3rd point of guarding for FLUID-5592
                change.listener.apply(null, change.args);
            }
        }
        fluid.clearLinkCounts(transRec, true); // "options" structures for relayCount are aliased
    };

    fluid.model.commitRelays = function (instantiator, transactionId) {
        var transRec = instantiator.modelTransactions[transactionId];
        fluid.each(transRec, function (transEl) {
        // EXPLAIN: This must commit ALL current transactions, not just those for relays - why?
            if (transEl.transaction) { // some entries are links
                transEl.transaction.commit("relay");
                transEl.transaction.reset();
            }
        });
    };

    // Listens to all invalidation to relays, and reruns/applies them if they have been invalidated
    fluid.model.updateRelays = function (instantiator, transactionId) {
        var transRec = instantiator.modelTransactions[transactionId];
        var updates = 0;
        fluid.sortByPriority(transRec.relays);
        fluid.each(transRec.relays, function (transEl) {
            // TODO: We have a bit of a problem here in that we only process updatable relays by priority - plain relays get to act non-transactionally
            if (transEl.transaction.changeRecord.changes > 0 && transEl.relayCount < 2 && transEl.options.update) {
                transEl.relayCount++;
                fluid.clearLinkCounts(transRec);
                transEl.options.update(transEl.transaction, transRec);
                ++updates;
            }
        });
        return updates;
    };

    fluid.establishModelRelay = function (that, optionsModel, optionsML, optionsMR, applier) {
        var shadow = fluid.shadowForComponent(that);
        if (!shadow.modelRelayEstablished) {
            shadow.modelRelayEstablished = true;
        } else {
            fluid.fail("FLUID-5887 failure: Model relay initialised twice on component", that);
        }
        fluid.mergeModelListeners(that, optionsML);

        var enlist = fluid.enlistModelComponent(that);
        fluid.each(optionsMR, function (mrrec, key) {
            for (var i = 0; i < mrrec.length; ++i) {
                fluid.parseModelRelay(that, mrrec[i], key);
            }
        });

        // Note: this particular instance of "refCount" is disused. We only use the count made within fluid.makeTransformPackge
        var initModels = fluid.transform(optionsModel, function (modelRec) {
            return fluid.parseImplicitRelay(that, modelRec, [], {refCount: 0, priority: "first"});
        });
        enlist.initModels = initModels;

        var instantiator = fluid.getInstantiator(that);

        function updateRelays(transaction) {
            while (fluid.model.updateRelays(instantiator, transaction.id) > 0) {} // eslint-disable-line no-empty
        }

        function commitRelays(transaction, applier, code) {
            if (code !== "relay") { // don't commit relays if this commit is already a relay commit
                fluid.model.commitRelays(instantiator, transaction.id);
            }
        }

        function concludeTransaction(transaction, applier, code) {
            if (code !== "relay") {
                fluid.model.notifyExternal(instantiator.modelTransactions[transaction.id]);
                delete instantiator.modelTransactions[transaction.id];
            }
        }

        applier.preCommit.addListener(updateRelays);
        applier.preCommit.addListener(commitRelays);
        applier.postCommit.addListener(concludeTransaction);

        return null;
    };

    // supported, PUBLIC API grade
    fluid.defaults("fluid.modelComponent", {
        gradeNames: ["fluid.component"],
        changeApplierOptions: {
            relayStyle: true,
            cullUnchanged: true
        },
        members: {
            model: "@expand:fluid.initRelayModel({that}, {that}.modelRelay)",
            applier: "@expand:fluid.makeHolderChangeApplier({that}, {that}.options.changeApplierOptions)",
            modelRelay: "@expand:fluid.establishModelRelay({that}, {that}.options.model, {that}.options.modelListeners, {that}.options.modelRelay, {that}.applier)"
        },
        mergePolicy: {
            model: {
                noexpand: true,
                func: fluid.arrayConcatPolicy // TODO: bug here in case a model consists of an array
            },
            modelListeners: fluid.makeMergeListenersPolicy(fluid.arrayConcatPolicy),
            modelRelay: fluid.makeMergeListenersPolicy(fluid.arrayConcatPolicy, true)
        }
    });

    fluid.modelChangedToChange = function (args) {
        return {
            value: args[0],
            oldValue: args[1],
            path: args[2],
            transaction: args[4]
        };
    };

    // Note - has only one call, from resolveModelListener
    fluid.event.invokeListener = function (listener, args, localRecord, mergeRecord) {
        if (typeof(listener) === "string") {
            listener = fluid.event.resolveListener(listener); // just resolves globals
        }
        return listener.apply(null, args, localRecord, mergeRecord); // can be "false apply" that requires extra context for expansion
    };

    fluid.resolveModelListener = function (that, record) {
        var togo = function () {
            if (fluid.isDestroyed(that)) { // first guarding point to resolve FLUID-5592
                return;
            }
            var change = fluid.modelChangedToChange(arguments);
            var args = arguments;
            var localRecord = {change: change, "arguments": args};
            var mergeRecord = {source: Object.keys(change.transaction.sources)}; // cascade for FLUID-5490
            if (record.args) {
                args = fluid.expandOptions(record.args, that, {}, localRecord);
            }
            fluid.event.invokeListener(record.listener, fluid.makeArray(args), localRecord, mergeRecord);
        };
        fluid.event.impersonateListener(record.listener, togo);
        return togo;
    };

    fluid.registerModelListeners = function (that, record, paths, namespace) {
        var func = fluid.resolveModelListener(that, record);
        fluid.each(record.byTarget, function (parsedArray) {
            var parsed = parsedArray[0]; // that, applier are common across all these elements
            var spec = {
                listener: func, // for initModelEvent
                listenerId: fluid.allocateGuid(), // external declarative listeners may often share listener handle, identify here
                segsArray: fluid.getMembers(parsedArray, "modelSegs"),
                pathArray: fluid.getMembers(parsedArray, "path"),
                includeSource: record.includeSource,
                excludeSource: record.excludeSource,
                priority: fluid.expandOptions(record.priority, that),
                transactional: true
            };
            // update "spec" so that we parse priority information just once
            spec = parsed.applier.modelChanged.addListener(spec, func, namespace, record.softNamespace);

            fluid.recordChangeListener(that, parsed.applier, func, spec.listenerId);
            function initModelEvent() {
                if (fluid.isModelComplete(parsed.that)) {
                    var trans = parsed.applier.initiate(null, "init");
                    fluid.initModelEvent(that, parsed.applier, trans, [spec]);
                    trans.commit();
                }
            }
            if (that !== parsed.that && !fluid.isModelComplete(that)) { // TODO: Use FLUID-4883 "latched events" when available
                // Don't confuse the end user by firing their listener before the component is constructed
                // TODO: Better detection than this is requred - we assume that the target component will not be discovered as part
                // of the initial transaction wave, but if it is, it will get a double notification - we really need "wave of explosions"
                // since we are currently too early in initialisation of THIS component in order to tell if other will be found
                // independently.
                var onCreate = fluid.getForComponent(that, ["events", "onCreate"]);
                onCreate.addListener(initModelEvent);
            }
        });
    };

    fluid.mergeModelListeners = function (that, listeners) {
        fluid.each(listeners, function (value, key) {
            if (typeof(value) === "string") {
                value = {
                    funcName: value
                };
            }
            // Bypass fluid.event.dispatchListener by means of "standard = false" and enter our custom workflow including expanding "change":
            var records = fluid.event.resolveListenerRecord(value, that, "modelListeners", null, false).records;
            fluid.each(records, function (record) {
                // Aggregate model listeners into groups referring to the same component target.
                // We do this so that a single entry will appear in its modelListeners so that they may
                // be notified just once per transaction, and also displaced by namespace
                record.byTarget = {};
                var paths = fluid.makeArray(record.path === undefined ? key : record.path);
                fluid.each(paths, function (path) {
                    var parsed = fluid.parseValidModelReference(that, "modelListeners entry", path);
                    fluid.pushArray(record.byTarget, parsed.that.id, parsed);
                });
                var namespace = (record.namespace && !record.softNamespace ? record.namespace : null) || (record.path !== undefined ? key : null);
                fluid.registerModelListeners(that, record, paths, namespace);
            });
        });
    };


    /** CHANGE APPLIER **/

    /** Add a listener to a ChangeApplier event that only acts in the case the event
     * has not come from the specified source (typically ourself)
     * @param modelEvent An model event held by a changeApplier (typically applier.modelChanged)
     * @param path The path specification to listen to
     * @param source The source value to exclude (direct equality used)
     * @param func The listener to be notified of a change
     * @param [eventName] - optional - the event name to be listened to - defaults to "modelChanged"
     * @param [namespace] - optional - the event namespace
     */

    /** Dispatches a list of changes to the supplied applier */
    fluid.fireChanges = function (applier, changes) {
        for (var i = 0; i < changes.length; ++i) {
            applier.fireChangeRequest(changes[i]);
        }
    };

    fluid.model.isChangedPath = function (changeMap, segs) {
        for (var i = 0; i <= segs.length; ++i) {
            if (typeof(changeMap) === "string") {
                return true;
            }
            if (i < segs.length && changeMap) {
                changeMap = changeMap[segs[i]];
            }
        }
        return false;
    };

    fluid.model.setChangedPath = function (options, segs, value) {
        var notePath = function (record) {
            segs.unshift(record);
            fluid.model.setSimple(options, segs, value);
            segs.shift();
        };
        if (!fluid.model.isChangedPath(options.changeMap, segs)) {
            ++options.changes;
            notePath("changeMap");
        }
        if (!fluid.model.isChangedPath(options.deltaMap, segs)) {
            ++options.deltas;
            notePath("deltaMap");
        }
    };

    fluid.model.fetchChangeChildren = function (target, i, segs, source, options) {
        fluid.each(source, function (value, key) {
            segs[i] = key;
            fluid.model.applyChangeStrategy(target, key, i, segs, value, options);
            segs.length = i;
        });
    };

    // Called with two primitives which are compared for equality. This takes account of "floating point slop" to avoid
    // continuing to propagate inverted values as changes
    // TODO: replace with a pluggable implementation
    fluid.model.isSameValue = function (a, b) {
        if (typeof(a) !== "number" || typeof(b) !== "number") {
            return a === b;
        } else {
            // Don't use isNaN because of https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/isNaN#Confusing_special-case_behavior
            if (a === b || a !== a && b !== b) { // Either the same concrete number or both NaN
                return true;
            } else {
                var relError = Math.abs((a - b) / b);
                return relError < 1e-12; // 64-bit floats have approx 16 digits accuracy, this should deal with most reasonable transforms
            }
        }
    };

    fluid.model.applyChangeStrategy = function (target, name, i, segs, source, options) {
        var targetSlot = target[name];
        var sourceCode = fluid.typeCode(source);
        var targetCode = fluid.typeCode(targetSlot);
        var changedValue = fluid.NO_VALUE;
        if (sourceCode === "primitive") {
            if (!fluid.model.isSameValue(targetSlot, source)) {
                changedValue = source;
                ++options.unchanged;
            }
        } else if (targetCode !== sourceCode || sourceCode === "array" && source.length !== targetSlot.length) {
            // RH is not primitive - array or object and mismatching or any array rewrite
            changedValue = fluid.freshContainer(source);
        }
        if (changedValue !== fluid.NO_VALUE) {
            target[name] = changedValue;
            if (options.changeMap) {
                fluid.model.setChangedPath(options, segs, options.inverse ? "DELETE" : "ADD");
            }
        }
        if (sourceCode !== "primitive") {
            fluid.model.fetchChangeChildren(target[name], i + 1, segs, source, options);
        }
    };

    fluid.model.stepTargetAccess = function (target, type, segs, startpos, endpos, options) {
        for (var i = startpos; i < endpos; ++i) {
            if (!target) {
                continue;
            }
            var oldTrunk = target[segs[i]];
            target = fluid.model.traverseWithStrategy(target, segs, i, options[type === "ADD" ? "resolverSetConfig" : "resolverGetConfig"],
                segs.length - i - 1);
            if (oldTrunk !== target && options.changeMap) {
                fluid.model.setChangedPath(options, segs.slice(0, i + 1), "ADD");
            }
        }
        return {root: target, last: segs[endpos]};
    };

    fluid.model.defaultAccessorConfig = function (options) {
        options = options || {};
        options.resolverSetConfig = options.resolverSetConfig || fluid.model.escapedSetConfig;
        options.resolverGetConfig = options.resolverGetConfig || fluid.model.escapedGetConfig;
        return options;
    };

    // Changes: "MERGE" action abolished
    // ADD/DELETE at root can be destructive
    // changes tracked in optional final argument holding "changeMap: {}, changes: 0, unchanged: 0"
    fluid.model.applyHolderChangeRequest = function (holder, request, options) {
        options = fluid.model.defaultAccessorConfig(options);
        options.deltaMap = options.changeMap ? {} : null;
        options.deltas = 0;
        var length = request.segs.length;
        var pen, atRoot = length === 0;
        if (atRoot) {
            pen = {root: holder, last: "model"};
        } else {
            if (!holder.model) {
                holder.model = {};
                fluid.model.setChangedPath(options, [], options.inverse ? "DELETE" : "ADD");
            }
            pen = fluid.model.stepTargetAccess(holder.model, request.type, request.segs, 0, length - 1, options);
        }
        if (request.type === "ADD") {
            var value = request.value;
            var segs = fluid.makeArray(request.segs);
            fluid.model.applyChangeStrategy(pen.root, pen.last, length - 1, segs, value, options, atRoot);
        } else if (request.type === "DELETE") {
            if (pen.root && pen.root[pen.last] !== undefined) {
                delete pen.root[pen.last];
                if (options.changeMap) {
                    fluid.model.setChangedPath(options, request.segs, "DELETE");
                }
            }
        } else {
            fluid.fail("Unrecognised change type of " + request.type);
        }
        return options.deltas ? options.deltaMap : null;
    };

    /** Compare two models for equality using a deep algorithm. It is assumed that both models are JSON-equivalent and do
     * not contain circular links.
     * @param modela The first model to be compared
     * @param modelb The second model to be compared
     * @param options {Object} If supplied, will receive a map and summary of the change content between the objects. Structure is:
     *     changeMap: {Object/String} An isomorphic map of the object structures to values "ADD" or "DELETE" indicating
     * that values have been added/removed at that location. Note that in the case the object structure differs at the root, <code>changeMap</code> will hold
     * the plain String value "ADD" or "DELETE"
     *     changes: {Integer} Counts the number of changes between the objects - The two objects are identical iff <code>changes === 0</code>.
     *     unchanged: {Integer} Counts the number of leaf (primitive) values at which the two objects are identical. Note that the current implementation will
     * double-count, this summary should be considered indicative rather than precise.
     * @return <code>true</code> if the models are identical
     */
    // TODO: This algorithm is quite inefficient in that both models will be copied once each
    // supported, PUBLIC API function
    fluid.model.diff = function (modela, modelb, options) {
        options = options || {changes: 0, unchanged: 0, changeMap: {}}; // current algorithm can't avoid the expense of changeMap
        var typea = fluid.typeCode(modela);
        var typeb = fluid.typeCode(modelb);
        var togo;
        if (typea === "primitive" && typeb === "primitive") {
            togo = fluid.model.isSameValue(modela, modelb);
        } else if (typea === "primitive" ^ typeb === "primitive") {
            togo = false;
        } else {
            // Apply both forward and reverse changes - if no changes either way, models are identical
            // "ADD" reported in the reverse direction must be accounted as a "DELETE"
            var holdera = {
                model: fluid.copy(modela)
            };
            fluid.model.applyHolderChangeRequest(holdera, {value: modelb, segs: [], type: "ADD"}, options);
            var holderb = {
                model: fluid.copy(modelb)
            };
            options.inverse = true;
            fluid.model.applyHolderChangeRequest(holderb, {value: modela, segs: [], type: "ADD"}, options);
            togo = options.changes === 0;
        }
        if (togo === false && options.changes === 0) { // catch all primitive cases
            options.changes = 1;
            options.changeMap = modelb === undefined ? "DELETE" : "ADD";
        } else if (togo === true && options.unchanged === 0) {
            options.unchanged = 1;
        }
        return togo;
    };

    // Here we only support for now very simple expressions which have at most one
    // wildcard which must appear in the final segment
    fluid.matchChanges = function (changeMap, specSegs, newHolder) {
        var root = newHolder.model;
        var map = changeMap;
        var outSegs = ["model"];
        var wildcard = false;
        var togo = [];
        for (var i = 0; i < specSegs.length; ++i) {
            var seg = specSegs[i];
            if (seg === "*") {
                if (i === specSegs.length - 1) {
                    wildcard = true;
                } else {
                    fluid.fail("Wildcard specification in modelChanged listener is only supported for the final path segment: " + specSegs.join("."));
                }
            } else {
                outSegs.push(seg);
                map = fluid.isPrimitive(map) ? map : map[seg];
                root = root ? root[seg] : undefined;
            }
        }
        if (map) {
            if (wildcard) {
                fluid.each(root, function (value, key) {
                    togo.push(outSegs.concat(key));
                });
            } else {
                togo.push(outSegs);
            }
        }
        return togo;
    };

    fluid.storeExternalChange = function (transRec, applier, invalidPath, spec, args) {
        var pathString = applier.composeSegments.apply(null, invalidPath);
        var keySegs = [applier.holder.id, spec.listenerId, (spec.wildcard ? pathString : "")];
        var keyString = keySegs.join("|");
        // TODO: We think we probably have a bug in that notifications destined for end of transaction are actually continuously emitted during the transaction
        // These are unbottled in fluid.concludeTransaction
        transRec.externalChanges[keyString] = {listener: spec.listener, namespace: spec.namespace, priority: spec.priority, args: args};
    };

    fluid.notifyModelChanges = function (listeners, changeMap, newHolder, oldHolder, changeRequest, transaction, applier, that) {
        if (!listeners) {
            return;
        }
        var transRec = transaction && fluid.getModelTransactionRec(that, transaction.id);
        for (var i = 0; i < listeners.length; ++i) {
            var spec = listeners[i];
            var multiplePaths = spec.segsArray.length > 1; // does this spec listen on multiple paths? If so, don't rebase arguments and just report once per transaction
            for (var j = 0; j < spec.segsArray.length; ++j) {
                var invalidPaths = fluid.matchChanges(changeMap, spec.segsArray[j], newHolder);
                // We only have multiple invalidPaths here if there is a wildcard
                for (var k = 0; k < invalidPaths.length; ++k) {
                    if (applier.destroyed) { // 2nd guarding point for FLUID-5592
                        return;
                    }
                    var invalidPath = invalidPaths[k];
                    spec.listener = fluid.event.resolveListener(spec.listener);
                    var args = [multiplePaths ? newHolder.model : fluid.model.getSimple(newHolder, invalidPath),
                                multiplePaths ? oldHolder.model : fluid.model.getSimple(oldHolder, invalidPath),
                                multiplePaths ? [] : invalidPath.slice(1), changeRequest, transaction, applier];
                    // FLUID-5489: Do not notify of null changes which were reported as a result of invalidating a higher path
                    // TODO: We can improve greatly on efficiency by i) reporting a special code from fluid.matchChanges which signals the difference between invalidating a higher and lower path,
                    // ii) improving fluid.model.diff to create fewer intermediate structures and no copies
                    // TODO: The relay invalidation system is broken and must always be notified (branch 1) - since our old/new value detection is based on the wrong (global) timepoints in the transaction here,
                    // rather than the "last received model" by the holder of the transform document
                    if (!spec.isRelay) {
                        var isNull = fluid.model.diff(args[0], args[1]);
                        if (isNull) {
                            continue;
                        }
                        var sourceExcluded = fluid.isExcludedChangeSource(transaction, spec);
                        if (sourceExcluded) {
                            continue;
                        }
                    }
                    if (transRec && !spec.isRelay && spec.transactional) { // bottle up genuine external changes so we can sort and dedupe them later
                        fluid.storeExternalChange(transRec, applier, invalidPath, spec, args);
                    } else {
                        spec.listener.apply(null, args);
                    }
                }
            }
        }
    };

    fluid.bindELMethods = function (applier) {
        applier.parseEL = function (EL) {
            return fluid.model.pathToSegments(EL, applier.options.resolverSetConfig);
        };
        applier.composeSegments = function () {
            return applier.options.resolverSetConfig.parser.compose.apply(null, arguments);
        };
    };

    fluid.initModelEvent = function (that, applier, trans, listeners) {
        fluid.notifyModelChanges(listeners, "ADD", trans.oldHolder, fluid.emptyHolder, null, trans, applier, that);
    };

    // A standard "empty model" for the purposes of comparing initial state during the primordial transaction
    fluid.emptyHolder = fluid.freezeRecursive({ model: undefined });

    fluid.preFireChangeRequest = function (applier, changeRequest) {
        if (!changeRequest.type) {
            changeRequest.type = "ADD";
        }
        changeRequest.segs = changeRequest.segs || applier.parseEL(changeRequest.path);
    };

    // Automatically adapts change onto fireChangeRequest
    fluid.bindRequestChange = function (that) {
        that.change = function (path, value, type, source) {
            var changeRequest = {
                path: path,
                value: value,
                type: type,
                source: source
            };
            that.fireChangeRequest(changeRequest);
        };
    };

    // Quick n dirty test to cheaply detect Object versus other JSON types
    fluid.isObjectSimple = function (totest) {
        return Object.prototype.toString.call(totest) === "[object Object]";
    };

    fluid.mergeChangeSources = function (target, globalSources) {
        if (fluid.isObjectSimple(globalSources)) { // TODO: No test for this branch!
            fluid.extend(target, globalSources);
        } else {
            fluid.each(fluid.makeArray(globalSources), function (globalSource) {
                target[globalSource] = true;
            });
        }
    };

    fluid.ChangeApplier = function () {};

    fluid.makeHolderChangeApplier = function (holder, options) {
        options = fluid.model.defaultAccessorConfig(options);
        var applierId = fluid.allocateGuid();
        var that = new fluid.ChangeApplier();
        var name = fluid.isComponent(holder) ? "ChangeApplier for component " + fluid.dumpThat(holder) : "ChangeApplier with id " + applierId;
        $.extend(that, {
            applierId: applierId,
            holder: holder,
            listeners: fluid.makeEventFirer({name: "Internal change listeners for " + name}),
            transListeners: fluid.makeEventFirer({name: "External change listeners for " + name}),
            options: options,
            modelChanged: {},
            preCommit: fluid.makeEventFirer({name: "preCommit event for " + name}),
            postCommit: fluid.makeEventFirer({name: "postCommit event for " + name})
        });
        that.destroy = function () {
            that.preCommit.destroy();
            that.postCommit.destroy();
            that.destroyed = true;
        };
        that.modelChanged.addListener = function (spec, listener, namespace, softNamespace) {
            if (typeof(spec) === "string") {
                spec = {
                    path: spec
                };
            } else {
                spec = fluid.copy(spec);
            }
            spec.listenerId = spec.listenerId || fluid.allocateGuid(); // FLUID-5151: don't use identifyListener since event.addListener will use this as a namespace
            spec.namespace = namespace;
            spec.softNamespace = softNamespace;
            if (typeof(listener) === "string") { // The reason for "globalName" is so that listener names can be resolved on first use and not on registration
                listener = {globalName: listener};
            }
            spec.listener = listener;
            if (spec.transactional !== false) {
                spec.transactional = true;
            }
            if (!spec.segsArray) { // It's a manual registration
                if (spec.path !== undefined) {
                    spec.segs = spec.segs || that.parseEL(spec.path);
                }
                if (!spec.segsArray) {
                    spec.segsArray = [spec.segs];
                }
            }
            fluid.parseSourceExclusionSpec(spec, spec);
            spec.wildcard = fluid.accumulate(fluid.transform(spec.segsArray, function (segs) {
                return fluid.contains(segs, "*");
            }), fluid.add, 0);
            if (spec.wildcard && spec.segsArray.length > 1) {
                fluid.fail("Error in model listener specification ", spec, " - you may not supply a wildcard pattern as one of a set of multiple paths to be matched");
            }
            var firer = that[spec.transactional ? "transListeners" : "listeners"];
            firer.addListener(spec);
            return spec; // return is used in registerModelListeners
        };
        that.modelChanged.removeListener = function (listener) {
            that.listeners.removeListener(listener);
            that.transListeners.removeListener(listener);
        };
        that.fireChangeRequest = function (changeRequest) {
            var ation = that.initiate("local", changeRequest.source);
            ation.fireChangeRequest(changeRequest);
            ation.commit();
        };
        /**
         * Initiate a fresh transaction on this applier, perhaps coordinated with other transactions sharing the same id across the component tree
         * Arguments all optional
         * localSource {String}: "local", "relay" or null Local source identifiers only good for transaction's representative on this applier
         *  globalSources: {String|Array of String|Object String->true} Global source identifiers common across this transaction
         *  transactionId: {String} Global transaction id to enlist with
         */
        that.initiate = function (localSource, globalSources, transactionId) {
            localSource = globalSources === "init" ? null : (localSource || "local"); // supported values for localSource are "local" and "relay" - globalSource of "init" defeats defaulting of localSource to "local"
            var defeatPost = localSource === "relay"; // defeatPost is supplied for all non-top-level transactions
            var trans = {
                instanceId: fluid.allocateGuid(), // for debugging only - the representative of this transction on this applier
                id: transactionId || fluid.allocateGuid(), // The global transaction id across all appliers - allocate here if this is the starting point
                changeRecord: {
                    resolverSetConfig: options.resolverSetConfig, // here to act as "options" in applyHolderChangeRequest
                    resolverGetConfig: options.resolverGetConfig
                },
                reset: function () {
                    trans.oldHolder = holder;
                    trans.newHolder = { model: fluid.copy(holder.model) };
                    trans.changeRecord.changes = 0;
                    trans.changeRecord.unchanged = 0; // just for type consistency - we don't use these values in the ChangeApplier
                    trans.changeRecord.changeMap = {};
                },
                commit: function (code) {
                    that.preCommit.fire(trans, that, code);
                    if (trans.changeRecord.changes > 0) {
                        var oldHolder = {model: holder.model};
                        holder.model = trans.newHolder.model;
                        fluid.notifyModelChanges(that.transListeners.sortedListeners, trans.changeRecord.changeMap, holder, oldHolder, null, trans, that, holder);
                    }
                    if (!defeatPost) {
                        that.postCommit.fire(trans, that, code);
                    }
                },
                fireChangeRequest: function (changeRequest) {
                    fluid.preFireChangeRequest(that, changeRequest);
                    changeRequest.transactionId = trans.id;
                    var deltaMap = fluid.model.applyHolderChangeRequest(trans.newHolder, changeRequest, trans.changeRecord);
                    fluid.notifyModelChanges(that.listeners.sortedListeners, deltaMap, trans.newHolder, holder, changeRequest, trans, that, holder);
                },
                hasChangeSource: function (source) {
                    return trans.fullSources[source];
                }
            };
            var transRec = fluid.getModelTransactionRec(holder, trans.id);
            if (transRec) {
                fluid.mergeChangeSources(transRec.sources, globalSources);
                trans.sources = transRec.sources;
                trans.fullSources = Object.create(transRec.sources);
                trans.fullSources[localSource] = true;
            }
            trans.reset();
            fluid.bindRequestChange(trans);
            return trans;
        };

        fluid.bindRequestChange(that);
        fluid.bindELMethods(that);
        return that;
    };

})(jQuery, fluid_2_0_0);
