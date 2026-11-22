# Ludo — testes como especificação

Repositório de entrega: **`desafio_teste_ludo`**.

Total de casos: **27**.

## Colaborador

Matheus Previato Hermenegildo — GitHub [Matheus-Previato](https://github.com/Matheus-Previato). Entrega organizada como trabalho individual. Em uma entrega em dupla, os dois integrantes devem ser identificados e suas contribuições devem existir no histórico do próprio repositório.

## Objetivo da entrega

Este repositório fornece especificação e testes de comportamento em **JavaScript**, para que a implementação também seja produzida em JavaScript a partir deles. O conjunto usa o executor nativo `node:test` e as asserções `node:assert/strict`, com módulos ES.

Os arquivos fornecidos são testes, documentação e configuração de execução. A implementação deverá ser criada em **`src/game.js`**, exportando as funções descritas abaixo. A primeira execução de `npm test` registra `ERR_MODULE_NOT_FOUND` enquanto esse arquivo estiver ausente. Depois de criado o módulo, as asserções especificam os comportamentos que precisam passar.

## Execução

Requer Node.js 22 ou superior. Na raiz do repositório:

```bash
npm run check
npm test
```

`npm run check` valida a sintaxe do arquivo de testes. `npm test` executa os casos, após a implementação existir. As ferramentas usadas pertencem ao próprio Node.js e dispensam dependências de teste externas.

## Convenções do contrato

Os estados são objetos de dados serializáveis, com arrays comuns. As funções que realizam ações recebem o estado e retornam o próximo estado. Devem preservar o objeto recebido e seus arrays internos. Em ações inválidas, devem lançar uma exceção sem modificar o estado. Os testes aceitam qualquer classe de exceção quando usam `assert.throws`.

As funções e os campos abaixo formam a interface observável exigida pelos testes. Campos adicionais podem existir. As fixtures dos testes compõem situações específicas a partir do construtor e substituem campos públicos. A implementação deve tomar decisões com base nesses campos, de forma que as fixtures sejam utilizáveis. Helpers e geradores presentes no arquivo de testes servem à preparação dos cenários e às asserções.

## Especificação do desafio

Variante explicitamente definida de Ludo para **dois jogadores**, com **quatro peões por jogador**, pista comum de 52 casas e corredores finais exclusivos. As regras abaixo resolvem as variações não detalhadas no enunciado original.

- O jogador zero inicia. Um seis é necessário para retirar um peão da base. A saída posiciona o peão no início da pista.
- Após lançar, o jogador escolhe um peão elegível. Sem movimento legal, a vez passa automaticamente.
- Um seis concede novo lançamento depois da jogada. No terceiro seis consecutivo, apenas o lançamento atual é cancelado e a vez passa, preservando as duas jogadas anteriores.
- Capturar ou chegar ao destino não concede jogada extra. Uma jogada com seis continua concedendo o lançamento extra previsto acima.
- Captura ocorre somente ao terminar em uma casa comum ocupada por adversários. Todos os peões adversários nessa casa voltam à base.
- As posições globais seguras são `0, 8, 13, 21, 26, 34, 39, 47`. Nessas casas, peões adversários coexistem.
- Peões próprios podem compartilhar casas. Não há barreiras, e passar por uma casa ocupada não captura.
- A entrada no corredor é automática após completar o trecho comum. A chegada exige valor exato do dado. Movimentos que ultrapassam o destino são ilegais.
- Vence quem leva os quatro peões à chegada. Novas ações após vitória são rejeitadas.

### Representação das posições

| Progresso de cada peão | Significado |
|---|---|
| `-1` | Base |
| `0..51` | Pista comum, relativa ao ponto de partida do jogador |
| `52..56` | Corredor final exclusivo |
| `57` | Chegada |

O jogador zero inicia na posição global `0`, e o jogador um na posição global `26`. Para peões na pista comum, a posição global é `(início + progresso) % 52`. O corredor final é exclusivo de cada jogador e não participa dessa fórmula de captura.

### Interface exigida

| Exportação | Contrato |
|---|---|
| `createGame()` | Retorna quatro peões na base por jogador e turno zero. |
| `rollDice(game, value)` | Recebe um valor inteiro de 1 a 6 produzido pela interface ou por um sorteio externo. Registra o dado pendente ou passa a vez quando não houver movimento. Um segundo lançamento com dado pendente é rejeitado. |
| `movePiece(game, pieceIndex)` | Move o peão de índice `0..3` do jogador da vez utilizando o dado pendente. Faz captura, verifica vitória e atualiza turno. |

O estado contém `positions`, array das posições dos quatro peões dos dois jogadores, `turn`, `die` (dado pendente ou `null`), `consecutiveSixes`, `status` (`playing` ou `won`) e `winner` (`null`, `0` ou `1`). Consumir o dado sempre o devolve a `null`. Qualquer passagem de turno zera `consecutiveSixes`. Um lançamento diferente de seis também zera esse contador.

A função de lançamento recebe um valor explícito para permitir testes determinísticos. Uma interface pode gerar esse valor aleatoriamente antes de chamá-la.

## Funcionamento dos casos de teste

Cada caso usa `test(...)` para preparar um estado, realizar uma ação e comparar o resultado esperado com `assert`. Os identificadores abaixo correspondem aos nomes executados pelo Node.js.

| Caso | Comportamento verificado |
|---|---|
| LU01 | Inicia com dois jogadores, quatro peões na base e turno zero |
| LU02 | Sem seis e com todos na base passa a vez automaticamente |
| LU03 | Seis permite escolher um peão para sair da base na casa inicial |
| LU04 | Peão em pista avança o valor exato do dado e passa a vez |
| LU05 | Jogador um também inicia seu progresso em zero |
| LU06 | Base exige seis mesmo quando há outro peão capaz de mover |
| LU07 | Proíbe mover sem lançar ou lançar duas vezes com dado pendente |
| LU08 | Dado deve ser inteiro entre um e seis |
| LU09 | Índice de peão inválido é rejeitado |
| LU10 | Captura adversário em casa comum e devolve-o à base |
| LU11 | Captura usa os diferentes pontos de partida dos jogadores |
| LU12 | Casa segura permite coexistência sem captura |
| LU13 | Saída da base em casa inicial segura não captura adversário |
| LU14 | Permite empilhar peões próprios e cruzar casas ocupadas |
| LU15 | Captura todos os peões adversários na casa comum de destino |
| LU16 | Após progresso 51 entra no corredor exclusivo |
| LU17 | Peões em corredores próprios não capturam uns aos outros |
| LU18 | Chegada exige valor exato e não permite ultrapassagem |
| LU19 | Sem movimento possível no corredor passa automaticamente |
| LU20 | Peão que chegou não pode voltar a mover |
| LU21 | Terceiro seis consecutivo cancela somente o lançamento atual e passa a vez |
| LU22 | Lançamento diferente de seis zera a sequência |
| LU23 | Sexto sem movimento possível passa a vez e zera a sequência |
| LU24 | Quarto peão na chegada vence e bloqueia novas ações |
| LU25 | Ações válidas e inválidas preservam o estado de entrada |
| LU26 | Todas as oito casas seguras impedem captura |
| LU27 | Jogador um também vence ao levar seu quarto peão à chegada |

## Orientação para implementar a partir dos testes

1. Leia as regras, o contrato e todos os casos em `tests/game.test.js`.
2. Crie `src/game.js` como módulo ES e exporte a interface exigida.
3. Execute `npm test`, implemente cada comportamento e repita até todos os casos passarem.
4. Preserve os testes, os resultados esperados e as regras declaradas. Testes adicionais podem ser acrescentados para comportamentos novos compatíveis.
5. Uma interface visual pode usar as funções do módulo depois que as regras estiverem corretas.

## Estado da verificação desta entrega

A sintaxe dos testes foi verificada com Node.js. A execução na ausência de `src/game.js` foi conferida e apresenta a falha de importação esperada. A aprovação dos casos depende da implementação futura. A contagem de casos descreve o conjunto de especificações entregue.

## Entrega no GitHub

Crie um repositório público com o nome exato **`desafio_teste_ludo`**. Extraia o pacote e envie o conteúdo desta pasta para a raiz do repositório. O `README.md`, o `package.json` e a pasta `tests` devem aparecer diretamente nessa raiz.

O código dos testes fica em `tests/game.test.js`. O módulo futuro esperado fica em `src/game.js`.

Para uma dupla, cada integrante deve enviar suas próprias contribuições pelo GitHub e constar na seção de colaboradores. O histórico de alterações é o registro das contribuições.
