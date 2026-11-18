const path=require('node:path');
const os=require('node:os');
try{module.exports=require('playwright')}
catch{module.exports=require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
