title: 使用 docker 测试 rethinkdb 的高可用和可扩展特性
date: 2016-07-19 17:40:41
tags: [scaling, sharding, replication, rethinkdb, docker]
---

rethinkdb 在高可用和扩展性方面做得出奇的好，而且非常好理解。这篇博客讲的只是如何使用 docker 对 rethinkdb 的这些特性做一些简单测试。

## 准备

首先确保有一台可以运行 docker 的机器。然后使用 docker 创建一个 rethinkdb 容器。

1. 获取 rethinkdb 镜像：
    ```sh
    docker pull rethinkdb
    ```
2. 创建 rethinkdb 容器（为了便于理解，所有命令行参数均使用全写）：
    ```sh
    docker run --publish-all --detach rethinkdb
    ```
3. 找出容器内 8080 端口映射到外部的端口（下面的例子中，被映射到外部的端口是 32780）：
    ```sh
    docker ps
    ```
    应该会得到类似下面的输出（此处已经把所有干扰列删除了）：
    ```
    CONTAINER ID    IMAGE        PORTS
    bce34ef8fc56    rethinkdb    0.0.0.0:32780->8080/tcp, 0.0.0.0:32779->28015/tcp, 0.0.0.0:32778->29015/tcp
    ```
4. 在你的本地浏览器中访问 rethinkdb 的 WebUI（此处的例子中，WebUI 的地址为 http://server:32780 ）。

## 扩展性

准确的说，我们会测试它的伸缩能力，即「增加节点」和「摘除节点」。

为了完整演示整个测试过程，需要再创建一个可以交互的容器，并把将创建的两个容器设置到同一个虚拟网络中：

```sh
docker run --publish-all --link bce34ef8fc56 --interactive --tty rethinkdb bash
```

### 增加节点

成功创建容器之后，我们会获得了一个来自容器的可以交互的终端。要增加节点，只需要在新容器内运行下面的命令：

```sh
rethinkdb --join bce34ef8fc56
```

再次感叹一下，扩展一个数据库服务的命令行就应该是这个样子，感谢 rethinkdb，把被各种小聪明玷污的工具逻辑还原出来了本来的面容。

### 平衡节点上的表

终于轮到 rethinkdb 的 WebUI 登场了。

1. 访问上文中创建好的 WebUI 服务（http://server:32780）
2. 打开「Data Explorer」标签页，分别给两个节点设置标签：
    ```js
    var config = r.db('rethinkdb').table('server_config');
    config.filter({name: 'bce34ef8fc56_iz6'}).update({tags: ['default', 'node_a']});
    config.filter({name: 'd72b193f46d5_jp6'}).update({tags: ['default', 'node_b']});
    ```
    **提示**：要查询`server_config`表中的内容，可以使用`config.filter({})`。
    **注意**：必须至少有一个`tags`包含`default`的节点，新创建的表会被分配到有`default`标签的节点上。
2. 创建两个表：
    ```js
    var test = r.db('test');
    test.tableCreate('table_a');
    test.tableCreate('table_b');
    ```
3. 查询表在各节点的分布情况：
    ```js
    r.db('rethinkdb').table('table_status')
    ```
    输出结果（已去除干扰信息）：
    ```js
    [{
      "name": "table_b",
      "shards": [{
        "primary_replicas": ["bce34ef8fc56_iz6"]
      }]
    }, {
      "name": "table_a",
      "shards": [{
        "primary_replicas": ["d72b193f46d5_jp6"]
      }]
    }]
    ```
    可以看到新创建的表已经被自动分布到了两个节点上。
4. 测试分布在不同节点上的表的连接查询
    1. 往`table_a`插入测试数据：
        ```js
        r.db('test').table('table_a').insert({key_a: 1});
        ```
        假设返回的新创建的记录`id`为`7415e20c-6fab-4813-85f0-f169c70699c9`
    2. 往`table_b`插入测试数据：
        ```js
        r.db('test').table('table_b').insert({
          key_b: 2,
          table_a_id: '7415e20c-6fab-4813-85f0-f169c70699c9'
        });
        ```
    3. 测试连接查询：
        ```js
        r.db('test').table('table_b')
        .eqJoin(
          'table_a_id',
          r.db('test').table('table_a')
        )
        ```
        输出结果：
        ```js
        [{
          "left": {
            "id": "2b9bebc7-bb98-45b8-9304-8a19479f4bcb",
            "key_b": 2,
            "table_a_id": "7415e20c-6fab-4813-85f0-f169c70699c9"
          },
          "right": {
            "id": "7415e20c-6fab-4813-85f0-f169c70699c9",
            "key_a": 1
          }
        }]
        ```
        由此可以得出结论，即使被查询的表分布在不同节点上，仍然可以使用连接查询。

### 强制摘除节点

要模拟「强制摘除节点」，只需要在容器的终端上按下`Ctrl + C`。

摘除节点之后，WebUI 会提示下面的内容：

> Table test.table_a is not available.
>
> None of the replicas for this table are reachable (the servers for these
> replicas may be down or disconnected).
> No operations can be performed on this table until at least one replica is
> reachable.

当然，这个时候执行上面的连接查询，也是会出错的：

> e: Cannot perform read: primary replica for shard ["", +inf) not available in:
> r.db("test").table("table_b").eqJoin("table_a_id", r.db("test").table("table_a"))

所以我们还是先恢复这个节点吧：

```sh
rethinkdb --join bce34ef8fc56
```

## 高可用

### 安全摘除节点

1. 将所有的表都调度到 node_a 上：
    ```js
    r.db('test').table('table_a').reconfigure({shards: 1, replicas: {node_a: 1}, primary_replica_tag: 'node_a'});
    r.db('test').table('table_b').reconfigure({shards: 1, replicas: {node_a: 1}, primary_replica_tag: 'node_a'});
    ```
    **注意**：切换主节点会造成指定的表短暂的无法访问。
2. 在容器的终端上再次按下`Ctrl + C`
3. 测试连接查询，现在不会出错了

### 替换主节点

1. 为了能在外部访问到用于替换主节点的节点上的服务，需要在启动服务的命令行上加一个参数：
    ```sh
    rethinkdb --join bce34ef8fc56 --bind-all
    ```
2. 然后使用在容器的宿主机上执行`docker ps`来查找容器内 8080
端口被映射到外部的端口。这里假设是 32786。
3. 访问 http://server:32786/#dataexplorer ，将所有的表调度到 node_b 上：
    ```js
    r.db('test').table('table_a').reconfigure({shards: 1, replicas: {node_b: 1}, primary_replica_tag: 'node_b'});
    r.db('test').table('table_b').reconfigure({shards: 1, replicas: {node_b: 1}, primary_replica_tag: 'node_b'});
    ```
4. 在宿主机上停掉之前的主节点：
    ```sh
    docker stop bce34ef8fc56
    ```
5. 在新节点上执行查询，没有任何报警

## 总结

整个测试过程搞完之后，对 rethinkdb 基本上可以有相当的信心了。没啥好说的，用 rethinkdb 完全不用担心分布式架构的问题了，所有的运维过程完全不需要 DBA 介入。

----

参考：[Scaling, sharding and replication](https://www.rethinkdb.com/docs/sharding-and-replication/)
