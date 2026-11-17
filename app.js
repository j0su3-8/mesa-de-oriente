/* Mesa de Oriente · versión 2 · sin librerías externas */
(()=>{'use strict';
const D=window.MESA_DATA;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const e=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=Object.fromEntries([...D.recipes,...D.bases].map(r=>[r.id,r]));
const state={section:'inicio',selected:0,lastToday:-1,kitchen:false,filter:'todos',shoppingPending:false};
const store={get(k,def=[]){try{const v=JSON.parse(localStorage.getItem(k));return v===null?def:v;}catch(_){return def;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
function gtDate(){const pts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const p={};pts.forEach(x=>{if(x.type!=='literal')p[x.type]=+x.value});return new Date(Date.UTC(p.year,p.month-1,p.day));}
function dateLabel(date){return new Intl.DateTimeFormat('es-GT',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'}).format(date);}
function todayIndex(){return gtDate().getUTCDay()};
function nextIndex(i){return (i+1)%7};
function mealsForDay(day){const w=D.week[day];return [byId[w.breakfast],byId[w.lunch],byId[w.dinner]];}
function card(r){return `<article class="meal-card"><div class="meal-picture"><img src="${e(r.image)}" alt="Ilustración de ${e(r.title)}" loading="lazy"><span class="meal-time">${e(r.time)}</span></div><div class="meal-body"><span class="meal-meta">${e(r.kind)}</span><h3>${e(r.title)}</h3><p class="meal-desc">${e(r.short)}</p><div class="macro"><span>Proteína aproximada por persona</span><strong>👨 ${r.protein?.[0]||'—'} g · 👩 ${r.protein?.[1]||'—'} g</strong></div><button class="btn alt" data-recipe="${e(r.id)}">Ingredientes y pasos →</button></div></article>`;}
function renderToday(){const i=todayIndex(),n=nextIndex(i);state.lastToday=i;
 $('#nowDate').textContent=dateLabel(gtDate());$('#todayHeading').textContent='Hoy, '+dateLabel(gtDate());$('#mealsTitle').textContent='Tus platos de '+D.days[i].toLowerCase();$('#todayMeals').innerHTML=mealsForDay(i).map(card).join('');
 $('#tomorrowHeading').textContent='Mañana, '+D.days[n].toLowerCase();$('#tomorrowImage').src=byId[D.week[n].lunch].image;
 $('#tomorrowLines').innerHTML=mealsForDay(n).map((r,j)=>`<div class="next-line"><span>${['🍳','🍲','🌙'][j]}</span><span><b>${e(r.kind)}</b>${e(r.title)}</span></div>`).join('');
}
function renderWeek(){const i=state.selected;
 $('#weekButtons').innerHTML=D.days.map((n,j)=>`<button class="day-chip ${i===j?'active':''}" data-day="${j}">${n}</button>`).join('');
 const meals=mealsForDay(i);let m0=meals.reduce((s,r)=>s+r.protein[0],0),m1=meals.reduce((s,r)=>s+r.protein[1],0);
 $('#weekContent').innerHTML=`<div class="day-extras"><span class="mini-tag">👨 ≈ ${m0} g de proteína</span><span class="mini-tag">👩 ≈ ${m1} g de proteína</span><span class="mini-tag">Las cantidades corresponden a 2 personas</span></div><div class="week-cards">${meals.map(r=>`<article class="week-detail"><img src="${e(r.image)}" alt="Plato de ${e(r.title)}"><span class="eyebrow">${e(r.kind)}</span><h3>${e(r.title)}</h3><p>${e(r.short)}</p><button class="btn alt" data-recipe="${e(r.id)}">Ver ingredientes y receta →</button></article>`).join('')}</div><div class="note-banner">☘ <div><b>Organización:</b> ${e(D.week[i].note)}</div></div>`;
}
function buildTotals(){const req={};const usedBy={};
 for(const w of D.week){for(const slot of ['breakfast','lunch','dinner']){const r=byId[w[slot]];for(const it of r.ingredients){req[it.key]=(req[it.key]||0)+it.qty;(usedBy[it.key]??=new Set()).add(D.days[w.day]+' · '+r.kind);}}}
 for(const r of D.bases){for(const it of r.ingredients){req[it.key]=(req[it.key]||0)+it.qty;(usedBy[it.key]??=new Set()).add('Preparación base: '+r.title);}}
 return {req,usedBy};
}
const tally=buildTotals();
function fmt(q){return (Math.round(q*100)/100).toLocaleString('es-GT',{maximumFractionDigits:2})};
function measure(q,unit){const plural={'unidad':['unidad','unidades'],'diente':['diente','dientes'],'hoja':['hoja','hojas'],'taza':['taza','tazas'],'cda':['cda.','cdas.'],'cdta':['cdta.','cdtas.'],'paquete':['paquete','paquetes']};if(q>=1000&&unit==='g')return fmt(q/1000)+' kg';if(unit==='g'||unit==='ml')return fmt(q)+' '+unit;return fmt(q)+' '+(plural[unit]?.[q===1?0:1]||unit)}
const groupOrder=['Proteínas','Granos y tortillas','Verduras y frutas','Condimentos y hierbas'];
function renderShopping(){const checked=store.get('mesa-shopping-v2');const items=Object.entries(D.catalog).filter(([key,v])=>v.group!=='Preparado'&&(tally.req[key]||key==='sal'));const done=items.filter(([key])=>checked.includes(key)).length;
 $('#shoppingStatus').textContent=done+' de '+items.length+' productos marcados';$('#shoppingProgress').style.width=Math.round(done/items.length*100)+'%';
 let html='';for(const group of groupOrder){let it=items.filter(([key,v])=>v.group===group);if(state.shoppingPending)it=it.filter(([key])=>!checked.includes(key));if(it.length===0)continue;
 html+=`<div class="category-head"><span>${e(group)}</span><span class="subtle">${it.length} artículos</span></div>`;
 for(const [key,v] of it){const isChecked=checked.includes(key),needed=tally.req[key]||0;html+=`<label class="check-row shop-row ${isChecked?'done':''}"><input type="checkbox" data-buy="${e(key)}" ${isChecked?'checked':''} aria-label="Marcar ${e(v.name)}"><span><strong>${e(v.name)}</strong><small class="purchase-detail">${needed?`Recetas: ${e(measure(needed,v.unit))}. `:'Despensa: si no tienen. '}${e(v.note)}</small></span><span class="qty"><b>${e(measure(v.buy,v.unit))}</b></span></label>`;}
 }
 if(state.shoppingPending&&!html)html='<p class="empty">¡Ya está todo marcado! Cambia el filtro para ver la lista completa.</p>';
 $('#shoppingList').innerHTML=html;
 $('#buySummary').textContent=`Cantidades calculadas sumando las 21 comidas de ambos y las cuatro preparaciones base. Por ejemplo: ${fmt(tally.req.tomate)} tomates en recetas → comprar ${D.catalog.tomate.buy}; ${fmt(tally.req.cebolla)} cebollas → comprar ${D.catalog.cebolla.buy}.`;
 $('#shoppingOptional').innerHTML=D.optionalShopping.map(it=>`<div class="extra-line"><b>${e(it.name)}</b><span>${e(it.qty)}</span></div>`).join('');
 $('#pendingToggle').textContent=state.shoppingPending?'Ver toda la lista':'Solo faltantes';
}
function shoppingText(){const out=['MESA DE ORIENTE · COMPRAS PARA 2 · DOMINGO A SÁBADO'];for(const group of groupOrder){out.push('\n'+group.toUpperCase());for(const [key,v] of Object.entries(D.catalog)){if(v.group!==group)continue;if(!tally.req[key]&&key!=='sal')continue;out.push(`☐ ${v.name}: comprar ${measure(v.buy,v.unit)} (recetas: ${tally.req[key]?measure(tally.req[key],v.unit):'si hace falta'})`);}}out.push('\nOPCIONAL');for(const it of D.optionalShopping)out.push('☐ '+it.name+': '+it.qty);return out.join('\n');}
function renderRecipes(){let all=[...D.recipes,...D.bases];const f=state.filter;if(f==='bases')all=D.bases;else if(f!=='todos')all=all.filter(r=>r.kind===f);
 const needle=($('#recipeSearch').value||'').trim().toLowerCase();if(needle)all=all.filter(r=>(r.title+' '+r.short+' '+r.ingredients.map(i=>D.catalog[i.key].name).join(' ')).toLowerCase().includes(needle));
 $('#recipesCount').textContent=`${all.length} recetas disponibles`;
 $('#recipeGallery').innerHTML=all.map(r=>`<article class="recipe-tile"><img src="${e(r.image)}" alt="Ilustración de ${e(r.title)}" loading="lazy"><div><span class="eyebrow">${e(r.kind)} · ${e(r.time)}</span><h3>${e(r.title)}</h3><p>${e(r.short)}</p><button class="btn alt" data-recipe="${e(r.id)}">Abrir receta detallada →</button></div></article>`).join('')||'<p class="empty">No se encontraron recetas con ese ingrediente o nombre.</p>';
 $$('.recipe-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
}
const tasks=[
 ['Revisar todos los ingredientes','Confirmar tomates, cebollas, ajos, limones y hierbas antes de encender la estufa.'],
 ['Remojar frijoles y garbanzos','Opcional para frijoles, recomendado para garbanzos: durante 8–12 h en refrigerador.'],
 ['Cocer frijoles','Preparar 2.3 kg secos por tandas; guardar porciones de ¾ y 1 taza.'],
 ['Cocer pollo base','Preparar 4.2 kg crudos, desmenuzar y pesar 2,770 g cocidos en bolsas.'],
 ['Cocer lentejas y garbanzos','Separar 3 tazas cocidas de lentejas y 1 taza de garbanzos.'],
 ['Porcionar queso y huevos','Queso para desayuno y cena; huevos cocidos para oficina si lo prefieren.'],
 ['Separar proteínas frescas','350 g de pollo crudo para lunes y 350 g para sábado; pescado para miércoles; res para viernes. Congelar lo que no se use pronto.'],
 ['Rotular y congelar','Escribir nombre del alimento y día de consumo en los recipientes destinados a jueves–sábado.'],
 ['Preparar loncheras seguras','Geles de hielo congelados, recipientes cerrados y refrigeración al llegar al trabajo.']
];
function renderPrep(){const done=store.get('mesa-prep-v2');$('#prepStatus').textContent=done.length+' de '+tasks.length+' tareas terminadas';$('#prepProgress').style.width=Math.round(done.length/tasks.length*100)+'%';
 $('#prepList').innerHTML=tasks.map((t,i)=>`<label class="prep-step"><input type="checkbox" data-task="${i}" ${done.includes(i)?'checked':''}><div><h4>${e(t[0])}</h4><p>${e(t[1])}</p></div></label>`).join('');
 $('#prepBases').innerHTML=D.bases.map(r=>`<div class="prep-card"><h3>${e(r.title)}</h3><p>${e(r.short)}<br><strong>${e(r.yieldinfo)}</strong></p><button class="btn alt sm" data-recipe="${e(r.id)}">Ver los ${r.steps.length} pasos completos</button></div>`).join('');
}
function setSection(n){state.section=n;$$('.section').forEach(s=>s.classList.toggle('active',s.id===n));$$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===n));if(n==='semana')renderWeek();if(n==='recetario')renderRecipes();if(n==='compras')renderShopping();if(n==='preparacion')renderPrep();window.scrollTo(0,0);}
function openRecipe(id){const r=byId[id];if(!r)return;
 $('#modalImage').src=r.image;$('#modalLabel').textContent=r.kind+' · '+r.time;$('#modalTitle').textContent=r.title;$('#modalDesc').textContent=r.short;
 $('#modalInfo').innerHTML=`<span class="mini-tag">${r.kind==='Preparación base'?'Preparación en tandas':'Rinde 2 personas'}</span><span class="mini-tag">⏱ ${e(r.time)}</span>${r.protein?`<span class="mini-tag">👨 ≈ ${r.protein[0]} g · 👩 ≈ ${r.protein[1]} g de proteína</span>`:''}`;
 $('#modalIngredients').innerHTML=r.ingredients.map(it=>`<li><b>${e(it.label)}</b>${D.catalog[it.key].group==='Preparado'?` <span class="prepped">(preparado antes)</span>`:''}</li>`).join('');
 const split=r.servings?.length?`<h3 class="subheading">Cómo repartir los platos</h3><table class="modal-table"><thead><tr><th>Porción</th><th>Tú</th><th>Tu esposa</th></tr></thead><tbody>${r.servings.map(row=>`<tr><td>${e(row[0])}</td><td>${e(row[1])}</td><td>${e(row[2])}</td></tr>`).join('')}</tbody></table>`:'';
 $('#modalPortions').innerHTML=split;
 $('#modalSteps').innerHTML=r.steps.map((st,i)=>`<li><span class="stepnum">${i+1}</span><p>${e(st)}</p></li>`).join('');
 $('#modalTip').textContent=r.tip||r.yieldinfo||'';
 const keys=r.ingredients.map(it=>it.key),bases=[];if(keys.includes('frijol_cocido'))bases.push('base_frijoles');if(keys.includes('pollo_cocido'))bases.push('base_pollo');if(keys.includes('lenteja_cocida'))bases.push('base_lentejas');if(keys.includes('garbanzo_cocido'))bases.push('base_garbanzos');
 $('#modalRelated').innerHTML=bases.length?`<h3 class="subheading">Preparaciones previas necesarias</h3><div class="related-buttons">${bases.map(id=>`<button class="btn ghost sm" data-recipe="${id}">${e(byId[id].title)} →</button>`).join('')}</div>`:'';
 $('#overlay').classList.add('open');$('#overlay').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modalBox').scrollTop=0;$('#closeModal').focus();
}
function closeModal(){$('#overlay').classList.remove('open');$('#overlay').setAttribute('aria-hidden','true');document.body.style.overflow='';}
function reset(key,render){if(confirm('¿Reiniciar esta lista de verificación?')){store.set(key,[]);render();}}
async function copyText(s){try{await navigator.clipboard.writeText(s);alert('Lista copiada.');}catch(_){const ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');alert('Lista copiada.')}catch(err){alert('No se pudo copiar automáticamente; usa la opción imprimir.')}ta.remove();}}
function init(){state.selected=todayIndex();renderToday();renderWeek();renderShopping();renderPrep();renderRecipes();
 $('#sourcesList').innerHTML=D.sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)}</a></li>`).join('');
 document.addEventListener('click',ev=>{const n=ev.target.closest('[data-section]');if(n){setSection(n.dataset.section);return;}const w=ev.target.closest('[data-day]');if(w){state.selected=+w.dataset.day;renderWeek();return;}const r=ev.target.closest('[data-recipe]');if(r){openRecipe(r.dataset.recipe);return;}const f=ev.target.closest('[data-filter]');if(f){state.filter=f.dataset.filter;renderRecipes();}});
 document.addEventListener('change',ev=>{const b=ev.target.closest('[data-buy]');if(b){let a=store.get('mesa-shopping-v2');a=ev.target.checked?[...new Set([...a,b.dataset.buy])]:a.filter(x=>x!==b.dataset.buy);store.set('mesa-shopping-v2',a);renderShopping();}const t=ev.target.closest('[data-task]');if(t){let a=store.get('mesa-prep-v2');const x=+t.dataset.task;a=ev.target.checked?[...new Set([...a,x])]:a.filter(y=>y!==x);store.set('mesa-prep-v2',a);renderPrep();}});
 $('#recipeSearch').addEventListener('input',renderRecipes);
 $('#pendingToggle').addEventListener('click',()=>{state.shoppingPending=!state.shoppingPending;renderShopping();});
 $('#resetShopping').addEventListener('click',()=>reset('mesa-shopping-v2',renderShopping));
 $('#resetPrep').addEventListener('click',()=>reset('mesa-prep-v2',renderPrep));
 $('#copyShopping').addEventListener('click',()=>copyText(shoppingText()));
 $('#printShopping').addEventListener('click',()=>{setSection('compras');window.print();});
 $('#seeTomorrow').addEventListener('click',()=>{state.selected=nextIndex(todayIndex());setSection('semana');});
 $('#backToday').addEventListener('click',()=>{state.selected=todayIndex();setSection('inicio');});
 $('#kitchenBtn').addEventListener('click',()=>{state.kitchen=!state.kitchen;document.body.classList.toggle('kitchen',state.kitchen);$('#kitchenBtn span').textContent=state.kitchen?'Vista normal':'Modo cocina';});
 $('#closeModal').addEventListener('click',closeModal);$('#overlay').addEventListener('click',ev=>{if(ev.target.id==='overlay')closeModal();});document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeModal();});
 setInterval(()=>{if(todayIndex()!==state.lastToday){renderToday();if(state.section==='semana')renderWeek();}},60000);
}
init();
})();
