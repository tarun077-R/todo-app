import { createServer } from 'vite';
const r = await createServer({ root: '.', configFile: 'vitest.config.js' });
await r.pluginContainer.buildStart();
const mod = await r.moduleGraph.getModuleById('src/pages/__tests__/App.test.jsx');
console.log('test mod:', mod && mod.id);
const res = await r.moduleGraph.resolveId('../../../App', mod, {});
console.log('resolve result:', res && res.id);
await r.close();
