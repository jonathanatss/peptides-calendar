## Deploy no Netlify + Supabase

### 1. Criar o projeto no Supabase

1. Crie um projeto no Supabase.
2. Em `Authentication`, mantenha `Email`/`Password` habilitado.
3. Rode o SQL de [supabase-schema.sql](/C:/Users/joato/Downloads/peptides-calendar/supabase-schema.sql).

### 2. Configurar variaveis do frontend

Use os nomes abaixo:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

Localmente, coloque em `.env.local`.

No Netlify, configure essas variaveis no painel do site com escopo de build.

### 3. Publicar no Netlify

O projeto ja esta configurado com:

- `build command`: `npm run build`
- `publish directory`: `dist`
- fallback SPA via [netlify.toml](/C:/Users/joato/Downloads/peptides-calendar/netlify.toml)

### 4. Fluxo esperado no app

1. O usuario continua com `localStorage` funcionando mesmo sem login.
2. Ao entrar com email e senha no card `Sincronizacao em nuvem`, o app:
   - carrega a copia remota se existir
   - continua salvando localmente
   - sincroniza automaticamente com o Supabase

### 5. Arquivos principais

- [src/App.jsx](/C:/Users/joato/Downloads/peptides-calendar/src/App.jsx)
- [src/lib/supabase.js](/C:/Users/joato/Downloads/peptides-calendar/src/lib/supabase.js)
- [supabase-schema.sql](/C:/Users/joato/Downloads/peptides-calendar/supabase-schema.sql)
- [.env.example](/C:/Users/joato/Downloads/peptides-calendar/.env.example)
- [netlify.toml](/C:/Users/joato/Downloads/peptides-calendar/netlify.toml)
