import {mkdir,copyFile,writeFile,readFile,lstat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PUBLIC_FILES=Object.freeze([
  'index.html','style.css','app.mjs','views.mjs','engine.mjs','data.mjs','field.mjs','scenario.mjs','glossary.mjs','labels.mjs','map.mjs','print.mjs','LICENSE',
  'data/crops.json','data/demo-power-daily.json','data/demo-power-monthly.json','data/demo-satellite.json',
]);
const root=fileURLToPath(new URL('../',import.meta.url));

/** Fresh output directory only. Source files are allowlisted; no repo/history/secrets are copied. */
export async function packageSite(target=resolve(root,'.pages-dist'),commit=process.env.GITHUB_SHA??null) {
  const output=resolve(target);
  await mkdir(output);
  for(const name of PUBLIC_FILES) {
    const source=resolve(root,name),destination=resolve(output,name);
    if(!(await lstat(source)).isFile())throw new Error(`Expected a regular public file: ${name}`);
    await mkdir(dirname(destination),{recursive:true});
    await copyFile(source,destination);
  }
  const manifest=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
  await writeFile(resolve(output,'build-info.json'),JSON.stringify({version:manifest.version,commit},null,2)+'\n');
  await writeFile(resolve(output,'.nojekyll'),'');
  return output;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  console.log(`Public app packaged at ${await packageSite()}`);
}
