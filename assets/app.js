const euro = value => new Intl.NumberFormat('it-IT', {style:'currency',currency:'EUR'}).format(value);
const products = document.getElementById('products');
document.getElementById('year').textContent = new Date().getFullYear();
fetch('catalogo.json').then(response => {if (!response.ok) throw new Error('Catalogo non disponibile'); return response.json()}).then(data => {
  if (!Array.isArray(data.formati_litri) || !Number.isFinite(data.prezzo_litro_eur)) throw new Error('Dati catalogo non validi');
  document.getElementById('price-note').textContent = `${euro(data.prezzo_litro_eur)} / litro`;
  products.replaceChildren();
  data.formati_litri.forEach(litri => {
    if (!Number.isFinite(litri) || litri <= 0) return;
    const card = document.createElement('article'); card.className='product';
    card.innerHTML = `<div class="product-art" aria-hidden="true"><div class="tin"><span class="leaf">✳</span><span class="tin-name">ZAMBITO</span><span class="tin-volume"></span></div></div><small>OLIO EXTRAVERGINE DI OLIVA</small><h3></h3><p class="price"></p><p class="per-liter"></p>`;
    card.querySelector('.tin-volume').textContent = `${litri} L`;
    card.querySelector('h3').textContent = `Latta ${litri} litri`;
    card.querySelector('.price').textContent = euro(litri * data.prezzo_litro_eur);
    card.querySelector('.per-liter').textContent = `${euro(data.prezzo_litro_eur)} al litro`;
    products.append(card);
  });
  const digits = typeof data.whatsapp === 'string' ? data.whatsapp.replace(/\D/g,'') : '';
  if (digits.length >= 8 && digits.length <= 15) {
    const a=document.createElement('a');a.className='button';a.href=`https://wa.me/${digits}?text=${encodeURIComponent('Buongiorno, vorrei informazioni sull’olio extravergine di oliva e sui formati disponibili.')}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Scrivici su WhatsApp ↗';
    document.getElementById('contact-action').replaceWith(a);
  }
}).catch(() => {products.textContent='Impossibile caricare il catalogo. Riprova più tardi.'});
