import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  API_BASE_URL,
  appendGuestToInvitation,
  buildMapLinks,
  buildPatchPayload,
  normalizeInvitation,
  resolveInvitationId
} from '../dist/backend-adapter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const required = [
  'index.html','styles.css','app.js','backend-adapter.js','.openai/hosting.json',
  'assets/sky-continuous.webp','assets/calendar-ornate-frame.webp',
  'assets/fonts/cormorant-regular.woff2','assets/fonts/cormorant-italic.woff2','assets/fonts/manrope-regular.woff2'
];
for (const file of required) assert(fs.statSync(path.join(dist,file)).size>100,`Missing ${file}`);

const fixture = {
  public_id: 'pub-3',
  languages:{enabled:['ru','ky','kk'],default:'ky'},
  names:{groom:'Айдар',bride:'Алина'},
  date:'2027-08-18T16:00:00',
  invitation:{
    ru:{title:'Дорогие гости',text:'Приглашаем вас'},
    ky:{title:'Кымбаттуу коноктор',text:'Сиздерди чакырабыз'},
    kk:{title:'Құрметті қонақтар',text:'Сіздерді шақырамыз'}
  },
  wish_block:{enabled:true,content:{ru:{title:'Пожелание',text:'Будьте рядом'},ky:{title:'Каалоо',text:'Жаныбызда болуңуз'},kk:{title:'Тілек',text:'Жанымызда болыңыз'}}},
  ceremonies:[
    {time:'18:00',sort_order:2,content:{ru:{title:'Ужин',text:'Тёплый вечер'},ky:{title:'Кечки тамак',text:'Жылуу кече'},kk:{title:'Кешкі ас',text:'Жылы кеш'}}},
    {time:'16:00',sort_order:1,content:{ru:{title:'Церемония',text:'Наше да'},ky:{title:'Азем',text:'Биздин ооба'},kk:{title:'Рәсім',text:'Біздің иә'}}}
  ],
  venue:{
    content:{ru:{type:'Ресторан',name:'Очень длинное название торжественного загородного ресторанного комплекса',address:'г. Бишкек, очень длинный адрес, дом 123'},ky:{type:'Ресторан',name:'Узун аталыштагы салтанаттуу ресторан',address:'Бишкек ш., узун дарек, 123'},kk:{type:'Мейрамхана',name:'Ұзын атаулы салтанатты мейрамхана',address:'Бішкек қ., ұзын мекенжай, 123'}},
    map:{enabled:true,google_url:'https://maps.google.com/custom',two_gis_url:null}
  },
  rsvp:{enabled:true,allow_guest_wish:true,max_guests:4},
  guests:[{name:'Нурия',wish:'Счастья!',guests_count:2,is_attending:true}]
};

assert.equal(resolveInvitationId('/pub-3'),'pub-3');
assert.equal(resolveInvitationId('/550e8400-e29b-41d4-a716-446655440000/details'),'550e8400-e29b-41d4-a716-446655440000');
assert.equal(resolveInvitationId('/wrong!'),null);
assert.equal(resolveInvitationId('/',7),'7');

const normalized = normalizeInvitation(fixture,3);
assert.deepEqual(normalized.languages.enabled,['ru','ky','kk']);
assert.equal(normalized.languages.default,'ky');
assert.equal(normalized.ceremonies[0].time,'16:00');
assert.match(normalized.ceremonies[0].title.ky,/Азем/);
assert.match(normalized.ceremonies[0].title.kk,/Рәсім/);
assert.equal(normalized.rsvp.maxGuests,4);
assert.equal(normalized.venue.content.ru.name,fixture.venue.content.ru.name);

for (const enabled of [['ru'],['ru','ky'],['ru','ky','kk']]) {
  const invitation=normalizeInvitation({...fixture,languages:{enabled,default:enabled.at(-1)}},3);
  assert.deepEqual(invitation.languages.enabled,enabled);
  assert.equal(invitation.languages.default,enabled.at(-1));
}

const customLinks=buildMapLinks(normalized.venue,'ru','ky');
assert.equal(customLinks.google,'https://maps.google.com/custom');
assert.equal(customLinks.twoGis,'https://2gis.kg/search/%D0%B3.%20%D0%91%D0%B8%D1%88%D0%BA%D0%B5%D0%BA%2C%20%D0%BE%D1%87%D0%B5%D0%BD%D1%8C%20%D0%B4%D0%BB%D0%B8%D0%BD%D0%BD%D1%8B%D0%B9%20%D0%B0%D0%B4%D1%80%D0%B5%D1%81%2C%20%D0%B4%D0%BE%D0%BC%20123');

const bothCustomLinks=buildMapLinks({...normalized.venue,map:{enabled:true,googleUrl:'https://maps.google.com/place',twoGisUrl:'https://2gis.kg/geo/1'}},'ru','ru');
assert.equal(bothCustomLinks.google,'https://maps.google.com/place');
assert.equal(bothCustomLinks.twoGis,'https://2gis.kg/geo/1');

const fallbackLinks=buildMapLinks({...normalized.venue,map:{enabled:true,googleUrl:'',twoGisUrl:''}},'ru','ru');
assert.equal(fallbackLinks.google,'https://www.google.com/maps/search/?api=1&query=%D0%B3.%20%D0%91%D0%B8%D1%88%D0%BA%D0%B5%D0%BA%2C%20%D0%BE%D1%87%D0%B5%D0%BD%D1%8C%20%D0%B4%D0%BB%D0%B8%D0%BD%D0%BD%D1%8B%D0%B9%20%D0%B0%D0%B4%D1%80%D0%B5%D1%81%2C%20%D0%B4%D0%BE%D0%BC%20123');
assert.equal(fallbackLinks.twoGis,'https://2gis.kg/search/%D0%B3.%20%D0%91%D0%B8%D1%88%D0%BA%D0%B5%D0%BA%2C%20%D0%BE%D1%87%D0%B5%D0%BD%D1%8C%20%D0%B4%D0%BB%D0%B8%D0%BD%D0%BD%D1%8B%D0%B9%20%D0%B0%D0%B4%D1%80%D0%B5%D1%81%2C%20%D0%B4%D0%BE%D0%BC%20123');

const invalidLinks=buildMapLinks({...normalized.venue,map:{enabled:true,googleUrl:'javascript:alert(1)',twoGisUrl:'not-a-url'}},'ru','ru');
assert.deepEqual(invalidLinks,fallbackLinks);

const noAddressLinks=buildMapLinks({content:{ru:{name:'Изумруд',address:'  '}},map:{enabled:true,googleUrl:'',twoGisUrl:'https://2gis.kg/geo/2'}},'ru','ru');
assert.deepEqual(noAddressLinks,{enabled:true,google:'',twoGis:'https://2gis.kg/geo/2'});

const hiddenLinks=buildMapLinks({...normalized.venue,map:{...normalized.venue.map,enabled:false}},'ru','ru');
assert.deepEqual(hiddenLinks,{enabled:false,google:'',twoGis:''});

const patch=buildPatchPayload(fixture,{name:'  Айбек  ',wish:'<b>Любви!</b>',guestsCount:99,isAttending:true},3);
assert.equal(patch.guests.length,2);
assert.deepEqual(patch.guests[0],fixture.guests[0]);
assert.deepEqual(patch.guests[1],{name:'Айбек',wish:'Любви!',guests_count:4,is_attending:true});

const calls=[];
const mockFetch=async (url,options={})=>{
  calls.push({url,options});
  if((options.method||'GET')==='GET')return new Response(JSON.stringify(fixture),{status:200});
  return new Response(JSON.stringify({ok:true}),{status:200});
};
const submitted=await appendGuestToInvitation('pub-3',{name:'Тест',guestsCount:2,isAttending:true},{fetchImpl:mockFetch});
assert.equal(calls[0].url,`${API_BASE_URL}/pub-3`);
assert.equal(calls[1].url,`${API_BASE_URL}/pub-3/full`);
assert.equal(calls[1].options.method,'PATCH');
assert.equal(submitted.raw.guests.length,2);

const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const css=fs.readFileSync(path.join(dist,'styles.css'),'utf8');
const app=fs.readFileSync(path.join(dist,'app.js'),'utf8');
for(const marker of ['statusScreen','languageSwitch','rsvpForm','googleMap','twoGisMap','calendarDays','calendar-card__frame','loading="lazy"','countdownDays','countdownSeconds','data-ui="countdownTitle"','<select id="guestCount"'])assert(html.includes(marker),`Missing ${marker}`);
for(const marker of ['assets/sky-continuous.webp','type="image/webp"','fetchpriority="high"','assets/calendar-ornate-frame.webp','width="720" height="900"','decoding="async"'])assert(html.includes(marker),`Missing image optimization ${marker}`);
for(const legacy of ['sky-continuous.png','calendar-ornate-frame.png','hero-garden.webp','floral-divider.webp','floral-corners.webp','calendar-hall.webp'])assert(!`${html}${css}`.includes(legacy),`Unused or unoptimized image is still referenced: ${legacy}`);
for(const marker of ['@media (max-width:360px)','overflow-x:clip','max-width:100%','prefers-reduced-motion'])assert(css.includes(marker),`Missing CSS ${marker}`);
for(const marker of ['.venue__actions{display:grid','.venue__actions.is-single','grid-template-columns:1fr 1fr'])assert(css.includes(marker),`Missing responsive map buttons CSS ${marker}`);
for(const marker of ['appendGuestToInvitation','IntersectionObserver','localStorage','renderTimeline','renderLanguageSwitch','syncLanguageSwitch','closeLanguageSwitch','LANGUAGE_BADGES','pointerdown','querySelectorAll(\'button\')','replaceChildren(...options)','queueBackgroundParallax','window.scrollY/travel','startCountdown','setInterval(updateCountdown,1000)'])assert(app.includes(marker),`Missing behavior ${marker}`);
for(const marker of ['right:calc(16px + env(safe-area-inset-right))','bottom:calc(16px + env(safe-area-inset-bottom))','z-index:1000','transition:width .3s ease','.language-switch.is-open','.field select{appearance:none'])assert(css.includes(marker),`Missing language switcher or guest select CSS ${marker}`);
for(const removed of ['cloud-edge','cloud-ribbon','program__florals','venue__illustration','footer__clouds'])assert(!html.includes(removed),`Removed decoration still present: ${removed}`);
assert(css.includes('background-position')&&css.includes('.footer{')&&css.includes('color:var(--ink);background:transparent'), 'Missing continuous sky background or light countdown footer');
assert(css.includes('.calendar-card{')&&css.includes('width:calc(100% + 24px)')&&css.includes('aspect-ratio:4/5')&&css.includes('background:transparent')&&css.includes('.calendar-card__frame{'),'Missing enlarged transparent ornate calendar frame');
assert(!css.includes('background:rgba(246,251,254,.65)'),'The old white calendar block must be removed');
assert(!css.includes("background:url('assets/hero-garden.webp')"),'Footer must keep the original sky style without a replacement photo');
for(const section of ['.hero{','.invitation{','.wish{','.date-section{','.program{','.venue{','.rsvp{'])assert(css.includes(`${section}`)&&css.slice(css.indexOf(section),css.indexOf(section)+260).includes('background:transparent'),`Section is not seam-free: ${section}`);
assert(!`${html}${css}${app}`.toLowerCase().includes('swan'),'Swan artwork or copy must not be present');
assert(!`${html}${css}${app}`.includes('лебед'),'Лебеди должны отсутствовать');

console.log('Passed: dynamic schema, languages, maps, RSVP, seamless parallax sections, localized wedding countdown, mobile safeguards, and no swans.');
