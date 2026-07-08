# Checklist de prontidão do GHospital

Este ficheiro resume o caminho mínimo para usar o sistema em ambiente local ou preparar deploy.

## 1. Configuração local

1. Instalar Node.js 18+ e MySQL 8+.
2. Entrar na pasta do backend:

```powershell
cd "C:\Users\Jedy Suco\Desktop\GHospital\Backend"
```

3. Criar/confirmar `Backend\.env` com:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_vida_saudavel
JWT_SECRET=trocar-por-um-segredo-forte
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

4. Criar a base de dados e dados iniciais:

```powershell
npm run db:setup
```

5. Validar o projeto:

```powershell
npm run check
```

6. Arrancar:

```powershell
npm start
```

7. Abrir:

```text
http://localhost:3000
http://localhost:3000/health
```

## 2. Utilizador inicial

Por padrão, o setup cria:

- Email: `admin@vidasaudavel.co.ao`
- Password: `Admin@123456`

Antes de produção, altere estes valores no `.env`:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NOME=
```

## 3. Pontos que devem ser reais antes de produção

- Contactos oficiais em `Frontend/config.js`.
- `FRONTEND_URL` e `CONFIG.API_URL` com domínio real.
- `JWT_SECRET` forte e privado.
- SMTP real em `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.
- Política de privacidade e termos revistos por responsável legal.
- Backups automáticos da base de dados.
- HTTPS obrigatório no domínio final.

## 4. Fluxos a testar manualmente

- Login admin.
- Listar médicos, hospitais e especialidades.
- Marcar consulta pública.
- Confirmar que horários ocupados não podem ser marcados novamente.
- Ver consultas no painel.
- Cancelar consulta e confirmar auditoria.
- Enviar mensagem de contacto.
- Ver páginas em telemóvel e desktop.

## 5. Estados do health check

`/health` devolve:

- `status: ok` quando o backend e a base de dados estão disponíveis.
- `status: degraded` quando o servidor arrancou, mas a base de dados está offline.

Se estiver `degraded`, confirme MySQL, credenciais `DB_*` e se executou `npm run db:setup`.
