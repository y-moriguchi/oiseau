(function(root) {
    function isObject(obj) {
        return typeof obj === "object" && obj !== null;
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function isInteger(x) {
        return typeof x === "number" && isFinite(x) && Math.floor(x) === x;
    }

    function deepCopy(obj) {
        var i,
            res;
        if(isArray(obj)) {
            res = [];
            for(i = 0; i < obj.length; i++) {
                res[i] = deepCopy(obj[i]);
            }
        } else if(isObject(obj)) {
            res = {};
            for(i in obj) {
                if(obj.hasOwnProperty(i)) {
                    res[i] = deepCopy(obj[i]);
                }
            }
        } else {
            res = obj;
        }
        return res;
    }

    function isEqual(obj1, obj2) {
        var i;

        if(isArray(obj1) && isArray(obj2)) {
            if(obj1.length !== obj2.length) {
                return false;
            } else {
                for(i = 0; i < obj1.length; i++) {
                    if(!isEqual(obj1[i], obj2[i])) {
                        return false;
                    }
                }
                return true;
            }
        } else if(isObject(obj1) && isObject(obj2)) {
            for(i in obj1) {
                if(obj1.hasOwnProperty(i)) {
                    if(!isEqual(obj1[i], obj2[i])) {
                        return false;
                    }
                }
            }
            for(i in obj2) {
                if(obj2.hasOwnProperty(i)) {
                    if(!isEqual(obj2[i], obj1[i])) {
                        return false;
                    }
                }
            }
            return true;
        } else {
            return obj1 === obj2;
        }
    }

    function Rena(option) {
        var optIgnore = option ? wrap(option.ignore) : null,
            optKeys = option ? option.keys : null,
            concatNotSkip = concat0(function(match, index) { return index; }),
            patternFloat = /[\+\-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][\+\-]?[0-9]+)?/,
            me;

        function wrap(anObject) {
            var regex,
                reSource,
                reFlags = "g";

            if(typeof anObject === "string") {
                return function(match, index, attr) {
                    if(anObject === match.substring(index, index + anObject.length)) {
                        return {
                            match: anObject,
                            lastIndex: index + anObject.length,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            } else if(anObject instanceof RegExp) {
                reSource = anObject.source;
                reFlags += anObject.ignoreCase ? "i" : "";
                reFlags += anObject.multiline ? "m" : "";
                regex = new RegExp(reSource, reFlags);
                return function(match, lastindex, attr) {
                    var match;
                    regex.lastIndex = 0;
                    if(!!(match = regex.exec(match.substring(lastindex))) && match.index === 0) {
                        return {
                            match: match[0],
                            lastIndex: lastindex + regex.lastIndex,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            } else {
                return anObject;
            }
        }

        function wrapObjects(objects) {
            var result = [], i;

            for(i = 0; i < objects.length; i++) {
                result.push(wrap(objects[i]));
            }
            return result;
        }

        function defaultSkipSpace(match, index) {
            var result;

            if(!optIgnore || !(result = optIgnore(match, index, null))) {
                return index;
            } else {
                return result.lastIndex;
            }
        }

        function concat0(skipSpace) {
            return function(/* args */) {
                var args = wrapObjects(Array.prototype.slice.call(arguments));

                return function(match, index, attr) {
                    var indexNew = index,
                        attrNew = attr,
                        result,
                        i;

                    for(i = 0; i < args.length; i++) {
                        result = args[i](match, indexNew, attrNew);
                        if(result) {
                            indexNew = skipSpace(match, result.lastIndex);
                            attrNew = result.attr;
                        } else {
                            return null;
                        }
                    }
                    return {
                        match: match.substring(index, indexNew),
                        lastIndex: indexNew,
                        attr: attrNew
                    };
                };
            };
        }

        me = {
            isEnd: function() {
                return function(match, index, attr) {
                    if(index >= match.length) {
                        return {
                            match: "",
                            lastIndex: index,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            },

            concat: concat0(defaultSkipSpace),

            choice: function(/* args */) {
                var args = wrapObjects(Array.prototype.slice.call(arguments));

                return function(match, index, attr) {
                    var result, i;

                    for(i = 0; i < args.length; i++) {
                        result = args[i](match, index, attr);
                        if(result) {
                            return result;
                        }
                    }
                    return null;
                };
            },

            action: function(exp, action) {
                var wrapped = wrap(exp);

                return function(match, index, attr) {
                    var result = wrapped(match, index, attr);

                    if(result) {
                        return {
                            match: result.match,
                            lastIndex: result.lastIndex,
                            attr: action(result.match, result.attr, attr)
                        };
                    } else {
                        return null;
                    }
                };
            },

            lookaheadNot: function(exp) {
                var wrapped = wrap(exp);

                return function(match, index, attr) {
                    var result = wrapped(match, index, attr);

                    if(result) {
                        return null;
                    } else {
                        return {
                            match: "",
                            lastIndex: index,
                            attr: attr
                        };
                    }
                };
            },

            letrec: function(/* args */) {
                var l = Array.prototype.slice.call(arguments),
                    delays = [],
                    memo = [],
                    i;

                for(i = 0; i < l.length; i++) {
                    (function(i) {
                        delays.push(function(match, index, attr) {
                            if(!memo[i]) {
                                memo[i] = l[i].apply(null, delays);
                            }
                            return memo[i](match, index, attr);
                        });
                    })(i);
                }
                return delays[0];
            },

            zeroOrMore: function(exp) {
                return me.letrec(function(y) {
                    return me.choice(me.concat(exp, y), "");
                });
            },

            oneOrMore: function(exp) {
                return me.concat(exp, me.zeroOrMore(exp));
            },

            opt: function(exp) {
                return me.choice(exp, "");
            },

            lookahead: function(exp) {
                return me.lookaheadNot(me.lookaheadNot(exp));
            },

            attr: function(val) {
                return me.action("", function() { return val; });
            },

            real: function(val) {
                return me.action(patternFloat, function(match) { return parseFloat(match); });
            },

            key: function(key) {
                var skipKeys = [],
                    i;

                if(!optKeys) {
                    throw new Error("keys are not set");
                }
                for(i = 0; i < optKeys.length; i++) {
                    if(key.length < optKeys[i] && key === optKeys[i].substring(0, key.length)) {
                        skipKeys.push(optKeys[i]);
                    }
                }
                return me.concat(me.lookaheadNot(me.choice.apply(null, skipKeys)), key);
            },

            notKey: function() {
                if(!optKeys) {
                    throw new Error("keys are not set");
                }
                return me.lookaheadNot(me.choice.apply(null, optKeys));
            },

            equalsId: function(key) {
                if(!optIgnore && !optKeys) {
                    return wrap(key);
                } else if(optIgnore && !optKeys) {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookahead(optIgnore)));
                } else if(optKeys && !optIgnore) {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookaheadNot(me.notKey())));
                } else {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookahead(optIgnore), me.lookaheadNot(me.notKey())));
                }
            }
        };
        return me;
    }

    function Lambda(option) {
        var opt = option ? option : {};
        var log = opt.log ? opt.log : console.log;
        var maxnum = opt.maxNumber ? opt.maxNumber : 256;
        var count = 1;
        var r = Rena({ ignore: /[ \t]+/ });
        var parser = r.letrec(
            function(exprlist, expr, lambda) {
                return r.concat(
                    r.attr(null),
                    r.oneOrMore(
                        r.action(expr, function(match, syn, inh) {
                            return inh === null ? syn : [inh].concat([syn]);
                        })));
            },

            function(exprlist, expr, lambda) {
                return r.choice(
                    r.concat("(", exprlist, ")"),
                    lambda,
                    r.action(/[a-z]/, function(match, syn, inh) {
                        return match;
                    }),

                    r.action(/[A-Z][_a-z0-9]*/, function(match, syn, inh) {
                        if(!macroEnv[match]) {
                            throw new Error("Macro not defined: " + match);
                        }
                        return substMacro(macroEnv[match]);
                    }),

                    r.action(/<[^>]+>/, function(match, syn, inh) {
                        return substMacro({
                            "function": {
                                args: "x",
                                begin: [["print", { "q": match.substring(1, match.length - 1) }], "x"]
                            }
                        });
                    }),

                    r.concat(
                        "[",
                        r.attr([]),
                        r.oneOrMore(
                            r.action(expr, function(match, syn, inh) {
                                return inh.concat([syn]);
                            })),
                        r.choice(
                            r.concat(
                                "|",
                                r.action(expr, function(match, syn, inh) {
                                    return makeList(inh, syn);
                                })),
                            r.action("", function(match, syn, inh) {
                                return makeList(inh, substMacro(objFalse));
                            })),
                        "]"),

                    r.action(/[0-9]+/, function(match, syn, inh) {
                        var num = parseFloat(match),
                            i,
                            funcarg = "v#" + (count++),
                            xarg = "v#" + (count++),
                            result = xarg;

                        if(!isInteger(num) || num > maxnum) {
                            throw new Error("Number too big");
                        }
                        for(i = 0; i < num; i++) {
                            result = [funcarg, result];
                        }
                        return {
                            "function": {
                                "args": [funcarg],
                                "begin": [
                                    {
                                        "function": {
                                            "args": [xarg],
                                            "begin": [result]
                                        }
                                    }
                                ]
                            }
                        };
                    })
                );
            },

            function(exprlist, expr, lambda) {
                return r.concat(
                    "^",
                    r.concat(
                        r.attr([]),
                        r.oneOrMore(
                            r.action(
                                /[a-z]/, function(match, syn, inh) {
                                    return inh.concat([match]);
                                }))),
                    ".",
                    r.action(exprlist, function(match, syn, inh) {
                        var subst;

                        subst = currying(inh, [syn], 0);
                        return substMacro(subst);
                    }))
            });

        var macroEnv = {};
        var macro = r.concat(
                r.action(/[A-Z][_a-z0-9]*/, function(match, syn, inh) {
                    return match;
                }),
                r.opt(":"),
                "=",
                r.action(parser, function(match, syn, inh) {
                    if(macroEnv[inh]) {
                        throw new Error("Macro has already defined: " + inh);
                    }
                    macroEnv[inh] = syn;
                }));

        var allParser = r.concat(
            r.zeroOrMore(r.concat(macro, /\r\n|\r|\n/)),
            r.choice(
                r.concat("`", r.action(parser, function(match, syn, inh) {
                    log(serializeJson(substDemacro(betaTransformAll(syn))));
                    return "a";
                })),
                r.action(parser, function(match, syn, inh) {
                    log(evalJson(syn));
                    return "a";
                })
            )
        );
        var cons, objFalse;

        function makeList(anArray, objNil) {
            function make(i) {
                if(i < anArray.length) {
                    return [[substMacro(cons), anArray[i]], make(i + 1)];
                } else {
                    return objNil;
                }
            }
            return make(0);
        }

        function currying(args, body, i) {
            if(i < args.length - 1) {
                return {
                    "function": {
                        args: [args[i]],
                        begin: [currying(args, body, i + 1)]
                    }
                };
            } else {
                return {
                    "function": {
                        args: [args[i]],
                        begin: body
                    }
                };
            }
        }

        function substMacro(body, varNameBuilder) {
            var substVars = {},
                varNameBld = varNameBuilder ? varNameBuilder : defaultVarName;

            function defaultVarName() {
                return "v#" + count++;
            }

            function subst(body) {
                var varName,
                    result = [],
                    i;

                if(body["function"]) {
                    varName = varNameBld();
                    substVars[body["function"].args[0]] = varName;
                    return {
                        "function": {
                            args: [varName],
                            begin: subst(body["function"].begin)
                        }
                    };
                } else if(typeof body === "string") {
                    if(substVars[body]) {
                        return substVars[body];
                    } else {
                        return body;
                    }
                } else if(isArray(body)) {
                    for(i = 0; i < body.length; i++) {
                        result.push(subst(body[i]));
                    }
                    return result;
                } else {
                    return body;
                }
            }
            return subst(body);
        }

        function substDemacro(body) {
            var freeVars = [],
                count = "a".charCodeAt(0),
                countEnd = "z".charCodeAt(0);

            function collectFreeVariable(body) {
                var i;

                if(isArray(body)) {
                    for(i = 0; i < body.length; i++) {
                        collectFreeVariable(body[i]);
                    }
                } else if(body["function"]) {
                    collectFreeVariable(body["function"]["begin"]);
                } else if(typeof body === "string" && body.length === 1) {
                    freeVars[body.charCodeAt(0)] = 1;
                }
            }

            function varNameBuilder() {
                var result;

                for(; freeVars[count]; count++) {}
                if(count > countEnd) {
                    throw new Error("Too many variables");
                }
                result = String.fromCharCode(count);
                count++;
                return result;
            }

            collectFreeVariable(body);
            return substMacro(body, varNameBuilder);
        }

        function defmacro(def) {
            macro(def, 0, 0);
        }

        if(!isInteger(maxnum) || maxnum < 0) {
            throw new Error("Invalid max number");
        }

        defmacro("S = ^xyz.xz(yz)");
        defmacro("K = ^xy.x");
        defmacro("I = ^x.x");
        defmacro("T = ^xy.x");
        defmacro("F = ^xy.y");
        defmacro("Cons = ^cdf.fcd");
        defmacro("Car = ^p.pT");
        defmacro("Cdr = ^p.pF");
        defmacro("Isnil = ^x.x(^abc.F)T");
        cons = macroEnv["Cons"];
        objFalse = macroEnv["F"];

        function betaTransformAll(func) {
            var before,
                after = func;

            do {
                before = after;
                after = betaTransformAll1(after);
            } while(!isEqual(before, after));
            return after;
        }

        function betaTransformAll1(func) {
            var i,
                result = [];

            if(isArray(func)) {
                if(func[0] === "print") {
                    return func;
                } else if(func[0]["function"]) {
                    return betaTransform(func[0], betaTransformAll1(func[1]));
                } else {
                    return [betaTransformAll1(func[0]), betaTransformAll1(func[1])];
                }
            } else if(func["function"]) {
                for(i = 0; i < func["function"]["begin"].length; i++) {
                    result.push(betaTransformAll1(func["function"]["begin"][i]));
                }
                return {
                    "function": {
                        args: [func["function"].args[0]],
                        begin: result
                    }
                };
            } else {
                return func;
            }
        }

        function betaTransform(func, arg) {
            var i,
                result;

            function betaTrans(func, arg, name) {
                var i,
                    result = [];

                if(isArray(func)) {
                    if(func[0] === "print") {
                        return func;
                    } else {
                        return [betaTrans(func[0], arg, name), betaTrans(func[1], arg, name)];
                    }
                } else if(func["function"]) {
                    for(i = 0; i < func["function"]["begin"].length; i++) {
                        result.push(betaTrans(func["function"]["begin"][i], arg, name));
                    }
                    return {
                        "function": {
                            args: [func["function"].args[0]],
                            begin: result
                        }
                    };
                } else if(func === name) {
                    return arg;
                } else {
                    return func;
                }
            }

            if(func["function"]) {
                for(i = 0; i < func["function"]["begin"].length; i++) {
                    result = betaTrans(func["function"]["begin"][i], arg, func["function"].args[0]);
                }
                return result;
            } else {
                return func;
            }
        }

        function serializeJson(json) {
            var result = "",
                varnames = "",
                beginClause;

            function jsonarg(arg) {
                if(isArray(arg)) {
                    result += "(" + serializeJson(arg) + ")";
                } else {
                    result += arg;
                }
            }

            if(isArray(json)) {
                jsonarg(json[0]);
                jsonarg(json[1]);
            } else if(json["function"]) {
                varnames = json["function"].args[0];
                beginClause = json["function"]["begin"][0];
                for(; beginClause["function"]; beginClause = beginClause["function"]["begin"][0]) {
                    varnames += beginClause["function"].args[0];
                }
                result += "^" + varnames + "." + serializeJson(beginClause);
            } else {
                result += json;
            }
            return result;
        }

        function evalJson(json) {
            function evalJson1(json, env) {
                if(isArray(json)) {
                    if(json[0] === "print") {
                        log(json[1].q);
                        return null;
                    } else {
                        return (evalJson1(json[0], env))(evalJson1(json[1], env));
                    }
                } else if(json["function"]) {
                    return closure(json["function"]["begin"], json["function"].args[0], env);
                } else if(typeof json === "string") {
                    return env(json);
                } else {
                    throw new Error("Internal Error");
                }
            }

            function closure(body, name, env) {
                return function(arg) {
                    var i,
                        result,
                        envnew = createEnv(env, name, arg);

                    for(i = 0; i < body.length; i++) {
                        result = evalJson1(body[i], envnew);
                    }
                    if(!result) {
                        throw new Error("Internal Error");
                    }
                    return result;
                };
            }

            function createEnv(env, bound, arg) {
                return function(name) {
                    return name === bound ? arg : env(name);
                };
            }

            return evalJson1(json, function(name) {
                throw new Error("Variable is not bound: " + name);
            });
        }

        return {
            oneline: function(prog) {
                var result;

                if(!!(result = macro(prog, 0, []))) {
                    return "Macro Defined.";
                } else if(!!(result = parser(prog, 0, []))) {
                    evalJson(result.attr);
                    return "Done.";
                } else {
                    return "Syntax error";
                }
            },

            browser: function(prog) {
                var result = allParser(prog, 0, []);
                if(result) {
                    return result.attr;
                } else {
                    throw new Error("Syntax error");
                }
            }
        };
    }

    if(typeof module !== "undefined" && module.exports) {
        module.exports = Lambda;
    } else {
        root["Oiseau"] = Lambda;
    }
})(this);

