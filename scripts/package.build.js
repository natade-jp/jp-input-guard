import NTFile from "ntfile";

NTFile.exec("npx tsc -p ./scripts/tsconfig.json");
NTFile.exec('npx rollup -c "./scripts/rollup.config.js"');
NTFile.deleteDirectory("./tmp");
