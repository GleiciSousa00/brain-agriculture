# Plano de execução das consultas do painel

Arquivo gerado por `pnpm medir:painel`, que abre o painel pela API, captura o SQL que a
aplicação executou e pede ao Postgres que o explique. Não editar à mão.

Medição de 2026-09-10, contra `PostgreSQL 17.11`.
Origem: pipeline, https://github.com/GleiciSousa00/brain-agriculture/actions/runs/34487627592.

## Volume medido

| Tabela | Linhas |
| --- | ---: |
| produtores | 3 |
| propriedades | 1.005 |
| culturas | 10 |
| safras | 10 |
| plantios | 100.010 |

## O que cada plano faz

| Consulta | Leitura do plano | Tempo |
| --- | --- | ---: |
| Contagem de Propriedades, soma da Área Total e Uso do Solo | varre a tabela propriedades inteira | 0.290 ms |
| Propriedades por estado | percorre só o índice `ix_propriedades_estado`, sem tocar a tabela propriedades | 0.294 ms |
| Plantios por Cultura, todas as Safras | percorre só o índice `ix_plantios_cultura`, sem tocar a tabela plantios | 12.249 ms |
| Nomes das Culturas, por chave primária | varre a tabela culturas inteira | 0.015 ms |
| Plantios por Cultura, recortados por Safra | percorre só o índice `ix_plantios_safra_cultura`, sem tocar a tabela plantios | 1.321 ms |

Uma agregação sem filtro lê a tabela inteira por definição, e o que o índice compra nesse
caso é ler só o índice, que é mais estreito do que a tabela e dispensa tocá-la. O recorte
por Safra é o único em que o índice também descarta linha, e por isso é o único que a
medição cobra como portão.

## Contagem de Propriedades, soma da Área Total e Uso do Solo

```sql
SELECT COUNT(*) AS "propriedades", COALESCE(SUM("propriedade"."area_total"), 0) AS "areaTotal", COALESCE(SUM("propriedade"."area_agricultavel"), 0) AS "areaAgricultavel", COALESCE(SUM("propriedade"."area_de_vegetacao"), 0) AS "areaDeVegetacao" FROM "propriedades" "propriedade"
```

```
Aggregate  (cost=34.11..34.12 rows=1 width=104) (actual time=0.256..0.256 rows=1 loops=1)
  Buffers: shared hit=14
  ->  Seq Scan on propriedades propriedade  (cost=0.00..24.05 rows=1005 width=17) (actual time=0.004..0.078 rows=1005 loops=1)
        Buffers: shared hit=14
Planning Time: 0.056 ms
Execution Time: 0.290 ms
```

## Propriedades por estado

```sql
SELECT "propriedade"."estado" AS "estado", COUNT(*) AS "propriedades" FROM "propriedades" "propriedade" GROUP BY "propriedade"."estado" ORDER BY COUNT(*) DESC, "propriedade"."estado" ASC
```

```
Sort  (cost=29.16..29.23 rows=27 width=11) (actual time=0.230..0.231 rows=27 loops=1)
  Sort Key: (count(*)) DESC, estado
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=5
  ->  GroupAggregate  (cost=0.15..28.52 rows=27 width=11) (actual time=0.038..0.192 rows=27 loops=1)
        Group Key: estado
        Buffers: shared hit=2
        ->  Index Only Scan using ix_propriedades_estado on propriedades propriedade  (cost=0.15..23.23 rows=1005 width=3) (actual time=0.029..0.110 rows=1005 loops=1)
              Heap Fetches: 0
              Buffers: shared hit=2
Planning:
  Buffers: shared hit=21
Planning Time: 0.122 ms
Execution Time: 0.294 ms
```

## Plantios por Cultura, todas as Safras

```sql
SELECT "plantio"."cultura_id" AS "culturaId", COUNT(*) AS "plantios" FROM "plantios" "plantio" GROUP BY "plantio"."cultura_id" ORDER BY COUNT(*) DESC, "plantio"."cultura_id" ASC
```

```
Sort  (cost=2328.76..2328.78 rows=10 width=24) (actual time=12.214..12.215 rows=10 loops=1)
  Sort Key: (count(*)) DESC, cultura_id
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=82
  ->  GroupAggregate  (cost=0.29..2328.59 rows=10 width=24) (actual time=1.242..12.196 rows=10 loops=1)
        Group Key: cultura_id
        Buffers: shared hit=82
        ->  Index Only Scan using ix_plantios_cultura on plantios plantio  (cost=0.29..1828.44 rows=100010 width=16) (actual time=0.030..5.848 rows=100010 loops=1)
              Heap Fetches: 0
              Buffers: shared hit=82
Planning Time: 0.051 ms
Execution Time: 12.249 ms
```

## Nomes das Culturas, por chave primária

```sql
SELECT "CulturaOrmEntity"."id" AS "CulturaOrmEntity_id", "CulturaOrmEntity"."nome" AS "CulturaOrmEntity_nome" FROM "culturas" "CulturaOrmEntity" WHERE (("CulturaOrmEntity"."id" IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)))
```

```
Seq Scan on culturas "CulturaOrmEntity"  (cost=0.03..1.18 rows=10 width=23) (actual time=0.007..0.008 rows=10 loops=1)
  Filter: (id = ANY ('{f0a017bb-9bb3-44c6-ac6e-c348974870a0,96635806-2331-4a1c-9a19-70026f0946be,6fb86da4-60b2-4297-b689-2b4b4d2cafe5,458744bb-660b-45ca-b25c-e51bed897c26,069649bf-766d-4742-a475-cf34de164c19,2321c713-45e3-4096-9eb1-426313c1010d,84ec5974-d7fc-4bb6-8e4a-87dd509e3c36,9f66360b-0c28-463e-b317-6f354043aefa,f2ca1fa7-3789-4b3d-bbf7-2a7333c8870e,fe74315d-912e-4dba-bf23-532a7437c57b}'::uuid[]))
  Buffers: shared hit=1
Planning Time: 0.050 ms
Execution Time: 0.015 ms
```

## Plantios por Cultura, recortados por Safra

```sql
SELECT "plantio"."cultura_id" AS "culturaId", COUNT(*) AS "plantios" FROM "plantios" "plantio" WHERE "plantio"."safra_id" = $1 GROUP BY "plantio"."cultura_id" ORDER BY COUNT(*) DESC, "plantio"."cultura_id" ASC
```

```
Sort  (cost=274.82..274.85 rows=10 width=24) (actual time=1.285..1.286 rows=10 loops=1)
  Sort Key: (count(*)) DESC, cultura_id
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=12
  ->  GroupAggregate  (cost=0.29..274.66 rows=10 width=24) (actual time=0.150..1.260 rows=10 loops=1)
        Group Key: cultura_id
        Buffers: shared hit=12
        ->  Index Only Scan using ix_plantios_safra_cultura on plantios plantio  (cost=0.29..223.39 rows=10234 width=16) (actual time=0.025..0.613 rows=10006 loops=1)
              Index Cond: (safra_id = 'f587da1f-1e78-4ea9-ae32-b05503998ccc'::uuid)
              Heap Fetches: 0
              Buffers: shared hit=12
Planning Time: 0.059 ms
Execution Time: 1.321 ms
```

