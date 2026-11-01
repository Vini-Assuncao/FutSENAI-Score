// views/player-detail.js
import { avatar, overallMarkup, playerModeStats } from '../components.js';
import { navigate } from '../router.js';
import { pageContent, state } from '../state.js';
import { setLoading, updateChrome } from '../ui.js';
import { esc, playerOverall, shortDate } from '../utils.js';

import { api } from '../api.js';

export async function renderPlayerDetail() {
  if (!state.selectedPlayerId) return navigate('players');
  setLoading('Carregando desempenho do jogador...');
  const result = await api(`/api/players/${state.selectedPlayerId}/history`);
  state.playerProfile = result.data;
  updateChrome();
  const { player, stats, matches } = result.data;
  const matchHistory = matches.length ? matches.map(match => {
    const interclass = match.opponent_type === 'second_year';
    const resultLabel = match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate';
    const resultClass = match.result === 'win' ? 'is-win' : match.result === 'loss' ? 'is-loss' : 'is-draw';
    const gameType = interclass ? 'Contra o 2º Ano' : 'Entre nós · 3º A';
    const ownA = match.team_side === 'A' ? ' is-own' : '';
    const ownB = match.team_side === 'B' ? ' is-own' : '';
    return `<article class="pmc ${resultClass} ${interclass ? 'is-interclass' : ''}" data-action="open-match" data-id="${match.id}" tabindex="0" aria-label="Abrir súmula da partida de ${shortDate(match.played_on, true)}">
      <div class="pmc-top"><span class="pmc-date">${shortDate(match.played_on, true)}</span><span class="pmc-kind">${gameType}</span></div>
      <div class="pmc-score">
        <span class="pmc-team${ownA}">${esc(match.team_a_name)}</span>
        <strong>${match.score_a}<span>:</span>${match.score_b}</strong>
        <span class="pmc-team${ownB}">${esc(match.team_b_name)}</span>
      </div>
      <div class="pmc-foot">
        <span class="pmc-result">${resultLabel}</span>
        <span class="pmc-stat">⚽︎ <b>${match.goals}</b> ${match.goals === 1 ? 'gol' : 'gols'}</span>
        <span class="pmc-stat">♕ <b>${match.assists}</b> ${match.assists === 1 ? 'assistência' : 'assistências'}</span>
        <span class="pmc-open">Súmula ↗</span>
      </div>
    </article>`;
  }).join('') : '<div class="empty-inline"><strong>Nenhuma partida no histórico</strong>Quando o jogador participar de uma partida, o desempenho aparecerá aqui.</div>';
  pageContent.innerHTML = `<section class="page-heading"><div><div class="eyebrow">DESEMPENHO INDIVIDUAL</div><h1>Histórico do jogador<span style="color:var(--red)">.</span></h1><p>Estatísticas separadas por modo de jogo e partidas recentes em uma única linha do tempo.</p></div><div class="heading-actions"><button class="btn btn-secondary" data-action="back-player-profile">← Voltar</button><button class="btn btn-primary" data-action="compare-player" data-id="${player.id}">⚖ Comparar</button></div></section><section class="panel player-profile-hero"><div class="player-profile-identity">${avatar(player, 'player-profile-avatar')}<div><span class="eyebrow">${player.is_active ? 'JOGADOR ATIVO' : 'JOGADOR ARQUIVADO'}</span><h2>${esc(player.name)}</h2>${overallMarkup(playerOverall(player.name))}</div></div></section><div class="player-mode-grid">${playerModeStats('Entre nós · 3º A', 'Partidas entre jogadores da turma', stats.internal)}${playerModeStats('Interclasse · 2º Ano', 'Partidas contra o 2º Ano', stats.interclass)}</div><section class="panel player-history-panel"><div class="panel-head"><div><h2 class="panel-title">Últimas partidas</h2><div class="panel-subtitle">Os dois modos de jogo, em ordem da mais recente</div></div><span class="results-label">${matches.length} ${matches.length === 1 ? 'partida' : 'partidas'}</span></div><div class="pmc-list">${matchHistory}</div></section>`;
}
