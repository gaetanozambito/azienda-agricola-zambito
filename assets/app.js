'use strict';
const $ = id => document.getElementById(id);
const euro = n => new Intl.NumberFormat('it-IT', {style:'currency',currency:'EUR'}).format(n);
const safeText = (value, fallback='') => typeof value === 'string' ? value : fallback;
const digitsOnly = value => safeText(value).replace(/\D/g,'');
const isValidPhone = value => /^\d{8,15}$/.test(digitsOnly(value));
const safeImage = value => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const u = new URL(value, location.origin); return ['https:','http:'].includes(u.protocol) && u.origin === location.origin ? u.href : ''; }
  catch { return ''; }
};
const setText = (id, value) => { if ($(id)) $(id).textContent = value; };
const imgNode = (url, alt) => {const img = document.createElement('img');img.src=url;img.alt=alt;img.loading='lazy';return img;};
const waLink = (phone, message) => `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`;
const makeButton = (label, href, className='btn btn-dark') => {const a=document.createElement('a');a.textContent=label;a.className=className;a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
const oldPriceNode = product => {
  const old = Number(product.prezzo_precedente_eur);
  const current = Number(product.prezzo_eur);
  if (product.prezzo_precedente_eur == null || product.prezzo_precedente_eur === '' ||
      !Number.isFinite(old) || !Number.isFinite(current) || old <= current) return null;
  const del = document.createElement('del');
  del.className = 'previous-price';
  del.textContent = euro(old);
  del.setAttribute('aria-label', 'Prezzo precedente');
  return del;
};
const badge = label => {const b=document.createElement('span');b.className='cert-badge';b.textContent=label;return b;};
const certificateLabels = cert => [cert?.biologico === 'verificato' ? 'Biologico' : null, cert?.dop_val_di_mazara === 'verificato' ? 'DOP Val di Mazara' : null].filter(Boolean);
const addCertificates = (target, cert) => {target.replaceChildren();for(const label of certificateLabels(cert))target.append(badge(label));};
const productPlaceholder = (litri) => {const wrap=document.createElement('div');wrap.className='product-placeholder';const olive=document.createElement('span');olive.className='olive-symbol';olive.textContent='✳';const tin=document.createElement('div');tin.className='placeholder-tin';tin.append(olive);const name=document.createElement('strong');name.textContent='ZAMBITO';const size=document.createElement('span');size.textContent=`${litri} L`;tin.append(name,size);wrap.append(tin);return wrap;};
const makePhoto = (path, alt, liters) => {const url=safeImage(path);return url?imgNode(url,alt):productPlaceholder(liters);};
let currentCatalog = null, currentSite = null;
function showProduct(product){
  const dialog=$('product-dialog');const size=Number(product.litri);const price=Number(product.prezzo_eur);
  setText('dialog-title',safeText(product.nome,`Latta ${size} litri`));
  setText('dialog-description',safeText(product.descrizione));
  setText('dialog-price',Number.isFinite(price)?euro(price):'Prezzo su richiesta');
  const dialogOld = $('dialog-old-price');
  if (dialogOld) { dialogOld.replaceChildren(); const old = oldPriceNode(product); if (old) dialogOld.append(old); }
  setText('dialog-unit',size>0&&Number.isFinite(price)?`${euro(price/size)} al litro`: '');
  setText('dialog-availability',product.disponibile===false?'Disponibilità da verificare':'Disponibilità da confermare al momento della richiesta');
  addCertificates($('dialog-certifications'),currentCatalog.certificazioni);
  const main=$('dialog-main-image'),gallery=$('dialog-gallery');main.replaceChildren();gallery.replaceChildren();
  const photos=[product.immagine,...(Array.isArray(product.galleria)?product.galleria:[])].map(safeImage).filter(Boolean);
  const setMain = path => {main.replaceChildren(makePhoto(path,safeText(product.nome),size));};
  setMain(photos[0]||'');
  for(const [index,photo] of photos.entries()){
    const thumb=document.createElement('button');thumb.type='button';thumb.className='gallery-thumb';thumb.setAttribute('aria-label',`Mostra foto ${index+1}`);thumb.append(imgNode(photo,`Foto ${index+1}`));thumb.addEventListener('click',()=>setMain(photo));gallery.append(thumb);
  }
  const action=$('dialog-action');action.replaceChildren();
  if(isValidPhone(currentSite.whatsapp)){
    const msg=`Buongiorno, vorrei informazioni per ordinare ${safeText(product.nome,`Latta ${size} L`)} (${Number.isFinite(price)?euro(price):'prezzo da confermare'}). Potete indicarmi disponibilità e modalità di consegna?`;
    action.append(makeButton('Richiedi su WhatsApp ↗',waLink(currentSite.whatsapp,msg),'btn btn-gold'));
  }else{const p=document.createElement('p');p.className='contact-wait';p.textContent='Per gli ordini consulta la sezione Contatti.';action.append(p);}
  dialog.showModal();
}
function renderProducts(data,site){
  const list=Array.isArray(data.prodotti)?data.prodotti:[];
  const container=$('products');container.replaceChildren();
  if(!list.length){container.textContent='Nessun prodotto disponibile nel catalogo.';return;}
  for(const p of list){
    const size=Number(p.litri),price=Number(p.prezzo_eur);
    const card=document.createElement('article');card.className='product-card';
    const visual=document.createElement('button');visual.type='button';visual.className='product-image';visual.setAttribute('aria-label',`Apri scheda ${safeText(p.nome)}`);visual.append(makePhoto(p.immagine,safeText(p.nome),size));visual.addEventListener('click',()=>showProduct(p));
    if(p.in_evidenza){const ribbon=document.createElement('span');ribbon.className='ribbon';ribbon.textContent='IN EVIDENZA';visual.append(ribbon);}
    const body=document.createElement('div');body.className='product-body';
    const kicker=document.createElement('p');kicker.className='product-kicker';kicker.textContent='OLIO EXTRAVERGINE DI OLIVA';
    const name=document.createElement('h3');name.textContent=safeText(p.nome,`Latta ${size} litri`);
    const desc=document.createElement('p');desc.className='product-description';desc.textContent=safeText(p.descrizione);
    const row=document.createElement('div');row.className='product-price-row';const amount=document.createElement('strong');amount.textContent=Number.isFinite(price)?euro(price):'Su richiesta';const unit=document.createElement('span');unit.textContent=size>0&&Number.isFinite(price)?`${euro(price/size)}/L`:'';const previous=oldPriceNode(p);if(previous)row.append(previous);row.append(amount,unit);
    const actions=document.createElement('div');actions.className='product-actions';
    const details=document.createElement('button');details.className='text-button';details.textContent='Dettagli e foto ↗';details.addEventListener('click',()=>showProduct(p));actions.append(details);
    if(isValidPhone(site.whatsapp)){
      const msg=`Buongiorno, vorrei informazioni per ordinare ${safeText(p.nome,`Latta ${size} L`)} (${Number.isFinite(price)?euro(price):'prezzo da confermare'}). Potete indicarmi disponibilità e modalità di consegna?`;
      actions.append(makeButton('Richiedi ↗',waLink(site.whatsapp,msg),'small-wa'));
    }
    body.append(kicker,name,desc,row,actions);card.append(visual,body);container.append(card);
  }
}
function renderSite(site){
  setText('hero-kicker',safeText(site.hero_soprattitolo));setText('hero-title',safeText(site.hero_titolo));setText('hero-description',safeText(site.hero_descrizione));
  setText('about-title',safeText(site.azienda_titolo));setText('about-description',safeText(site.azienda_testo));
  setText('catalog-title',safeText(site.catalogo_titolo));setText('contact-title',safeText(site.contatti_titolo));setText('contact-description',safeText(site.contatti_testo));
  setText('contact-location',safeText(site.localita));setText('hero-localita',safeText(site.localita).toUpperCase());
  const logo=safeImage(site.logo);if(logo){$('brand-mark').replaceChildren(imgNode(logo,'Logo Azienda Agricola Zambito'));}
  const hero=safeImage(site.hero_immagine);if(hero){$('hero-photo').style.backgroundImage=`url(${JSON.stringify(hero)})`;}
  const about=safeImage(site.azienda_immagine);if(about){$('about-visual').replaceChildren(imgNode(about,'La nostra azienda agricola'));}
  const actions=$('contact-actions');actions.replaceChildren();
  if(isValidPhone(site.whatsapp))actions.append(makeButton('Scrivici su WhatsApp ↗',waLink(site.whatsapp,safeText(site.whatsapp_messaggio,'Buongiorno, vorrei informazioni sui vostri prodotti.')),'btn btn-gold'));
  else{const p=document.createElement('p');p.className='contact-wait';p.textContent='Numero WhatsApp in fase di definizione.';actions.append(p);}
  if(safeText(site.email).includes('@')){const email=document.createElement('a');email.href=`mailto:${site.email}`;email.className='email-link';email.textContent=site.email;actions.append(email);}
}
async function main(){
  setText('year',String(new Date().getFullYear()));
  $('dialog-close').addEventListener('click',()=>$('product-dialog').close());
  $('product-dialog').addEventListener('click',event=>{if(event.target===$('product-dialog'))$('product-dialog').close();});
  try{
    const responses=await Promise.all([fetch('/catalogo.json',{cache:'no-store'}),fetch('/sito.json',{cache:'no-store'})]);
    if(responses.some(r=>!r.ok))throw Error('Impossibile caricare i dati');
    const [catalog,site]=await Promise.all(responses.map(r=>r.json()));currentCatalog=catalog;currentSite=site;
    renderSite(site);renderProducts(catalog,site);addCertificates($('certifications'),catalog.certificazioni);
    // Evita che il titolo della pagina dichiari certificazioni non verificate.
    document.title=`${safeText(catalog.azienda,'Azienda Agricola Zambito')} | Olio extravergine di oliva`;
  }catch(error){console.error(error);setText('products','Impossibile caricare il catalogo. Riprova più tardi.');}
}
main();
