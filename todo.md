# Project TODO

- [x] Tela de login do painel administrativo com campos de usuário e senha, usando Manus OAuth como autenticação obrigatória.
- [x] Painel administrativo com tabela listando todas as keys cadastradas.
- [x] Geração de nova key no painel admin com nome do cliente, validade e status ativo/inativo.
- [x] Checagem de detalhes de uma key exibindo cliente, IP autorizado, data de criação, validade e último acesso.
- [x] Exclusão de keys no painel admin com etapa obrigatória de confirmação antes da exclusão.
- [x] Portal público do cliente acessível pela rota /cliente.
- [x] Campo no portal do cliente para inserir a key.
- [x] Botão do portal do cliente com rótulo exatamente "Buscar IP" para exibir o IP atualmente autorizado.
- [x] Campo e botão do portal do cliente com rótulo exatamente "Sincronizar IP" para atualizar o IP autorizado.
- [x] Banco de dados persistindo código da key, cliente, IP autorizado, validade, status e timestamps.
- [x] Registro de logs de atividade por key incluindo data, IP anterior e novo IP a cada sincronização.
- [x] Visual dark/cyberpunk sofisticado com fundo escuro, acentos em ciano/neon e tipografia tecnológica.
- [x] Testes automatizados cobrindo geração, busca, exclusão confirmada, busca pública de IP e sincronização pública de IP.
- [x] Ajustar a tela de login para deixar claro que usuário e senha são uma etapa de identificação visual, enquanto a autenticação real ocorre via Manus OAuth.
- [x] Adicionar estado explícito de acesso negado para usuários autenticados sem papel admin.
