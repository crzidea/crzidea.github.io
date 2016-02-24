title: 不要人言亦言，合理处理 nodejs 的内存问题
date: 2016-02-24 15:21:09
tags: node javascript memory leak
---

很多人都说 nodejs 的 GC 特别渣，我也觉得渣。例如：

* [shadowsocks 作者因为不满 nodejs 的 GC，直接放弃了维护 node 版本](https://github.com/shadowsocks/shadowsocks-nodejs)
  > The GC of node.js sucks.
  
  > Python version handles 5000 connections with 50MB RAM while node.js version handles 100 connections with 300MB RAM. Why should we continue to support node.js?
* [很多新人都认为 nodejs 的 GC 并不科学，不适用于生产环境](http://stackoverflow.com/questions/5603011/node-js-and-v8-garbage-collection)
  > If this is running for production code, that's a few seconds for 10,000 users.
  
  > Is this really acceptable in production environment?
* 我心眼目睹的一个项目直接断言 nodejs 不适合处理计算密集型的任务，把用 nodejs 做好的服务换成了 java


但是要明确一点：***怎么用/用成什么样,和 nodejs、v8、项目都没有关系。大部分的问题来自于开发者自己。***用不好不能怨别人。

## 什么时候会遇到内存问题

对比一下下面的两端代码：

```
function notLeakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
}

for (var i = 0, l = 16; i < l; i++) {
  notLeakMemory()
}
```

```
function leakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData // leak
  }, 0)
}
for (var i = 0, l = 16; i < l; i++) {
  leakMemory()
}
```

