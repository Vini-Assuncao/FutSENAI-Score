import { api } from './api.js';
import { esc, miIcon } from './utils.js';

let matches = [];
let visibleMonth = null;

const monthStart = date => new Date(date.getFullYear(), date.getMonth(), 1);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const sameMonth = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

function renderCalendar() {
  const panel = document.getElementById('matchCalendar');
  if (!panel || !visibleMonth) return;

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const today = new Date();
  const firstDay = monthStart(visibleMonth);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const matchesByDate = new Map();
  matches.forEach(match => {
    if (!matchesByDate.has(match.played_on)) matchesByDate.set(match.played_on, []);
    matchesByDate.get(match.played_on).push(match);
  });

  const blanks = Array.from({ length: mondayOffset }, () => '<span class="match-calendar-blank" aria-hidden="true"></span>');
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
    const key = dateKey(date);
    const dayMatches = (matchesByDate.get(key) || []).slice().sort((left, right) => right.id - left.id);
    const pastOrToday = date <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = key === dateKey(today);
    const kinds = new Set(dayMatches.map(match => match.opponent_type === 'second_year' ? 'interclass' : 'internal'));
    const indicators = [...kinds].map(kind => `<span class="match-calendar-dot ${kind}" aria-hidden="true"></span>`).join('');
    const descriptions = [...kinds].map(kind => kind === 'interclass' ? 'Contra o 2° ano' : 'Entre nós').join(' e ');
    const ariaLabel = `${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)}${dayMatches.length ? `, ${dayMatches.length} ${dayMatches.length === 1 ? 'partida' : 'partidas'}: ${descriptions}` : ''}`;
    const classNames = ['match-calendar-day', isToday ? 'is-today' : '', dayMatches.length ? 'has-matches' : ''].filter(Boolean).join(' ');
    if (dayMatches.length && pastOrToday) {
      return `<button type="button" class="${classNames}" data-action="open-match" data-id="${dayMatches[0].id}" aria-label="${esc(ariaLabel)}" title="${esc(descriptions)}">${index + 1}<span class="match-calendar-dots">${indicators}</span></button>`;
    }
    return `<span class="${classNames}${pastOrToday ? '' : ' is-future'}" aria-label="${esc(ariaLabel)}">${index + 1}${indicators ? `<span class="match-calendar-dots">${indicators}</span>` : ''}</span>`;
  });
  const trailing = (7 - ((blanks.length + days.length) % 7)) % 7;
  const nextDisabled = sameMonth(visibleMonth, today) || visibleMonth > today;

  panel.innerHTML = `<div class="match-calendar-heading"><div><span class="eyebrow">HISTÓRICO DE JOGOS</span><h2>Calendário</h2></div><button type="button" class="match-calendar-close" data-calendar-close aria-label="Fechar calendário">${miIcon('cancel')}</button></div>
    <div class="match-calendar-month"><button type="button" data-calendar-month="previous" aria-label="Mês anterior">${miIcon('arrow_back')}</button><strong>${esc(monthLabel)}</strong><button type="button" data-calendar-month="next" aria-label="Próximo mês" ${nextDisabled ? 'disabled' : ''}>${miIcon('arrow_forward')}</button></div>
    <div class="match-calendar-grid" role="grid" aria-label="${esc(monthLabel)}"><span class="match-calendar-weekday">SEG</span><span class="match-calendar-weekday">TER</span><span class="match-calendar-weekday">QUA</span><span class="match-calendar-weekday">QUI</span><span class="match-calendar-weekday">SEX</span><span class="match-calendar-weekday">SÁB</span><span class="match-calendar-weekday">DOM</span>${blanks.join('')}${days.join('')}${Array.from({ length: trailing }, () => '<span class="match-calendar-blank" aria-hidden="true"></span>').join('')}</div>
    <div class="match-calendar-legend"><span><i class="internal"></i>Entre nós</span><span><i class="interclass"></i>Contra o 2° ano</span></div>
    ${matchesByDate.size ? '' : '<p class="match-calendar-empty">Ainda não há partidas registradas.</p>'}`;
}

export async function openMatchCalendar() {
  const panel = document.getElementById('matchCalendar');
  const button = document.getElementById('todayCalendarButton');
  if (!panel || !button) return;
  visibleMonth = monthStart(new Date());
  panel.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  panel.innerHTML = '<div class="match-calendar-loading"><span class="spinner"></span><span>Carregando partidas...</span></div>';
  const [internal, interclass] = await Promise.all([
    api('/api/matches?scope=internal'),
    api('/api/matches?scope=interclass')
  ]);
  matches = [...internal.data, ...interclass.data];
  renderCalendar();
}

export function closeMatchCalendar() {
  const panel = document.getElementById('matchCalendar');
  const button = document.getElementById('todayCalendarButton');
  if (panel) panel.hidden = true;
  button?.setAttribute('aria-expanded', 'false');
}

export function shiftMatchCalendar(direction) {
  if (!visibleMonth) return;
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + direction, 1);
  if (nextMonth > monthStart(new Date())) return;
  visibleMonth = nextMonth;
  renderCalendar();
}

export function isMatchCalendarOpen() {
  return document.getElementById('matchCalendar')?.hidden === false;
}
