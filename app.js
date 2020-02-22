var oiseau = require("./oiseau.js"),
    oiseauEnv = oiseau(),
    rl = require("readline"),
    rlif = rl.createInterface({ input: process.stdin, output: process.stdout });

function repl() {
    rlif.question("> ", function(answer) {
        var result;

        if(answer !== "exit") {
            try {
                result = oiseauEnv.oneline(answer);
                console.log(oiseauEnv.serialize(result));
            } catch(e) {
                if(/Oiseau:/.test(e.message)) {
                    console.log(e.message);
                } else {
                    throw e;
                }
            }
            repl();
        } else {
            console.log("Exit.");
            process.exit(0);
        }
    });
}

console.log("Oiseau Ver. 0.1.0");
repl();

