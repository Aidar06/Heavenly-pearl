import {
  DEFAULT_INVITATION_ID,
  InvitationApiError,
  appendGuestToInvitation,
  buildMapLinks,
  fetchInvitationRaw,
  normalizeInvitation,
  resolveInvitationId
} from './backend-adapter.js?v=2';

const UI = {
  ru: {
    invitationLabel:'Свадебное приглашение',scroll:'листайте вниз',dearLabel:'Для самых близких',wishLabel:'От всего сердца',dateLabel:'Сохраните эту дату',programLabel:'В этот особенный день',programTitle:'Программа дня',answerLabel:'Ваш ответ',rsvpTitle:'Будете ли вы с нами?',rsvpLead:'Пожалуйста, подтвердите участие — нам важно подготовить всё с заботой.',nameLabel:'Ваше имя',namePlaceholder:'Как к вам обращаться?',attendanceLabel:'Вы сможете прийти?',attendanceYes:'Да, с радостью',attendanceNo:'К сожалению, не смогу',guestCount:'Количество гостей',guestWish:'Ваше пожелание',wishPlaceholder:'Несколько тёплых слов…',submit:'Подтвердить участие',submitting:'Отправляем…',success:'Спасибо! Ваш ответ сохранён.',formError:'Пожалуйста, укажите ваше имя.',sendError:'Не удалось сохранить ответ. Попробуйте ещё раз.',countdownTitle:'До нашей свадьбы осталось',countdownDays:'дней',countdownHours:'часов',countdownMinutes:'минут',countdownSeconds:'секунд',withLove:'С любовью,',loading:'Загружаем приглашение…',notFound:'Приглашение не найдено',loadError:'Не удалось загрузить приглашение',retry:'Попробовать снова',calendar:'Календарь',signature:'С любовью',meta:'Свадебное приглашение'
  },
  ky: {
    invitationLabel:'Үйлөнүү тоюна чакыруу',scroll:'ылдый сүрүңүз',dearLabel:'Эң жакындарыбыз үчүн',wishLabel:'Чын жүрөктөн',dateLabel:'Бул күндү белгилеп коюңуз',programLabel:'Бул өзгөчө күнү',programTitle:'Күндүн программасы',answerLabel:'Сиздин жообуңуз',rsvpTitle:'Биз менен болосузбу?',rsvpLead:'Катышарыңызды ырастап коюңуз — баарын камкордук менен даярдоо биз үчүн маанилүү.',nameLabel:'Сиздин атыңыз',namePlaceholder:'Сизге кантип кайрылалы?',attendanceLabel:'Тойго келе аласызбы?',attendanceYes:'Ооба, кубануу менен',attendanceNo:'Тилекке каршы, келе албайм',guestCount:'Коноктордун саны',guestWish:'Сиздин каалооңуз',wishPlaceholder:'Бир нече жылуу сөз…',submit:'Катышууну ырастоо',submitting:'Жөнөтүлүүдө…',success:'Рахмат! Жообуңуз сакталды.',formError:'Атыңызды жазыңыз.',sendError:'Жооп сакталган жок. Кайра аракет кылыңыз.',countdownTitle:'Үйлөнүү тоюбузга калды',countdownDays:'күн',countdownHours:'саат',countdownMinutes:'мүнөт',countdownSeconds:'секунд',withLove:'Сүйүү менен,',loading:'Чакыруу жүктөлүүдө…',notFound:'Чакыруу табылган жок',loadError:'Чакыруу жүктөлгөн жок',retry:'Кайра аракет кылуу',calendar:'Жылнаама',signature:'Сүйүү менен',meta:'Үйлөнүү тоюна чакыруу'
  },
  kk: {
    invitationLabel:'Үйлену тойына шақыру',scroll:'төмен қарай сырғытыңыз',dearLabel:'Ең жақындарымызға',wishLabel:'Шын жүректен',dateLabel:'Осы күнді сақтаңыз',programLabel:'Осы ерекше күні',programTitle:'Күн бағдарламасы',answerLabel:'Сіздің жауабыңыз',rsvpTitle:'Бізбен бірге боласыз ба?',rsvpLead:'Қатысатыныңызды растаңыз — бәрін қамқорлықпен дайындау біз үшін маңызды.',nameLabel:'Сіздің атыңыз',namePlaceholder:'Сізге қалай жүгінеміз?',attendanceLabel:'Тойға келе аласыз ба?',attendanceYes:'Иә, қуана келемін',attendanceNo:'Өкінішке қарай, келе алмаймын',guestCount:'Қонақтар саны',guestWish:'Сіздің тілегіңіз',wishPlaceholder:'Бірнеше жылы сөз…',submit:'Қатысуды растау',submitting:'Жіберілуде…',success:'Рақмет! Жауабыңыз сақталды.',formError:'Атыңызды жазыңыз.',sendError:'Жауап сақталмады. Қайталап көріңіз.',countdownTitle:'Тойымызға дейін қалды',countdownDays:'күн',countdownHours:'сағат',countdownMinutes:'минут',countdownSeconds:'секунд',withLove:'Сүйіспеншілікпен,',loading:'Шақыру жүктелуде…',notFound:'Шақыру табылмады',loadError:'Шақыру жүктелмеді',retry:'Қайталап көру',calendar:'Күнтізбе',signature:'Сүйіспеншілікпен',meta:'Үйлену тойына шақыру'
  }
};

const DATE = {
  ru:{months:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],monthsTitle:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],week:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],days:['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']},
  ky:{months:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],monthsTitle:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],week:['Дш','Шш','Шр','Бш','Жм','Иш','Жк'],days:['жекшемби','дүйшөмбү','шейшемби','шаршемби','бейшемби','жума','ишемби']},
  kk:{months:['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],monthsTitle:['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'],week:['Дс','Сс','Ср','Бс','Жм','Сб','Жс'],days:['жексенбі','дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі']}
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  background:$('.sky-noise'),site:$('#site'),status:$('#statusScreen'),statusTitle:$('#statusTitle'),statusLoader:$('#statusLoader'),retry:$('#retryButton'),
  groom:$('#groomName'),bride:$('#brideName'),heroDate:$('#heroDate'),invitationTitle:$('#invitationTitle'),invitationText:$('#invitationText'),signature:$('#invitationSignature'),
  wishBlock:$('#wishBlock'),wishTitle:$('#wishTitle'),wishText:$('#wishText'),dateSection:$('#dateSection'),dateDay:$('#dateDay'),dateMonth:$('#dateMonth'),dateMeta:$('#dateMeta'),calendarMonth:$('#calendarMonth'),calendarYear:$('#calendarYear'),calendarWeek:$('#calendarWeek'),calendarDays:$('#calendarDays'),
  program:$('#programSection'),timeline:$('#timeline'),venue:$('#venueSection'),venueType:$('#venueType'),venueName:$('#venueName'),venueAddress:$('#venueAddress'),venueActions:$('#venueActions'),google:$('#googleMap'),twoGis:$('#twoGisMap'),
  rsvp:$('#rsvpSection'),form:$('#rsvpForm'),submit:$('#rsvpSubmit'),formStatus:$('#formStatus'),name:$('#guestName'),count:$('#guestCount'),countField:$('#guestCountField'),wishField:$('#guestWishField'),wish:$('#guestWish'),footerNames:$('#footerNames'),countdownDays:$('#countdownDays'),countdownHours:$('#countdownHours'),countdownMinutes:$('#countdownMinutes'),countdownSeconds:$('#countdownSeconds'),languageSwitch:$('#languageSwitch')
};

const defaultId = Number(document.querySelector('meta[name="invitation-default-id"]')?.content) || DEFAULT_INVITATION_ID;
const state = { id:resolveInvitationId(location.pathname,defaultId), raw:null, invitation:null, language:'ru', submitting:false };
let revealObserver;
let backgroundFrame=0;
let countdownTimer=0;

function storedLanguage(){try{return localStorage.getItem('azure-palace-language')}catch{return null}}
function saveLanguage(language){try{localStorage.setItem('azure-palace-language',language)}catch{}}
function textFor(source){return source?.[state.language] || source?.[state.invitation?.languages.default] || source?.ru || {}}
function hasText(value){return String(value || '').trim().length>0}
function setStatus(message,{retry=false,loading=false}={}){elements.status.hidden=false;elements.statusTitle.textContent=message;elements.retry.hidden=!retry;elements.statusLoader.hidden=!loading}

function dateParts(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if(!match)return null;
  const [,year,month,day,hour='00',minute='00']=match;
  return {year:Number(year),month:Number(month),day:Number(day),hour,minute,weekday:new Date(Date.UTC(Number(year),Number(month)-1,Number(day))).getUTCDay()};
}

function renderLanguageSwitch(){
  const languages=state.invitation.languages.enabled;
  elements.languageSwitch.replaceChildren();
  if(languages.length<=1){elements.languageSwitch.hidden=true;return}
  languages.forEach(language=>{
    const button=document.createElement('button');
    button.type='button';button.textContent=language.toUpperCase();button.dataset.language=language;
    button.classList.toggle('is-active',language===state.language);
    button.setAttribute('aria-pressed',String(language===state.language));
    button.addEventListener('click',()=>setLanguage(language));
    elements.languageSwitch.append(button);
  });
  elements.languageSwitch.hidden=false;
}

function renderUi(){
  const ui=UI[state.language]||UI.ru;
  document.documentElement.lang=state.language;
  document.querySelectorAll('[data-ui]').forEach(node=>{const key=node.dataset.ui;if(ui[key])node.textContent=ui[key]});
  elements.name.placeholder=ui.namePlaceholder;
  elements.wish.placeholder=ui.wishPlaceholder;
  elements.retry.textContent=ui.retry;
  document.title=`${state.invitation.names.groom || ''} & ${state.invitation.names.bride || ''} — ${ui.meta}`.replace(/^ & | & $/g,'');
  document.querySelector('meta[name="description"]').content=ui.meta;
}

function renderDate(){
  const parts=dateParts(state.invitation.dateISO);
  if(!parts){elements.dateSection.hidden=true;elements.heroDate.textContent='';return}
  elements.dateSection.hidden=false;
  const dict=DATE[state.language]||DATE.ru;
  const time=`${parts.hour}:${parts.minute}`;
  elements.heroDate.textContent=`${parts.day} ${dict.months[parts.month-1]} ${parts.year}`;
  elements.dateDay.textContent=parts.day;
  elements.dateMonth.textContent=dict.months[parts.month-1];
  elements.dateMeta.textContent=`${dict.days[parts.weekday]} · ${time}`;
  elements.calendarMonth.textContent=dict.monthsTitle[parts.month-1];
  elements.calendarYear.textContent=parts.year;
  elements.calendarWeek.replaceChildren(...dict.week.map(label=>{const span=document.createElement('span');span.textContent=label;return span}));
  const firstDay=(new Date(Date.UTC(parts.year,parts.month-1,1)).getUTCDay()+6)%7;
  const total=new Date(Date.UTC(parts.year,parts.month,0)).getUTCDate();
  const nodes=[];
  for(let index=0;index<firstDay;index++){const empty=document.createElement('span');empty.className='is-empty';empty.textContent='0';nodes.push(empty)}
  for(let day=1;day<=total;day++){const cell=document.createElement('span');cell.textContent=day;if(day===parts.day){cell.className='is-wedding';cell.setAttribute('aria-label',UI[state.language].calendar)}nodes.push(cell)}
  elements.calendarDays.replaceChildren(...nodes);
}

function renderTimeline(){
  const items=state.invitation.ceremonies.filter(item=>hasText(item.time)||hasText(textFor(item.title))||hasText(textFor(item.text)));
  elements.program.hidden=!items.length;
  elements.timeline.replaceChildren(...items.map((item,index)=>{
    const article=document.createElement('article');article.className='timeline-item';article.style.transitionDelay=`${Math.min(index*70,280)}ms`;
    const marker=document.createElement('div');marker.className='timeline-item__marker';marker.textContent=String(index+1).padStart(2,'0');
    const body=document.createElement('div');body.className='timeline-item__body';
    const time=document.createElement('time');time.className='timeline-item__time';time.textContent=item.time;
    const heading=document.createElement('h3');heading.textContent=textFor(item.title);
    const copy=document.createElement('p');copy.textContent=textFor(item.text);copy.hidden=!copy.textContent;
    body.append(time,heading,copy);article.append(marker,body);return article;
  }));
}

function setMapLink(element,url){
  element.hidden=!url;
  if(url)element.href=url;else element.removeAttribute('href');
}

function renderVenue(){
  const venue=textFor(state.invitation.venue.content);
  const visible=[venue.type,venue.name,venue.address].some(hasText);
  elements.venue.hidden=!visible;
  elements.venueType.textContent=venue.type;
  elements.venueName.textContent=venue.name;
  elements.venueAddress.textContent=venue.address;
  const links=buildMapLinks(state.invitation.venue,state.language,state.invitation.languages.default);
  setMapLink(elements.google,links.google);setMapLink(elements.twoGis,links.twoGis);
  elements.venueActions.classList.toggle('is-single',Boolean(links.google)!==Boolean(links.twoGis));
  elements.venueActions.hidden=!links.enabled;
}

function renderRsvp(){
  const config=state.invitation.rsvp;
  elements.rsvp.hidden=!config.enabled;
  if(!config.enabled)return;
  elements.count.max=String(config.maxGuests);
  if(Number(elements.count.value)>config.maxGuests)elements.count.value=String(config.maxGuests);
  elements.wishField.hidden=!config.allowGuestWish;
}

function updateCountdown(){
  const target=new Date(state.invitation?.dateISO).getTime();
  if(!Number.isFinite(target))return;
  const remaining=Math.max(0,target-Date.now());
  const days=Math.floor(remaining/86400000);
  const hours=Math.floor(remaining/3600000)%24;
  const minutes=Math.floor(remaining/60000)%60;
  const seconds=Math.floor(remaining/1000)%60;
  elements.countdownDays.textContent=String(days);
  elements.countdownHours.textContent=String(hours).padStart(2,'0');
  elements.countdownMinutes.textContent=String(minutes).padStart(2,'0');
  elements.countdownSeconds.textContent=String(seconds).padStart(2,'0');
  if(!remaining&&countdownTimer){clearInterval(countdownTimer);countdownTimer=0}
}

function startCountdown(){
  if(countdownTimer)clearInterval(countdownTimer);
  updateCountdown();
  const target=new Date(state.invitation?.dateISO).getTime();
  countdownTimer=Number.isFinite(target)&&target>Date.now()?setInterval(updateCountdown,1000):0;
}

function render(){
  const invitation=textFor(state.invitation.invitation);
  const wishes=textFor(state.invitation.wishBlock.content);
  elements.groom.textContent=state.invitation.names.groom;
  elements.bride.textContent=state.invitation.names.bride;
  elements.invitationTitle.textContent=invitation.title;
  elements.invitationText.textContent=invitation.text;
  elements.signature.textContent=UI[state.language].signature;
  const showWish=state.invitation.wishBlock.enabled && (hasText(wishes.title)||hasText(wishes.text));
  elements.wishBlock.hidden=!showWish;elements.wishTitle.textContent=wishes.title;elements.wishText.textContent=wishes.text;
  elements.footerNames.textContent=[state.invitation.names.groom,state.invitation.names.bride].filter(Boolean).join(' & ');
  renderUi();renderDate();renderTimeline();renderVenue();renderRsvp();renderLanguageSwitch();startCountdown();observeReveals();queueBackgroundParallax();
}

function setLanguage(language){
  if(!state.invitation.languages.enabled.includes(language))return;
  state.language=language;saveLanguage(language);render();
}

function observeReveals(){
  revealObserver?.disconnect();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.reveal,.timeline-item').forEach(node=>node.classList.add('is-visible'));return}
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.13,rootMargin:'0px 0px -4%'});
  document.querySelectorAll('.reveal,.timeline-item').forEach(node=>revealObserver.observe(node));
}

function updateBackgroundParallax(){
  backgroundFrame=0;
  const scroller=document.scrollingElement||document.documentElement;
  const travel=Math.max(1,scroller.scrollHeight-window.innerHeight);
  const progress=Math.max(0,Math.min(1,window.scrollY/travel));
  elements.background.style.backgroundPosition=`center ${(progress*100).toFixed(3)}%`;
}

function queueBackgroundParallax(){
  if(!backgroundFrame)backgroundFrame=requestAnimationFrame(updateBackgroundParallax);
}

async function load(){
  const language=UI[state.language]||UI.ru;
  if(!state.id){setStatus(language.notFound,{retry:false});return}
  setStatus(language.loading,{loading:true});
  try{
    const raw=await fetchInvitationRaw(state.id);
    const invitation=normalizeInvitation(raw,state.id);
    if(!invitation.id)throw new InvitationApiError(404);
    state.raw=raw;state.invitation=invitation;
    const saved=storedLanguage();state.language=invitation.languages.enabled.includes(saved)?saved:invitation.languages.default;
    elements.site.hidden=false;render();elements.status.hidden=true;
  }catch(error){
    const message=error instanceof InvitationApiError&&error.status===404?language.notFound:language.loadError;
    setStatus(message,{retry:true});
  }
}

elements.form.addEventListener('change',event=>{
  if(event.target.name!=='attendance')return;
  const attending=event.target.value==='yes';
  elements.count.disabled=!attending;elements.countField.style.opacity=attending?'1':'.5';
});

elements.form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(state.submitting)return;
  const ui=UI[state.language];
  const data=new FormData(elements.form);
  const name=String(data.get('name')||'').trim();
  if(!name){elements.formStatus.textContent=ui.formError;elements.formStatus.className='form-status is-error';elements.name.focus();return}
  state.submitting=true;elements.submit.disabled=true;elements.submit.textContent=ui.submitting;elements.formStatus.textContent='';elements.formStatus.className='form-status';
  try{
    const result=await appendGuestToInvitation(state.id,{name,wish:state.invitation.rsvp.allowGuestWish?data.get('wish'):'',guestsCount:data.get('guests_count'),isAttending:data.get('attendance')==='yes'});
    state.raw=result.raw;state.invitation=result.invitation;
    elements.form.reset();elements.count.disabled=false;elements.countField.style.opacity='1';elements.formStatus.textContent=ui.success;
  }catch{
    elements.formStatus.textContent=ui.sendError;elements.formStatus.className='form-status is-error';
  }finally{
    state.submitting=false;elements.submit.disabled=false;elements.submit.textContent=ui.submit;
  }
});

elements.retry.addEventListener('click',load);
addEventListener('scroll',queueBackgroundParallax,{passive:true});
addEventListener('resize',queueBackgroundParallax,{passive:true});
load();
