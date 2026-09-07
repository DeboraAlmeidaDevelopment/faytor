# Criando código
Interagir com respostass em português.
Sempre que criar código voce não deve inventar links ou features que não foram pedidas.

#Padrões
* Para geradores, usar o mesmo padrão de campos, funcionalidades e botões do gerador de CPF. 
* Geradores devem usar exatamente as ações e o padrão visual do CPF: botão `Gerar`, botão `Gerar e Copiar` e botão `Copiar` acoplado a cada informação gerada, com os mesmos ícones SVG, estados de cópia e cores. Um botão adicional de copiar todos os dados só deve ser mantido quando fizer parte do requisito da tela.
* Para validadores, usar o mesmo padrão de campos, funcionalidades e botões do validador de CPF.
* Campos booleanos devem usar o componente visual de switch padrão do sistema, com input checkbox invisível, trilho e indicador de posição.
* O gerador de endereço deve consultar cidades reais pelo IBGE e logradouros reais pelo ViaCEP. Nunca usar CEP, rua ou bairro inventados como fallback silencioso; se a API não retornar opções, informar o erro ao usuário.
* Toda espera de requisição deve usar o overlay global de carregamento, que monitora automaticamente os `fetch` ativos, bloqueia interações e utiliza o F/cores da marca. Não criar loaders isolados nem exigir controle manual em cada requisição.
* O menu lateral deve manter os itens em ordem alfabética dentro de cada grupo: Ferramentas, Geradores e Validadores.
* Toda nova tela adicionada em `views/` deve ser publicada automaticamente no refresh: nunca adicionar rotas manualmente em uma lista fixa do workflow. O deploy deve gerar as pastas de rota a partir dos arquivos `views/*.html`, excluindo apenas templates que não são rotas, como `inicio.html` e `error.html`.
* Ao criar uma tela nova, registrar também a chave da rota em `js/app.js` (mapa `views`, `titles` e `descriptions`) e em `server.mjs` (`pageMetadata`) para manter navegação, metadados e refresh local/SSR funcionando. O `sitemap.xml` deve ser atualizado quando a página for indexável.
* O fallback de publicação deve ser a própria SPA: `scripts/build-error-pages.mjs` gera `_site/404.html` a partir de `index.html` com `<base href="/">`. Não substituir esse fallback por uma página de erro estática, pois o GitHub Pages usa `404.html` ao atualizar rotas internas.
* Para testar rotas localmente, usar `npm run dev`, que executa o servidor com reinicialização automática. Se a porta 8080 já estiver ocupada por um processo Node antigo, encerrar esse processo e iniciar o comando novamente antes de validar uma nova rota.
* A rota `/` é uma exceção: ela usa `home` no roteador, mas a view correspondente é `views/inicio.html`; qualquer descoberta automática de views deve preservar esse mapeamento.

# SEO e monetização
* Sempre considerar as diretrizes atuais do Google Search e as políticas do Google AdSense ao criar ou alterar conteúdo, páginas, navegação, metadados, SEO ou publicidade.
* Não implementar anúncios em telas sem conteúdo editorial relevante, telas de carregamento, erro, navegação, alertas ou outros estados comportamentais.
* Priorizar conteúdo original, útil, acessível e renderizado de forma que usuários e mecanismos de busca consigam encontrá-lo.
