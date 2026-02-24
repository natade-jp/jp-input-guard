import NTFile from "ntfile";

NTFile.exec("npx tsc -p ./scripts/tsconfig.json");
NTFile.exec('npx rollup -c "./scripts/rollup.config.js"');
NTFile.deleteDirectory("./tmp");

NTFile.copy("./dist/esm/text-input-guard.min.js", "./docs/public/demo/lib/text-input-guard.min.js");
