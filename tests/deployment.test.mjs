import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {PUBLIC_FILES,packageSite} from '../scripts/package-site.mjs';
test('Pages artifact includes every runtime import and public dataset while excluding repository, tests and private files',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'terraplan-package-test-')),target=join(parent,'site');
 try {
  await packageSite(target,'test-commit');
  const built=JSON.parse(await readFile(join(target,'build-info.json'),'utf8'));assert.equal(built.commit,'test-commit');
  for(const file of PUBLIC_FILES)await access(join(target,file));
  for(const forbidden of ['.git','AGENTS.md','tests','.github','.env','scripts','README.md'])await assert.rejects(access(join(target,forbidden)));
  const data=await readdir(join(target,'data'));assert.equal(data.length,4);
  for(const file of PUBLIC_FILES.filter(file=>file.endsWith('.mjs'))){
   const source=await readFile(join(target,file),'utf8');
   for(const match of source.matchAll(/from\s+['"](.+?)['"]/g)){assert(match[1].startsWith('./'));await access(resolve(target,match[1]));}
  }
  await assert.rejects(packageSite(target));assert.equal(JSON.parse(await readFile(join(target,'build-info.json'),'utf8')).commit,'test-commit');
 }finally{
  const checked=resolve(parent),temp=resolve(tmpdir())+sep;
  if(!checked.startsWith(temp) || !checked.slice(temp.length).startsWith('terraplan-package-test-'))throw Error('Unexpected cleanup path');
  await rm(checked,{recursive:true,force:true});
 }
});
