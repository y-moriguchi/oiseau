function getOiseauEnv() {
    var env = Oiseau({ log: log }),
        log = "";

    function log(message) {
        log = message;
    }

    return {
        eval: function(prog, value) {
            expect(env.serialize(env.oneline(prog))).toBe(value);
        },
        log: function(value) {
            expect(log).toBe(value);
        }
    };
}

describe("Oiseau", function() {
    describe("Syntax", function() {
        it("simple lambda", function() {
            var oi = getOiseauEnv();

            oi.eval("^x.x", "^a.a");
            oi.eval("λx1x27.x1", "^ab.a");
        });

        it("apply", function() {
            var oi = getOiseauEnv();

            oi.eval("(^x.x)y", "y");
        });

        it("macro definition and expansion", function() {
            var oi = getOiseauEnv();

            oi.eval("S27 := SKK", "^ab.a");
            oi.eval("True = ^xy.x", "^ab.a");
            oi.eval("[This is false] = ^xy.y", "^ab.a");
            oi.eval("S", "^abc.ac(bc)");
            oi.eval("S27", "^a.a");
            oi.eval("[True]", "^ab.a");
            oi.eval("[True]S27", "^ab.b");
            oi.eval("[True][True]", "^abc.b");
            oi.eval("[True] [True]", "^abc.b");
            oi.eval("[This is false]", "^ab.b");
            oi.eval("S* = ^xyz.x", "^ab.a");
            oi.eval("S*", "^abc.a");
        });

        it("List", function() {
            var oi = getOiseauEnv();

            oi.eval("[[T]]", "^a.a(^bc.b)(^de.e)");
            oi.eval("[[T|T]]", "^a.a(^bc.b)(^de.d)");
            oi.eval("[[II]]", "^a.a(^b.b)(^c.c(^d.d)(^ef.f))");
            oi.eval("[[II|T]]", "^a.a(^b.b)(^c.c(^d.d)(^ef.e))");
        });

        it("Church number", function() {
            var oi = getOiseauEnv();

            oi.eval("0", "^ab.b");
            oi.eval("1", "^ab.ab");
            oi.eval("2", "^ab.a(ab)");
            oi.eval("3", "^ab.a(a(ab))");
        });

        it("eval (strict) and output string", function() {
            var oi = getOiseauEnv();

            oi.eval("`<Hello, world>I", "^ab.a");
            oi.log("Hello, world");
        });

        it("eval (non strict)", function() {
            var oi = getOiseauEnv();

            oi.eval("``<Hello, world>I", "^ab.a");
            oi.log("Hello, world");
        });

        it("equivalent", function() {
            var oi = getOiseauEnv();

            oi.eval("SKK == I", "^ab.a");
            oi.eval("S == K", "^ab.b");
        });

        it("currying", function() {
            var oi = getOiseauEnv();

            oi.eval("^xyz.xyz", "^abc.abc");
        });
    });

    describe("Beta transformation", function() {
        it("function 1", function() {
            var oi = getOiseauEnv();

            oi.eval("(^x.x)T", "^ab.a");
            oi.eval("(^x.x)<1>", "^a.a");
            oi.eval("x", "x");
        });

        it("function 2", function() {
            var oi = getOiseauEnv();

            oi.eval("^x.(^x.x)T", "^abc.b");
            oi.eval("^x.(^x.x)<1>", "^ab.b");
            oi.eval("^x.(^x.x)y", "^a.y");
            oi.eval("^x.(^x.y)x", "^a.y");
        });

        it("function 3", function() {
            var oi = getOiseauEnv();

            oi.eval("^x.(^x.x)(^x.x)(^x.x)T", "^abc.b");
            oi.eval("^x.(^x.x)(^x.x)<I>(^x.x)T", "^abc.b");
            oi.eval("^x.(^x.(^x.x)(^x.x)(^x.x))", "^abc.c");
            oi.eval("^x.(^x.(^x.x)(^x.x)(^x.x))(^x.x)", "^ab.b");
        });
    });

    describe("serialize", function() {
        it("variables", function() {
            var oi = getOiseauEnv();

            oi.eval("^b1b2b3b4b5b6b7b8b9b10b11b12b13b14b15b16b17b18b19b20b21b22b23b24b25b26b27.b1", "^abcdefghijklmnopqrstuvwxyza1.a");
            oi.eval("^xyz.a", "^bcd.a");
        });

        it("apply notation", function() {
            var oi = getOiseauEnv();

            oi.eval("^xyz.zxy", "^abc.cab");
            oi.eval("^xyz.x(yz)", "^abc.a(bc)");
            oi.eval("2", "^ab.a(ab)");
        });

        it("function", function() {
            var oi = getOiseauEnv();

            oi.eval("^x.x(^y.y)(^z.z)", "^a.a(^b.b)(^c.c)");
            oi.eval("^x.x(^y.y(^z.z))", "^a.a(^b.b(^c.c))");
        });
    });

    describe("evaluator", function() {
        it("strict", function() {
            var oi = getOiseauEnv();

            oi.eval("Z = ^f.(^g.gg)(^px.f(pp)x)", "^ab.a");
            oi.eval("Just = ^zxy.xz", "^ab.a");
            oi.eval("Get = ^xy.xyI", "^ab.a");
            oi.eval("Mt = ^x.([Isnil]x)F(([Car]x)([Just]([Cdr]x))F)", "^ab.a");
            oi.eval("Mf = ^x.([Isnil]x)F(([Car]x)F([Just]([Cdr]x)))", "^ab.a");
            oi.eval("Concat = ^xyz.(xz)yF", "^ab.a");
            oi.eval("Choice = ^xyz.(xz)[Just](yz)", "^ab.a");
            oi.eval("Ma = Z(^a.[Choice]([Concat][Mt]a)[Mf])", "^ab.a");
            oi.eval("`[Get]([Ma][[TTTT]])<OK>", "^ab.a");
            oi.log("Macro Defined.");
            oi.eval("`[Get]([Ma][[TTTF]])<OK>", "^ab.a");
            oi.log("OK");
        });

        it("nonstrict", function() {
            var oi = getOiseauEnv();

            oi.eval("Y = ^f.(^x.f(xx))(^x.f(xx))", "^ab.a");
            oi.eval("Just = ^zxy.xz", "^ab.a");
            oi.eval("Get = ^xy.xyI", "^ab.a");
            oi.eval("Mt = ^x.([Isnil]x)F(([Car]x)([Just]([Cdr]x))F)", "^ab.a");
            oi.eval("Mf = ^x.([Isnil]x)F(([Car]x)F([Just]([Cdr]x)))", "^ab.a");
            oi.eval("Concat = ^xyz.(xz)yF", "^ab.a");
            oi.eval("Choice = ^xyz.(xz)[Just](yz)", "^ab.a");
            oi.eval("Ma = Y(^a.[Choice]([Concat][Mt]a)[Mf])", "^ab.a");
            oi.eval("``[Get]([Ma][[TTTT]])<OK>", "^ab.a");
            oi.log("Macro Defined.");
            oi.eval("``[Get]([Ma][[TTTF]])<OK>", "^ab.a");
            oi.log("OK");
        });
    });
});

