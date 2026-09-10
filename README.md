# AprendizPro: Your Journey

Prompts para o Lovable — AprendizPro

Envie os blocos abaixo um de cada vez, nesta ordem. Espere cada um terminar (e valide o resultado) antes de mandar o próximo.

Bloco 1 — Setup, Banco de Dados e Autenticação

Você vai construir o AprendizPro, plataforma web para jovens aprendizes de 14 a 24 anos organizarem tempo, finanças e comunidade. Parte dos usuários é menor de idade — trate isso como requisito de segurança.

Stack obrigatório: React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions). Não crie backend separado (Node/Express/Python). Nenhuma chave de API pode aparecer no frontend.

Crie estas tabelas no Supabase:

sql
profiles: id (uuid, FK -> auth.users), nome, tipo (aluno/docente/admin), data_nascimento, avatar_url, criado_em
turmas: id, nome, descricao, ano, periodo, status (em_andamento/encerrada), criado_por (FK -> profiles)
turma_membros: turma_id (FK), user_id (FK), papel_na_turma (aluno/docente), data_entrada

Autenticação (Supabase Auth):

Cadastro: nome, e-mail, senha, data de nascimento, código de turma
Verificação de e-mail obrigatória antes de liberar acesso
Se a idade calculada for menor que 18 anos, exiba checkbox adicional obrigatório de consentimento (texto informando ciência do responsável legal)
Login com mensagem de erro sempre genérica ("e-mail ou senha inválidos")
Recuperação de senha por e-mail (link expira em 1h)
Logout

RLS: cada usuário só edita o próprio perfil em profiles; docente/admin podem ler perfis de alunos de suas turmas; leitura de turmas é pública, mas alterar status é restrito a docente vinculado ou admin.

Ao terminar, me mostre as políticas de RLS criadas antes de eu mandar o próximo bloco.

Bloco 2 — Dashboard e Gestão de Turmas

Dashboard (tela inicial pós-login):

Visão de hoje (compromissos, tarefas, lembretes), resumo financeiro mensal, meta de estudo semanal, atalhos rápidos (Adicionar Gasto, Criar Evento, Nova Nota, Falar com Suporte)
Implemente 3 estados: vazio (com CTA), carregando (skeleton), erro (com retry)

Gestão de Turmas:

Toggle de status Em Andamento ↔ Encerrada, visível só para docente/admin, com confirmação em modal explicando as consequências
Turma Encerrada: preserva todos os dados; bloqueia apenas o acesso àquela turma específica (não bloqueia a conta inteira — se o aluno tem outra turma ativa, continua logando normalmente)
Notificação prévia (24h) aos alunos antes do encerramento
Reativação restaura o acesso
Mensagem de erro ao interagir com turma encerrada: "Esta turma foi encerrada. Novas interações não são permitidas."

Design system: cor primária azul 
#2563EB, secundária verde 
#10B981, alerta laranja 
#F59E0B, erro vermelho 
#EF4444. Tipografia Inter. Componentes shadcn/ui com cards de sombra suave, toasts de feedback, modais para confirmações importantes. Responsivo: sidebar no desktop, sidebar colapsável no tablet, bottom navigation no mobile. Contraste WCAG AA e ARIA labels em todos os componentes interativos.

Bloco 3 — Organização e Financeiro

Organização:

Agenda com visão diária/semanal/mensal, eventos recorrentes, lembretes
Bloco de notas com editor Markdown e etiquetas
Plano de desenvolvimento: metas semanais de estudo, etapas, prazos
Seção de dicas de organização (conteúdo estático)
Não implemente ainda: drag-and-drop no simulador de agendas, sincronização com Google Calendar

Financeiro:

Transações (entrada/saída) com categoria obrigatória; valor sempre positivo, o sinal vem do campo tipo
Orçamento por categoria e mensal (não pode ser zero ou negativo); alerta ao atingir 80% do orçamento
Metas financeiras com simulador de juros compostos usando esta fórmula:
Valor Futuro = Aporte × [((1 + i)^n - 1) / i]
i = taxa de juros mensal (decimal, ex: 0.005)
n = número de meses

RLS: todas as tabelas financeiras e de organização (events, tasks, notes, study_plans, transactions, financial_goals, budgets) são 100% privadas — só o próprio usuário acessa. Docente e admin não têm leitura padrão sobre esses dados de nenhum aluno.

Não implemente ainda: IA de insights financeiros.

Bloco 4 — Fórum Público e Suporte

Fórum (só visibilidade pública por enquanto):

Categorias: Dúvidas Acadêmicas, Dúvidas do Trabalho, Dicas e Experiências, Off-Topic
Tópico com título, descrição em texto rico, anexos, status (Aberto/Resolvido/Fechado)
Sanitize todo conteúdo de texto rico no backend antes de salvar/exibir (prevenção de XSS)
Votação em respostas (1 voto por usuário por resposta, substituível, não duplicável), marcação de "Melhor Resposta" (só autor do tópico ou moderador), pontos de reputação e badges

Suporte:

Tickets: aluno abre, sistema atribui a docente por assunto, docente responde
Base de conhecimento com tickets resolvidos
Espaço de estudo: repositório de materiais (links, PDFs, anotações)
Anexos (fórum, tickets, espaço de estudo): PDF/PNG/JPG/DOCX, máx. 10 MB por arquivo, máx. 5 por post/ticket, validados no backend

Não implemente ainda: chatbot com FAQ.

Bloco 5 — Fórum Privado, Notificações e RLS Crítica

Visibilidade privada do fórum:

Tópico privado por turma(s), por usuários individuais, ou misto, com esta interface:
VISIBILIDADE DO TÓPICO:
( ) 🌍 PÚBLICO - Visível para todos os usuários do sistema
( ) 🔒 PRIVADO - Visível apenas para os selecionados abaixo:
    [ ] Convidar minha turma atual
    [ ] Convidar outras turmas: (lista de checkboxes)
    [ ] Convidar usuários específicos: (busca por nome/@username)
    [ ] Convidar docentes: (busca por nome/@username)
Autor pode alterar visibilidade só antes da primeira resposta; depois, só moderador
Tópicos privados não viram públicos sem autorização

RLS crítica (a mais importante do sistema): leitura de forum_topics com visibilidade privada só é permitida se existir registro em topic_visibility vinculando o usuário (direto ou via turma_membros). Se um usuário sem acesso tentar abrir a URL direta do tópico, retorne 404, nunca 403 — não revele que o tópico existe.

Notificações in-app em tempo real (Supabase Realtime) para: turma convidada, usuário individual convidado, docente convidado para tópico privado.

Não implemente ainda: push notification, e-mail transacional, moderação automática por IA.

Ao terminar este bloco, me mostre a política de RLS de forum_topics/topic_visibility para eu validar antes de considerar o MVP concluído.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25985c63-e78b-4ecb-ac9a-d934930def48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
