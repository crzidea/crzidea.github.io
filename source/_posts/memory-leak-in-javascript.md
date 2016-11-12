title: 不要人言亦言，合理处理 nodejs 的内存问题
date: 2016-02-24 15:21:09
tags: [nodejs, javascript, memory leak]
---

很多人都说 nodejs 的 GC 特别渣，我也觉得渣。例如：

* [shadowsocks 作者因为不满 nodejs 的 GC，直接放弃了维护 node 版本](https://github.com/shadowsocks/shadowsocks-nodejs)
  > The GC of node.js sucks.

  > Python version handles 5000 connections with 50MB RAM while node.js version handles 100 connections with 300MB RAM. Why should we continue to support node.js?
* [很多新人都认为 nodejs 的 GC 并不科学，不适用于生产环境](http://stackoverflow.com/questions/5603011/node-js-and-v8-garbage-collection)
  > If this is running for production code, that's a few seconds for 10,000 users.

  > Is this really acceptable in production environment?
* 我亲眼目睹的一个项目直接断言 nodejs 不适合处理计算密集型的任务，把用 nodejs 做好的服务换成了 java
* 尤其是最近用写了一个[分析数据的项目](https://github.com/crzidea/index-net)，发现50M的文本数据被转来转去之后，竟然被 node 进程吃掉3G的内存然后自己死掉了。

但是要明确一点：***怎么用/用成什么样,和 nodejs、v8、项目都没有关系。大部分的问题来自于开发者自己。***用不好不能怨别人。

## 什么时候出现内存泄露

对比一下下面的两段代码：

```js
function notLeakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
}

for (var i = 0, l = 16; i < l; i++) {
  notLeakMemory()
}
```

```js
function leakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData   // leak
  }, 3600000) // 1 hour
}
for (var i = 0, l = 16; i < l; i++) {
  leakMemory()
}
```

分别运行一下就会知道，`notLeakMemory()`跑个一年半载也不会出现进程挂掉的情况，而`leakMemory()`运行16次之后进程就挂掉了（以下是最后的错误输出）。

```
<--- Last few GCs --->

   41914 ms: Scavenge 2179.9 (2217.4) -> 2179.9 (2217.4) MB, 0.3 / 0 ms (+ 9.5 ms in 1 steps since last GC) [allocation failure] [incremental marking delaying mark-sweep].
   42584 ms: Mark-sweep 2179.9 (2217.4) -> 2051.8 (2089.4) MB, 670.5 / 0 ms (+ 18.5 ms in 7 steps since start of marking, biggest step 9.5 ms) [last resort gc].
   43285 ms: Mark-sweep 2051.8 (2089.4) -> 2051.8 (2089.4) MB, 701.1 / 0 ms [last resort gc].


<--- JS stacktrace --->

==== JS stack trace =========================================

Security context: 0x3bc199de3ac1 <JS Object>
    1: /* anonymous */(aka /* anonymous */) [vm.js:39] [pc=0x27aef1c738fe] (this=0x3bc199d04189 <undefined>,code=0x670b6007161 <String[5]: Debug>)
    2: ensureDebugIsInitialized(aka ensureDebugIsInitialized) [util.js:194] [pc=0x27aef1c7379b] (this=0x3bc199d04189 <undefined>)
    3: inspectPromise(aka inspectPromise) [util.js:200] [pc=0x27aef1c73441] (this=0x3bc199d04189 <undefined>,p=0xe72ae11...

FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory
```

## 为什么会出现内存泄漏

一句话概括：*当存在**可被访问的函数**引用了**函数外的变量**之后，该变量不会被**自动回收**。*

## 如何避免/修复内存泄漏

上面的这句话虽然短，但是有几个地方是可以留意并修复避免/修复内存泄漏的。

### “可被访问的函数”

当函数不再是“可被访问的”，引用的变量也会被释放。举个例子，把上面出错代码中的延时从3600000调整为0：

```js
function leakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData
  }, 0) // run now!
}
for (var i = 0, l = 16; i < l; i++) {
  leakMemory()
}
// no error any more
```

匿名函数被`setTimeout()`调用之后，该函数的引用将被`setTimeout()`删除，此时匿名函数就不再是“可被访问的函数”了，所以变量占用的空间会被自动回收掉，就不会造成`process out of memory`的错误了。

除了`setTimeout()`之外，还有一些场景会自动删除函数引用：

* 使用`clearInterval()`/`clearTimeout()`清除了创建的`timer`。
  ```
	function leakMemory() {
	  var bigData = Array(1024 * 1024 * 16).map(() => 0)
	  var timer = setTimeout(() => {
	    bigData
	  }, 3600000)
	  clearTimeout(timer)
	}

	for (var i = 0, l = 16; i < l; i++) {
	  leakMemory()
	}
  ```
* 数组的方法（例如`.forEach()`、`.map()`等）也会在运行完函数之后删除回调函数的引用。
  ```
	function leakMemory() {
	  var bigData = Array(1024 * 1024 * 16).map(() => 0)
	  var array = [1, 2]
	  array.map(() => {
	    bigData
	  })
	}

	for (var i = 0, l = 16; i < l; i++) {
	  leakMemory()
	}
  ```

### “函数外的变量”

这一点比较好理解，假如我们不访问函数外的变量，也不会造成内存泄露。

```js
function leakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    var bigData // prevent leak
  }, 3600000)
}
for (var i = 0, l = 16; i < l; i++) {
  leakMemory()
}
// no error any more
```

### “自动回收”

当变量 GC 不能被自动回收时，我们需要手动将变量释放掉：

```js
function leakMemory() {
  var bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData        // bigData no longer holds big data
  }, 3600000)
  setTimeout(() => {
    bigData = null // release resource
  },0)
}
for (var i = 0, l = 16; i < l; i++) {
  leakMemory()
}
// no error any more
```

## 灵丹妙药

* 如果遇到和`v8`、`gc`相关的参数问题，首先使用`node --v8-options | less`获得帮助
* 不要过早优化内存使用。1.7G 内存不够用时，尝试使用`--max_old_space_size`调整老生区大小。
* 调大新生区，可以减少 GC 阻塞进程的时间。可以通过`--max_new_space_size`设置
* 使用`--trace_gc`参数查看 GC 的活动情况。
* 使用 [node-inspector](https://github.com/node-inspector/node-inspector) 的内存快照功能，可以分析出不正常的内存使用。
* 当且仅当 node 进程需要**给系统中其他进程让出内存**时，使用`--expose_gc`参数，手动调用`gc()`。我仍然相信绝大多数时候你不需要使用它。
* 除了上述提到的几个示例外，[这里还有一些JavaScript内存泄漏的典型示例](https://github.com/crzidea/crzidea.github.io/tree/edit/example/memory-leak)。
