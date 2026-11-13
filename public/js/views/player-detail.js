// views/player-detail.js
import { avatar, overallMarkup, playerModeStats } from '../components.js';
import { navigate } from '../router.js';
import { pageContent, state } from '../state.js';
import { setLoading, updateChrome } from '../ui.js';
import { esc, playerOverall, shortDate, miIcon } from '../utils.js';

import { api } from '../api.js';

function recordMeta(record, key) {
  if (!record?.match) return 'Ainda sem registro';
  const match = record.match;
  const mode = match.opponent_type === 'second_year' ? 'Interclasse' : 'Entre nós';
  const score = `${match.score_a} × ${match.score_b}`;
  const tieNote = record.tied_matches > 1 ? ` · ${record.tied_matches} ${key === 'win_streak' ? 'sequências' : 'partidas'}` : '';
  return `${shortDate(match.played_on, true)} · ${mode} · ${score}${tieNote}`;
}

function renderPersonalRecords(records = {}) {
  const definitions = [
    { key: 'goals_in_match', title: 'Mais gols em uma partida', unit: 'gols', icon: 'crown' },
    { key: 'assists_in_match', title: 'Mais assistências em uma partida', unit: 'assistências', icon: 'handshake' },
    { key: 'contributions_in_match', title: 'Maior Participação em gols em uma partida', unit: 'gols + assist.', icon: 'bolt' },
    { key: 'win_streak', title: 'Maior sequência de vitórias', unit: 'vitórias seguidas', icon: 'trending_up' }
  ];

  return `<section class="panel personal-records-section">
    <div class="personal-records-heading"><h2 class="panel-title">Recordes pessoais</h2><p class="panel-subtitle">As melhores marcas individuais registradas em quadra</p></div>
    <div class="personal-record-list">${definitions.map(definition => {
      const record = records[definition.key] || { value: 0, match: null, tied_matches: 0 };
      const hasRecord = Number(record.value) > 0;
      return `<div class="personal-record-row${hasRecord ? '' : ' is-empty'}">
        <span class="personal-record-icon">${miIcon(definition.icon)}</span>
        <div class="personal-record-copy"><strong>${esc(definition.title)}</strong><small>${esc(recordMeta(record, definition.key))}</small></div>
        <span class="personal-record-result"><strong>${hasRecord ? record.value : '—'}</strong><small>${hasRecord ? esc(definition.unit) : 'sem marca'}</small></span>
      </div>`;
    }).join('')}</div>
  </section>`;
}

function renderAchievements(achievements = []) {
  const unlockedCount = achievements.filter(achievement => achievement.unlocked).length;
  const sortedAchievements = [...achievements].sort((left, right) => Number(right.unlocked) - Number(left.unlocked));
  const renderBadge = achievement => {
    const footer = achievement.unlocked
      ? `Desbloqueada em ${shortDate(achievement.earned_on, true)}`
      : achievement.target > 1 ? `${achievement.progress} de ${achievement.target}` : 'Continue jogando para desbloquear';
    return `<article class="achievement-badge ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}">
      <div class="achievement-medal"><span class="achievement-icon">${miIcon(achievement.icon)}</span></div>
      <span class="achievement-category">${esc(achievement.group)}</span>
      <h4>${esc(achievement.title)}</h4>
      <p>${esc(achievement.unlocked ? achievement.detail : achievement.description)}</p>
      <small class="achievement-badge-progress">${esc(footer)}</small>
    </article>`;
  };
  const sections = [
    { title: 'Conquistas desbloqueadas', unlocked: true },
    { title: 'Conquistas em busca', unlocked: false }
  ].map(section => {
    const items = sortedAchievements.filter(achievement => achievement.unlocked === section.unlocked);
    if (!items.length) return '';
    return `<section class="achievement-tier ${section.unlocked ? 'is-unlocked' : 'is-locked'}">
      <h3 class="achievement-tier-heading">${section.title}<span>${items.length}</span></h3>
      <div class="achievement-grid">${items.map(renderBadge).join('')}</div>
    </section>`;
  }).join('');

  return `<section class="panel achievements-panel">
    <div class="panel-head">
      <div><h2 class="panel-title">Conquistas</h2><div class="panel-subtitle">Marcos especiais desbloqueados ao longo da trajetória</div></div>
      <span class="achievement-total"><strong>${unlockedCount}</strong><span>de ${achievements.length}</span></span>
    </div>
    <div class="achievement-groups">${sections || '<div class="empty-inline"><strong>Nenhuma conquista por enquanto</strong>As conquistas aparecem conforme o jogador participa das partidas.</div>'}</div>
  </section>`;
}

export async function renderPlayerDetail() {
  if (!state.selectedPlayerId) return navigate('players');
  setLoading('Carregando desempenho do jogador...');
  const result = await api(`/api/players/${state.selectedPlayerId}/history`);
  state.playerProfile = result.data;
  updateChrome();
  const { player, stats, matches, records, achievements } = result.data;
  const totalMatches = stats.internal.matches_played + stats.interclass.matches_played;
  const matchHistory = matches.length ? matches.map(match => {
    const interclass = match.opponent_type === 'second_year';
    const resultLabel = match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate';
    const resultIcon = match.result === 'win' ? 'check_circle' : match.result === 'loss' ? 'cancel' : 'remove_circle';
    const resultClass = match.result === 'win' ? 'is-win' : match.result === 'loss' ? 'is-loss' : 'is-draw';
    const gameType = interclass ? 'Interclasse · 2º Ano' : 'Entre nós · 3º A';
    const ownA = match.team_side === 'A' ? ' is-own' : '';
    const ownB = match.team_side === 'B' ? ' is-own' : '';
    return `<article class="pmc ${resultClass} ${interclass ? 'is-interclass' : 'is-internal'}" data-action="open-match" data-id="${match.id}" tabindex="0" role="button" aria-label="Abrir súmula da partida de ${shortDate(match.played_on, true)}">
      <div class="pmc-top"><span class="pmc-date">${miIcon('calendar_today')} ${shortDate(match.played_on, true)}</span><span class="pmc-kind">${miIcon(interclass ? 'school' : 'groups')} ${gameType}</span></div>
      <div class="pmc-scoreboard">
        <div class="pmc-team${ownA}"><span>${esc(match.team_a_name)}</span>${ownA ? '<small>Seu time</small>' : ''}</div>
        <strong class="pmc-score">${match.score_a}<span>:</span>${match.score_b}</strong>
        <div class="pmc-team${ownB}"><span>${esc(match.team_b_name)}</span>${ownB ? '<small>Seu time</small>' : ''}</div>
      </div>
      <div class="pmc-foot">
        <span class="pmc-result">${miIcon(resultIcon)} ${resultLabel}</span>
        <div class="pmc-contributions">
          <span class="pmc-stat is-goal${match.goals > 0 ? '' : ' is-zero'}">${miIcon('sports_soccer')} <b>${match.goals}</b> ${match.goals === 1 ? 'gol' : 'gols'}</span>
          <span class="pmc-stat is-assist${match.assists > 0 ? '' : ' is-zero'}">${miIcon('handshake')} <b>${match.assists}</b> ${match.assists === 1 ? 'assistência' : 'assistências'}</span>
        </div>
        <span class="pmc-open">Ver súmula ${miIcon('arrow_outward')}</span>
      </div>
    </article>`;
  }).join('') : '<div class="empty-inline"><strong>Nenhuma partida no histórico</strong>Quando o jogador participar de uma partida, o desempenho aparecerá aqui.</div>';
  pageContent.innerHTML = `<section class="page-heading"><div><div class="eyebrow">DESEMPENHO INDIVIDUAL</div><h1>Histórico do jogador<span style="color:var(--red)">.</span></h1><p>Estatísticas separadas por modo de jogo, recordes pessoais e conquistas.</p></div><div class="heading-actions"><button class="btn btn-secondary" data-action="back-player-profile">${miIcon('arrow_back')} Voltar</button><button class="btn btn-primary" data-action="compare-player" data-id="${player.id}">${miIcon('balance')} Comparar</button></div></section><section class="panel player-profile-hero"><div class="player-profile-identity">${avatar(player, 'player-profile-avatar')}<div><span class="eyebrow">${player.is_active ? 'JOGADOR ATIVO' : 'JOGADOR ARQUIVADO'}</span><h2>${esc(player.name)}</h2>${overallMarkup(playerOverall(player.name))}</div></div></section><div class="player-detail-sections"><div class="player-mode-grid">${playerModeStats('Entre nós · 3º A', 'Partidas entre jogadores da turma', stats.internal)}${playerModeStats('Interclasse · 2º Ano', 'Partidas contra o 2º Ano', stats.interclass)}</div>${renderPersonalRecords(records)}${renderAchievements(achievements)}<section class="panel player-history-panel"><div class="panel-head"><div><h2 class="panel-title">Últimas partidas</h2><div class="panel-subtitle">${matches.length ? (matches.length === 1 ? 'A partida mais recente registrada' : `As ${matches.length} mais recentes, em ordem cronológica inversa`) : 'As partidas aparecerão aqui quando forem registradas'}</div></div><span class="results-label">${matches.length} de ${totalMatches} ${totalMatches === 1 ? 'partida' : 'partidas'}</span></div><div class="pmc-list">${matchHistory}</div></section></div>`;
}
