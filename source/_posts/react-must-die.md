title: 为什么我要唱衰 React
date: 2016-07-22 18:26:24
tags: [React, javascript]
---

其实对于 React 的态度，我一直是比较明确的。但是最近有不少人跟我聊这个事情，我想还是有些点需要总结的。

## 我们为什么需要 React？

这是一个来自[知乎](https://www.zhihu.com/question/47161776)的问题。

实际上，大部分人在用 React 的时候，用到的是两个特性：

1. 虚拟 DOM
2. 组件化

至于其他的伪特性，我认为是有些同学「一瓶子不满，半瓶子咣当」，意淫出来的。这些伪特性包括：

1. **跨平台**。虽然 ReactNative 可以在多个平台上使用，但是 ReactNative 并没有封装不同系统的 API。从这方面来说，这货甚至连 weex 都不如。
2. **更易于组织逻辑**。这明显是 flux/redux 做的事情。而且 redux 已经明确说明了，不仅仅适用于 React，其他框架也可以用 redux。

## 我们真的需要上述的两个特性吗？

### 虚拟 DOM

虚拟 DOM 解决了频繁操作 DOM
产生的性能问题。那么下面几项事实必定会导致这一特性「没有前途」：

1. 设备的硬件性能会越来越好，性能在将来不再是问题。
2. 假如说我们要解决性能问题，相比虚拟 DOM，下面几个解决方案会更好：
    1. 浏览器实现虚拟 DOM。而且这也是虚拟 DOM 被应用的正确场景和姿势。
    2. 再操作数据的地方做 diff，而不是在虚拟 DOM 的基础上做 diff。这是才是
       cache/diff 的正确用法。

所以我认为虚拟 DOM 必定是「没有前途」的。

### 组件化

组件化有一个很重要的目的是为了提高开发效率。再来看一下使用 React 开发效率高吗？

> 民间：想加班就用 React

为了说明 React 的开发效率，不妨点开两个链接看一下代码行数。下面两个链接都实现了一个聊天应用，完全一样的功能：

* [React 版本：187 行](https://github.com/rethinkdb/horizon/blob/next/examples/react-chat-app/dist/app.jsx)
* [Riot 版本：53 行](https://github.com/rethinkdb/horizon/blob/next/examples/riotjs-chat-app/dist/chat.tag)

你还需要啥理由丢弃 React？

## 感谢 React

虽然我并不认同 React 的一些解决问题的方法，甚至觉得它「没有前途」，但是 React 对行业做出的贡献是众所周知的。最后还是感谢 facebook 工程师的贡献。
