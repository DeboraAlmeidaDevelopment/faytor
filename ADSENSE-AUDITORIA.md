# Auditoria do AdSense — Faytor

Data: 7 de setembro de 2026.

## Complemento: Search Console e redirecionamentos

A inspeção posterior dos saltos HTTP (sem seguir redirecionamentos automaticamente) confirmou que a hospedagem usa **https://www.faytor.com.br/**. As consultas anteriores registraram respostas finais após os redirecionamentos.

- `https://faytor.com.br/` e `http://faytor.com.br/` retornam 301 para `https://www.faytor.com.br/`, que retorna 200. Isso explica a home sem www no relatório.
- `/gerador-senhas` sem www passa por dois redirecionamentos: inclusão de www e inclusão da barra final. `/validador-cns` e `/contato` apresentaram a mesma sequência.
- O HTML publicado ainda aponta o canonical para a home sem www, inclusive nas rotas testadas. O sitemap local também usava domínio sem www e rotas sem barra final. Esses sinais contradiziam o destino real da hospedagem.
- Ajustados localmente sitemap, robots.txt, canonical do servidor e da SPA, URLs sociais e dados estruturados para HTTPS com www; rotas canônicas agora terminam em `/`.
- Os 19 destinos do sitemap atualizado foram consultados: 18 retornaram 200 sem redirecionamento. `/gerador-endereco/` retornou 404 em produção; sua página já existe no build local e precisa ser publicada junto às demais alterações.
- As 23 páginas locais e os metadados da navegação SPA são verificados por `scripts/check-pages.mjs`, incluindo a correspondência entre sitemap e canonical.

Depois do deploy, reenviar `https://www.faytor.com.br/sitemap.xml` no Search Console e inspecionar as URLs finais com www e barra. Se a propriedade atual for somente o prefixo sem www, usar uma propriedade de domínio ou a propriedade correspondente a https://www.faytor.com.br/. Pedir indexação das páginas finais relevantes após confirmar conteúdo e canonical. Não é necessário fazer as versões HTTP, sem www ou sem barra serem indexadas: o status de redirecionamento nelas é esperado. Contato, Sobre e páginas legais continuam com a decisão anterior de `noindex`; sua ausência do índice é independente do redirecionamento.

Referências: [relatório de indexação](https://support.google.com/webmasters/answer/7440203?hl=pt-BR) e [consolidação de URLs duplicadas](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). A inspeção HTTP confirma disponibilidade, não o estado atual do índice do Google. Nenhuma configuração de domínio ou propriedade Search Console foi alterada nesta sessão.

## Conclusão

Complemento sobre “Página alternativa com tag canônica adequada”: as sete URLs enviadas (gerador-senhas, validador-cns, contato, gerador-cnpj, validador-rg, politica-de-privacidade e gerador-pis) retornaram 200 na consulta atual, mas todas declaravam `https://faytor.com.br/` como canonical no HTML publicado. Isso é compatível com o agrupamento indevido de ferramentas diferentes como alternativas da home; a canônica efetivamente selecionada pelo Google deve ser conferida na inspeção de URL. No artefato local, cada uma já aponta para sua própria URL com www e barra final. As cinco ferramentas permitem indexação; contato e política preservam o `noindex` anterior. Após publicar, solicitar indexação das ferramentas e acompanhar a canônica selecionada pelo Google. A indicação de “nenhuma ação necessária” aplica-se quando a relação de equivalência é intencional, não a ferramentas distintas apontadas para a home.

O aviso recebido informa duas categorias de reprovação, mas não identifica URLs nem expõe a avaliação interna do Google. Os problemas abaixo são evidências técnicas e editoriais compatíveis com o aviso; não demonstram isoladamente a causa exata da decisão. As correções locais ainda precisam ser publicadas. Não pedir uma nova revisão apenas porque o build passou.

## Evidências e tratamento

| Evidência | Impacto | Tratamento |
| --- | --- | --- |
| Consultas HTTP ao domínio publicado: `/` e `/gerador-cpf/` retornaram 200, o mesmo título da home e `server-view-content` vazio. | O conteúdo depende de JavaScript e de uma segunda requisição. Uma falha pode deixar apenas navegação. | O deploy passa a gerar o HTML completo das 23 páginas usando o mesmo renderizador do servidor local. |
| O workflow copiava `index.html` para todas as rotas. | Conteúdo, título, descrição e canonical da rota não estavam presentes na resposta inicial. | `scripts/build-pages.mjs` descobre automaticamente `views/*.html`, preserva `inicio → /` e exclui o template `error`. |
| `x-cloak` estava no `body` inteiro. | Falha no carregamento/inicialização do Alpine ocultava também o conteúdo editorial. | O corpo não depende mais desse atributo para aparecer; avisos e carregamento continuam ocultos até a inicialização. |
| `loadAdvertising()` aceitava qualquer HTML não vazio; era chamado no `finally` de `loadView()`, inclusive após erro. | A mensagem de falha podia habilitar o script de anúncios. | Veiculação suspensa no código durante os ajustes; identificação da conta e `ads.txt` preservados. |
| O script de anúncios permanecia no documento após navegação SPA. | Bloquear a chamada inicial em contato/termos não impede o script já carregado de continuar ativo. | Não reativar o carregamento anterior sem implementar controle de inventário e navegação. |
| Menu e cards usavam botões; links legais usavam `href="#"`. | Navegação dependente de eventos JavaScript, sem destinos HTML úteis para rastreamento. | Destinos existentes convertidos para links reais, preservando a navegação SPA. |
| Título de e-mail prometia serviço temporário; a ferramenta apenas gera strings. | Expectativa de uma caixa de entrada que não existe. | Título e explicação corrigidos; incluído o risco de coincidência com contas reais. |
| Base64, JSON e contador tinham explicações breves. | Pouca orientação sobre entradas, erros e interpretação do resultado. | Acrescentados exemplos verificáveis e limites específicos da implementação. |
| Home e Sobre faziam promessas universais de privacidade/localidade, apesar de consultas externas. | Descrição do serviço incompatível com o gerador de endereço. | Textos ajustados para distinguir transformação local e consulta ao IBGE/ViaCEP. |

A suspensão de anúncios evita veiculação inadequada, mas não resolve por si só a avaliação de conteúdo de baixo valor. Não foi alterada nenhuma configuração na conta AdSense e não foi solicitada revisão.

## Trabalho editorial antes de solicitar revisão

- Revisar manualmente as explicações e os exemplos adicionados. Conferir também a experiência com JavaScript ativo, celular e desktop; o navegador de teste não estava disponível nesta sessão.
- Revisar especialmente gerador de senhas e gerador de endereço, que ainda têm textos curtos: explicar os modos efetivamente disponíveis, limites dos resultados e situações de erro. No endereço, distinguir dados retornados pelo ViaCEP do número de imóvel gerado.
- Nos geradores e validadores de documentos, conferir se cada página explica sua regra e limitação específica. Resultado matematicamente válido não comprova cadastro, identidade, titularidade ou situação oficial. Evitar parágrafos genéricos repetidos que apenas trocam o nome do documento.
- Avaliar a utilidade própria de cada página: exemplos de teste reproduzíveis, interpretação de resultados e solução de dúvidas reais. Não aumentar textos apenas para atingir uma quantidade de palavras; as políticas consultadas não fornecem um número que garanta aprovação.
- Manter a home, páginas legais, contato, erros e estados de carregamento fora de qualquer futura veiculação enquanto não houver inventário apropriado. A home atual funciona principalmente como catálogo de navegação.
- Após publicar, conferir HTML e funcionamento diretamente em `faytor.com.br`, inclusive refresh de rotas e página inexistente. Usar a inspeção de URL do Search Console para verificar o conteúdo renderizado; isso auxilia o diagnóstico de rastreamento, mas não reproduz a avaliação do AdSense.
- Só então solicitar nova revisão no AdSense. Aprovação depende da avaliação do Google, inclusive do conjunto do site.

## Validação técnica executada

`npm run build` e `npm run build:pages` concluídos. Com `npm run dev` ativo, `node scripts/check-pages.mjs` verificou as 23 páginas: conteúdo integral, canonical, HTTP 200 e igualdade entre HTML local e artefato de publicação. Também verificou HTTP 404 de rota inexistente, fallback SPA com base na raiz, inicialização de CPF/CNS/PIS/RG com conteúdo pré-renderizado, navegação com fetch, falha de rede e publicidade suspensa. `node --check js/app.js` e `git diff --check` passaram.

Esses testes não substituem testes visuais nem comprovam aprovação editorial. As alterações que já estavam preparadas no repositório foram preservadas; não houve commit, push ou deploy nesta auditoria.

## Referências oficiais consultadas

- [Telas sem conteúdo do editor](https://support.google.com/publisherpolicies/answer/11112688?hl=pt-BR): proibição de anúncios em telas vazias, de baixo valor ou comportamentais.
- [Conteúdo e experiência do usuário no AdSense](https://support.google.com/adsense/answer/10015918?hl=pt-BR): originalidade, utilidade, repetição de conteúdo e navegação funcional.
- [SEO para JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=pt-br): renderização, HTML inicial, canonical, links rastreáveis e erros em SPA.
- [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) e [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse): referências técnicas dos exemplos adicionados.
