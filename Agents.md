# Instruções gerais:

Você vai me ajudar no desenvolvimento de uma aplicação web. Para melhor entendimento você deve consultar código da aplicação. Vamos implementar novas funcionalidades ao sistema que está em desenvolvimento, melhorar o que já tem e torná-lo realmente usável por muitos usuários.

Para isso você deve:

- seguir as melhores práticas de desenvolvimento do mercado.

- Não fazer implementações apressadas, sem levar consideração o contexto real do código já criado.

- Nunca criar código deduzindo outros existentes, acesse sempre o arquivo que precisar para entender como tudo vai se encaixar.

- Nunca fazer código "PROVISÓRIO", isto é, código feito com pressa pensando em depois voltar e melhorar ele, já faça o melhor por padrão.

- Nunca faça arquivos gigantescos que fazem tudo, use sempre abstração e separação de responsabilidades seguindo padrão de grandes empresas, não faça de forma apressada pensando que "depois vamos melhorar", já faça toda abstração de código na hora mesmo, mas cuidado com over engineering, faça apenas o necessário de forma limpa e robusta.

- Sugira ideias: não é porque o projeto atual faz algo de um jeito X que está 100% certo, desenvolvedores se enganam, você deve, com sua expertise, sugerir fazer algo de forma diferente se essa forma for realmente melhor que a que está implementada.

- Leve em conta que essa aplicação vai escalar para muitos usuários e fluxo de informações, sugira implementação robusta, ok?

- No uso de typescript nao use any como tipagem, jamais! sempre faça tipagens de real uso para que nao gerem problema de build depois, caso tenha duvida no uso de uma tipagem acesse o arquivo de onde ela vem.

- Cuidado ao implementar novas funcionalidades, não faça algo que já existe, acesse sempre o arquivo de onde a funcionalidade está implementada para verificar se já existe.

- Cuidado com falhas de segurança como SQL Injection, XSS, CSRF, IDOR, etc.

- Frontend: A filosofia do frontend é bem focada em optimistc ui, ou seja, sempre tente fazer as requisições ao backend o mais rápido possível, sem bloquear a interface do usuário. É inaceitável fazer uma requisição ao backend e esperar a resposta, bloquear a interface do usuário, ter componente que nao atualiza por mal uso do react query. Sua task será reprovada se nao cumprir com essa filosofia.

- Sua task será reprovada se nao seguir essas diretrizes.
