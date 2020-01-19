var oiseau = require("./oiseau.js"),
    oiseauEnv = oiseau(),
    rl = require("readline"),
    rlif = rl.createInterface({ input: process.stdin, output: process.stdout });

function repl() {
    rlif.question("> ", function(answer) {
        var result;

        if(answer !== "exit") {
            result = oiseauEnv.oneline(answer);
            console.log(result);
            repl();
        } else {
            console.log("Exit.");
            process.exit(0);
        }
    });
}

console.log("Oiseau Ver. 0.0.0");
repl();

