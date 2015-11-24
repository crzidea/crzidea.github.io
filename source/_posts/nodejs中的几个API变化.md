title: nodejs中的几个API变化
date: 2015-11-23 20:42:36
tags:
---

这些是后端该关注的，前端请按 Ctrl+W。

## Cluster

* [文档v0.12](https://nodejs.org/dist/v0.12.7/docs/api/cluster.html)
* [文档v5.1](https://nodejs.org/api/cluster.html)
* 相关模块：[PM2](https://github.com/Unitech/pm2)
* 应用场景：部署后端服务
* 关注原因：在v0.12中稳定性为 **2 - Unstable** 而在v5.1中已经变为 **2 - Stable**。换句话说，我们不必担心将它用在线上环境会产生bug了。

顺便打脸前段时间的一篇微博：[《当我们谈论 cluster 时我们在谈论什么(上)》](http://weibo.com/2214851453/D2pb28ybL?from=page_1005052214851453_profile&wvr=6&mod=weibotime&type=comment)，原文及下篇中显然没有意识到nodejs中已经悄悄更新了cluster的实现。
分发策略：

> The cluster module supports two methods of distributing incoming connections.
> The first one (and the default one on all platforms except Windows), is the round-robin approach, where the master process listens on a port, accepts new connections and distributes them across the workers in a round-robin fashion, with some built-in smarts to avoid overloading a worker process.
> The second approach is where the master process creates the listen socket and sends it to interested workers. The workers then accept incoming connections directly.
> The second approach should, in theory, give the best performance. In practice however, distribution tends to be very unbalanced due to operating system scheduler vagaries. Loads have been observed where over 70% of all connections ended up in just two processes, out of a total of eight.

设置分发策略：[cluster.schedulingPolicy](https://nodejs.org/api/cluster.html#cluster_cluster_schedulingpolicy)
最后看一下PM2中关于[cluster_mode的源码](https://github.com/Unitech/pm2/blob/master/lib/God/ClusterMode.js)，
可以得出结论：想省事，直接设置 `NODE_CLUSTER_SCHED_POLICY` 环境变量就够了。

## Buffer

* [文档v0.12](https://nodejs.org/dist/v0.12.7/docs/api/buffer.html#buffer_class_slowbuffer)
* [文档v5.1](https://nodejs.org/api/buffer.html#buffer_class_slowbuffer)
* 相关模块：所有涉及二进制处理的模块
* 应用场景：二进制处理、协议解析、字符编码转换
* 关注原因：新增3个ES6数组方法，以及迭代器文档

> [buffer.entries()](https://nodejs.org/api/buffer.html#buffer_buffer_entries)
> [buffer.keys()](https://nodejs.org/api/buffer.html#buffer_buffer_keys)
> [buffer.values()](https://nodejs.org/api/buffer.html#buffer_buffer_values)
> [ES6 iteration](https://nodejs.org/api/buffer.html#buffer_es6_iteration)

另外需要注意的是，Buffer的是实现在 **v0.8 => v0.10** 的升级中也发生过变化，所以在网上搜索 Buffer 相关文档的时候一定要留意nodejs的版本：
> Creating a typed array from a Buffer works with the following caveats:
>> 1. The buffer's memory is copied, not shared.
>> 2. The buffer's memory is interpreted as an array, not a byte array. That is, new Uint32Array(new Buffer([1,2,3,4])) creates a 4-element Uint32Array with elements [1,2,3,4], not a Uint32Array with a single element [0x1020304] or[0x4030201].
> NOTE: Node.js v0.8 simply retained a reference to the buffer in array.buffer instead of cloning it.
>
> While more efficient, it introduces subtle incompatibilities with the typed arrays specification. ArrayBuffer#slice() makes a copy of the slice while Buffer#slice()creates a view.
