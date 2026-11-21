import test from "node:test";
import assert from "node:assert/strict";
import {CLASSES} from "../classes.js";
import {Build} from "../progression.js";
import {catalogs} from "../role-cards.js";

for (const job of CLASSES.filter(job=>catalogs[job.name])) {
  test(job.name+"职业池、进化前置和流派互斥",()=>{
    const b=new Build(42);
    b.job=job;
    const cards=catalogs[job.name], normal=cards.filter(c=>!c.needs), evolutions=cards.filter(c=>c.needs);
    assert.equal(normal.length,["swordsman","berserker"].includes(job.id)?16:20);
    const draft=b.draftAttributes();
    assert.equal(new Set(draft.map(c=>c.id)).size,4);
    assert.equal(draft.filter(c=>normal.some(n=>n.id===c.id)).length,3);
    const scene={hp:job.hp,maxHp:job.hp};
    assert.equal(b.apply(evolutions[0],scene),false);
    for(const card of normal)b.attributes[card.id]=card.max;
    const first=evolutions[0],other=evolutions[1];
    delete b.attributes[first.needs[0]];
    assert.ok(b.apply(normal.find(c=>c.id===first.needs[0]),scene));
    assert.equal(b.route,first.id);
    assert.ok(b.draftAttributes().every(c=>!c.route || c.route===first.id));
    b.attributes[first.needs[0]]=3;
    assert.ok(b.apply(first,scene));
    assert.equal(b.apply(other,scene),false);
    assert.ok(!b.apply(evolutions[2],scene));
    assert.ok(b.draftAttributes().every(c=>!cards.some(k=>k.id===c.id)));
  });
}
