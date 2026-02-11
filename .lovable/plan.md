

# FaeNet - Rede Social da Escola FAETEC 🎓

## Identidade Visual
- **Logo**: Logo oficial da FaeNet (fornecida pelo usuário)
- **Cores**: Tons de azul escuro (#1B3A5C) e azul claro (#5BBCE4), com branco e cinza claro como secundárias
- **Estilo**: Inspirado no Instagram — limpo, visual com foco em imagens e cards arredondados
- **Responsivo**: Mobile-first, funciona em celular e desktop

---

## MVP - Fase 1: Fundação

### 1. Autenticação
- Tela de **login** e **cadastro** com email e senha
- Design com o logo da FaeNet centralizado
- Proteção de rotas (só usuários logados acessam o app)

### 2. Perfil do Usuário
- Foto de perfil e foto de capa
- Nome, bio, turma/curso
- Contador de seguidores / seguindo / posts
- Botão de seguir/deixar de seguir
- Edição do próprio perfil

### 3. Feed de Posts
- Timeline estilo Instagram com posts em cards
- Criar post com texto e imagem
- Curtir posts (com animação de coração)
- Comentar nos posts
- Exibir data, autor e quantidade de curtidas/comentários

### 4. Sistema de Follow
- Seguir e deixar de seguir outros usuários
- Feed mostra posts de quem você segue
- Lista de seguidores e seguindo no perfil

### 5. Busca
- Buscar usuários por nome
- Página de exploração com posts populares

### 6. Navegação
- Barra de navegação inferior (mobile) estilo Instagram: Home, Busca, Novo Post, Notificações, Perfil
- Sidebar no desktop
- Logo da FaeNet no topo

---

## Backend (Lovable Cloud / Supabase)
- **Banco de dados PostgreSQL** com tabelas: users, posts, comments, likes, follows
- **Autenticação** com email/senha via Supabase Auth
- **Storage** para upload de imagens (fotos de perfil e posts)
- **Row Level Security** para proteger dados dos usuários

---

## Páginas do App
1. `/login` - Login
2. `/register` - Cadastro
3. `/` - Feed principal
4. `/explore` - Busca e exploração
5. `/new-post` - Criar novo post
6. `/profile/:id` - Perfil do usuário
7. `/edit-profile` - Editar perfil
8. `/notifications` - Notificações (placeholder para fase 2)

---

## Fase 2 (Futuro)
- Stories com desaparecimento automático
- Notificações em tempo real
- Upload de vídeos
- Moderação (reportar/banir)
- Mensagens diretas

