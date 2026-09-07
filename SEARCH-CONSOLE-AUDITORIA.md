# Conferência de todas as páginas — 7 de setembro de 2026

Foram consultadas as 23 URLs finais com HTTPS, www e barra final e as 22 variantes de rotas sem barra. As respostas foram lidas sem seguir redirecionamentos automaticamente.

Em produção, 22 páginas retornam 200, mas todas têm o mesmo título da home, canonical para https://faytor.com.br/ e o contêiner de conteúdo vazio no HTML inicial. As 21 rotas existentes sem barra retornam 301 para a respectiva versão com barra. O gerador de endereço retorna 404 com e sem barra.

| Página | HTTP publicado | Diagnóstico publicado | Build local |
| --- | --- | --- | --- |
| / | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /base64/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /contato/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; noindex |
| /gerador-celular/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-cnpj/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-cns/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-cpf/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-email/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-endereco/ | 404 | Página ainda não publicada | Canonical própria, conteúdo completo; indexável |
| /gerador-nomes/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-pis/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-rg/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /gerador-senhas/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /jsonformatter/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /politica-de-privacidade/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; noindex |
| /sobre-nos/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; noindex |
| /termos-de-uso/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; noindex |
| /validador-cnpj/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /validador-cns/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /validador-cpf/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /validador-pis/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /validador-rg/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |
| /wordcounter/ | 200 | Canonical da home; título repetido; HTML inicial vazio | Canonical própria, conteúdo completo; indexável |

O build local passou nos testes das 23 páginas. Verificados: uma canonical própria por página, títulos únicos, descrição presente, conteúdo integral, igualdade entre HTML do servidor local e artefato de publicação, igualdade dos metadados entre SPA e HTML, correspondência de todas as views com o roteador e correspondência exata entre sitemap e páginas indexáveis (19). As quatro páginas noindex são Contato, Sobre, Termos e Política de Privacidade, preservando a configuração anterior.

O mesmo conjunto de testes também verifica o fallback SPA, HTTP 404 de página desconhecida e a suspensão de anúncios. Não foi feita uma nova avaliação visual nem uma auditoria editorial completa de cada ferramenta. A verificação HTTP não revela a canônica selecionada pelo Google nem garante indexação ou aprovação no AdSense.

As correções estão locais. Depois do deploy, repetir as consultas no domínio publicado antes de reenviar o sitemap e solicitar indexação. As variantes que redirecionam podem continuar fora do índice; a meta é indexar as páginas finais relevantes, não eliminar todos os avisos do Search Console.
