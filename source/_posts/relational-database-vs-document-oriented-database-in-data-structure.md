title: 从数据结构出发对比关系型数据库和文档型数据库
date: 2016-08-08 17:49:00
tags:
---

现在文档性数据库火的不行，动不动就听到谁家用了 MongoDB。但是当问及他们为什么选择 MongoDB 时，多数人都是一脸懵逼的表情。甚至有人给出下面一些荒唐的理由：

- **文档型数据库特别火，所以我们用它。**
    这就不用解释了。
- **文档性数据库不需要定义表结构，开发方便。**
    在一些高度工程化的项目中，即使采用文档性数据库，也是要定义文档结构的。另外，关系型数据库也有可以自动修改表结构的。
- **文档性数据库就是 JSON，对写 JS 的同学更友好。**
    「文档」不一定就是 JSON。常见的文档结构还有 XML、protobuf 等。所以文档型数据库不见得一定会对前端同学更友好。另外，一些关系型数据库也提供 JSON 格式的输出。

## 数据结构

### 关系型

关系型数据库最典型的数据结构是**表**。通常长下面这个样子：

Table A

| id | content |
|----|---------|
| 1  | test a  |
| 2  | test b  |

Table B:

| id | table_a_id | content |
|----|------------|---------|
| 1  | 1          | test c  |
| 2  | 1          | test d  |
| 3  | 2          | test e  |
| 4  | 2          | test f  |


### 文档型

文档性数据库最典型的数据结构，当然是**文档**。以 JSON 为例，通常长下面这个样子：


Collection A:

```js
[
    {
        "id": 1,
        "content": "test a"
    },
    {
        "id": 2,
        "content": "test b"
    }
]
```

Collection B:

```js
[
    {
        "id": 1,
        "collection_a_id": 1,
        "content": "test c"
    },
    {
        "id": 2,
        "collection_a_id": 1,
        "content": "test d"
    },
    {
        "id": 3,
        "collection_a_id": 2,
        "content": "test e"
    },
    {
        "id": 4,
        "collection_a_id": 2,
        "content": "test f"
    }
]
```

## 使用场景

### 文档性

#### 经常进行连接查询

我们要对上面的 A 和 B 进行连接查询，关系型数据库返回的是两个表的笛卡尔积：

| id | content | table_b.id | table_b.table_a_id | table_b.content |
|----|---------|------------|--------------------|-----------------|
| 1  | test a  | 1          | 1                  | test c          |
| 1  | test a  | 2          | 1                  | test d          |
| 2  | test b  | 3          | 2                  | test e          |
| 2  | test b  | 4          | 2                  | test f          |

上表中的第 2 行和第4 行都是冗余的。这种现象在复杂的连接查询中会被放大的很可怕。我们有的业务在一次查询中连接了 12 张表，冗余的数据可不止一个`A.content`字段这么简单。

这种情况下再来看看文档性数据库的返回结果，就非常合理了：


```js
[
    {
        "left": {
            "id": 1,
            "content": "test a"
        },
        "right": [
            {
                "id": 1,
                "collection_a_id": 1,
                "content": "test c"
            },
            {
                "id": 2,
                "collection_a_id": 1,
                "content": "test d"
            }
        ]
    },
    {
        "left": {
            "id": 2,
            "content": "test b"
        },
        "right": [
            {
                "id": 3,
                "collection_a_id": 2,
                "content": "test e"
            },
            {
                "id": 4,
                "collection_a_id": 2,
                "content": "test f"
            }
        ]
    }
]
```

也有冗余，但是冗余的是字段的 key，完全是可控的。假如使用 protobuf 提前定义好结构，这种冗余甚至会被消除。

#### 同一个表不同记录的数据结构经常不一样

假如你的表中存在很多互斥的字段，文档型数据库可能更适合你的系统。例如你又这样一张表：


| id | x    | y    | z    |
|----|------|------|------|
| 1  | 1    | null | null |
| 2  | null | 2    | null |
| 3  | null | null | 3    |
| 4  | null | null | null |

商标中`x`、`y`、`z`字段在每条记录张最多出现一次，然而`null`依然需要在存储或传输的时候占位。

这种时候，相比之下采用文档性数据库会更合理：

```js
[
    {
        "id": 1,
        "x": 1
    },
    {
        "id": 2,
        "x": 1
    },
    {
        "id": 3,
        "x": 1
    },
    {
        "id": 4
    }
]
```

### 关系型

除上述几种情况外，关系型数据库往往会更适合你的系统。
