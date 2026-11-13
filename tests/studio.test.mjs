import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CROP_PHOTOS} from '../photos.mjs';
import {FIELD_CHOICES} from '../field.mjs';
import {renderWelcome} from '../views.mjs';
test('every representative crop image has attribution, a source and licence, and a valid local JPEG instead of an HTML error response',async()=>{
 assert.deepEqual(Object.keys(CROP_PHOTOS).sort(),FIELD_CHOICES.crop.map(([id])=>id).sort());
 for(const photo of Object.values(CROP_PHOTOS)){
  assert.match(photo.url,/^\.\/assets\/crops\/[a-z]+\.jpg$/);assert(photo.credit.trim());assert.match(photo.licence,/^(CC BY|CC0|Public domain)/);
  assert.match(photo.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.match(photo.licence_url,/^https:\/\//);
  const bytes=await readFile(new URL('../'+photo.url.slice(2),import.meta.url));assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert(bytes.length>5000);
  assert(!/papaver|blight|fungus|widodo/i.test(photo.source));
 }
});
test('the Studio entry opens the real planner and labels its controllable 3D scene as an illustration',()=>{
 const html=renderWelcome();assert.match(html,/data-field-canvas/);assert.match(html,/Use arrow keys/);assert.match(html,/data-scene-motion/);
 assert.match(html,/data-scene-action="reset"/);assert.match(html,/not NASA imagery or a crop-growth simulation/);
 assert.match(html,/data-load-demo/);assert.match(html,/data-navigate="\/field"/);assert.equal((html.match(/Representative .*? photograph/g)||[]).length,4);
 assert(!html.includes('<iframe'));assert(!html.includes('<script src='));
});
