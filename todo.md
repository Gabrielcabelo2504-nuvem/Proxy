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

- [x] Adicionar opções predefinidas de duração (1, 3, 7, 15, 30 dias) ao painel administrativo
- [x] Implementar filtros por status e validade na tabela de keys
- [x] Adicionar exportação CSV das keys
- [x] Implementar avisos de expiração próxima para keys
- [x] Adicionar empty state específ ico para quando os filtros não retornarem nenhuma key.
- [x] Exibir aviso explícito de expiração próxima nas keys com badge/texto claro.

- [x] Otimizar responsividade do painel administrativo para celulares (mobile-first).
- [x] Otimizar responsividade do portal do cliente para celulares (mobile-first).
- [x] Ajustar tamanhos de fontes, espaçamento e botões para melhor usabilidade em telas pequenas.

- [x] Atualizar link do botão "Download do certificado" para https://www.mediafire.com/file/54ron26rizd5004/Marcelo+ruiz+.cer/file
- [x] Atualizar informações do proxy no portal do cliente com dados do XIT PROXY (servidor, portas, usuário, senha)

- [x] Adicionar link para https://meuip.com/ no portal do cliente com frase "Descubra seu IP aqui" e botão de ativação.

- [x] Remover acesso administrativo da página do cliente (/cliente)
- [x] Garantir que o portal do cliente seja totalmente público e sem autenticação
- [x] Remover qualquer referência ou link para o painel administrativo na página do cliente
