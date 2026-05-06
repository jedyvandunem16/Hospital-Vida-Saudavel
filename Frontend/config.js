/**
 * config.js — Configuração global do frontend GHospital
 *
 * ⚠️  ANTES DO DEPLOY EM PRODUÇÃO, actualiza os valores marcados com TODO.
 *
 * Inclui este ficheiro ANTES de qualquer outro script em todas as páginas:
 *   <script src="config.js"></script>           (páginas na raiz)
 *   <script src="../config.js"></script>        (páginas em subpastas)
 */

const CONFIG = Object.freeze({

  // ── API ──────────────────────────────────────────────────────────────────
  // TODO: em produção substituir pelo URL real do servidor
  API_URL: 'http://localhost:3000/api',

  // ── Identidade do hospital ───────────────────────────────────────────────
  // Nome canónico usado em todo o frontend
  APP_NAME: 'Hospital Vida Saudável',
  APP_SHORT_NAME: 'Vida Saudável',  // usado em espaços mais estreitos (sidebar, título)

  // ── Contactos ────────────────────────────────────────────────────────────
  // TODO: substituir pelos contactos reais antes do deploy
  TELEFONE:  '+244 900 000 000',   // TODO
  EMAIL:     'hospital@vidasaudavel.co.ao', // TODO
  MORADA:    'Av. 4 de Fevereiro, Nº 123, Luanda, Angola', // TODO

  // ── Redes sociais ────────────────────────────────────────────────────────
  // TODO: substituir pelos links reais. Deixar null para ocultar o ícone.
  SOCIAL: {
    facebook:  null,  // TODO ex: 'https://facebook.com/hospitalvidasaudavel'
    instagram: null,  // TODO
    linkedin:  null,  // TODO
    whatsapp:  null,  // TODO ex: 'https://wa.me/244900000000'
  },
});