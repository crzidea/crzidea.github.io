title: RestQL：现代化的 API 开发方式
date: 2016-08-12 11:26
tags: [nodejs, koa, sequelize, RESTful, 企业平台, 前端]
---


> 本文已在[美团点评技术博客](http://tech.meituan.com/koa-restql.html)发表，谢绝转载！

> koa-restql 已经在 [github][koa-restql] 开源并在 [npm][koa-restql-npm] 发布。感兴趣的同学可以前往围观一下。欢迎 Pull Request，同时热烈欢迎 Star。

在现代的业务系统中，后端开发工作基本上可以被拆分为三项：

* **接口鉴权**。例如拍段是不是当前系统的用户，以及该用户是否有权限访问接口。
* **与其他系统的交互**。例如调用第三方的服务，或内部搭建的其他服务。
* **数据操作**。基本上所有需要持久化存储的系统都会在这项工作上耗费大量时间。

本文将介绍如何利用 RestQL 来非常有效地减少「数据操作」相关的工作量。

## 现状与挑战

我们先来做个假设。

* 假设系统中有 60 张表，每张表对应的接口都要有四种 CRUD 的 API。那么就需要后端工程师写`60 * 4 = 240`个API。
* 假设上述 60 张表中，40 张表存的是资源类的数据，其余 20 张表为关系类的数据，也就是说每张表和 20 张表都要进行关联，每个关联也需要四种 CRUD 操作，那么又要增加`40 * 20 * 4 = 3200`个API。

所以在上述假设场景中，后端工程师要编写 3200 + 240 = 3440 个 API。而且这还不是全部。假如后端代码需要 100% 的测试覆盖，那么工程师们就要写至少 3440 个测试！

> 60 张表 = 3440 个 API + 3440 个单元测试

众所周知，数据操作 API 的实现过程基本上是重复的，有的同学甚至认为这是低端的，体现不出工程师价值的工作，纯粹的「体力活」。但是却没有一个能真正解放生产力的方案。

## 解决思路

尽管我们把数据库抽象成了「关系型」数据库，把操作数据的命令抽象成了 SQL ，同时我们也有了 MySQL 客户端，甚至是 sequelize 这种非常方便的库，也有「RESTful」API 命名规则，但是接口的实现从来都是需要工程师们自己用手敲出来的。

> 如果说我看得比别人远，那是因为我站在巨人的肩膀上。

所以我们在现有的技术基础上再抽象，把已有的东西重新组合起来，拼装成一个新的工具，帮助工程师从「体力活」中解脱出来，解放生产力。

### 什么样的工具

最开始的时候，我们最先需要明确的问题就是：「我们需要什么样的工具？」或者说「这种工具要帮我们解决什么问题？」。

实际上我们从刚才的假设中，已经可以得出结论：我们希望有一个工具可以让工程师免于编写数据操作 API，***把数据库操作直接映射到 HTTP RESTful API 上***。

## 调用方式

### 如何请求

为了解释「如何请求」，我们先从一些公认的规则出发，举一个例子，然后再从例子中抽象出一些规则。

**注意**：为了更便于理解，我们把所有的命名从客户端一直穿透到数据库，所以请不要纠结于我们在定义一个 API 时名词单复数的问题。

#### 基本用例

几乎所有的系统都会有一个用户表（user）。根据 RESTful 规则的约定，我们应该把访问 user 表的 API 路径定义为 `/user`，并把 CRUD 的访问方法映射到 HTTP 协议中的四种方法：`GET`、`POST`、`PUT`、`DELETE`。

比如：

* `GET /user`：获取用户列表，应该返回一个数组。
* `GET /user/:id`：获取指定的用户，应该返回一个对象。
* `POST /user`：创建一个用户，应该返回被存储的对象，状态码应该为 201(Created)。
* `PUT /user`：修改一个用户的信息，应该返回修改后的对象。
* `DELETE /user/:id`：删除一个用户，状态码应该为 204(No Content)。

如果 user 表有一个关系表 feed，那么我们的路径就会再复杂一点：

* `GET /user/:id/feed` 或 `GET /feed?user_id=:id`：获取某个用户的帖子，应该返回一个数组。
* `GET /user/:id/feed/:feed_id` 或 `GET /feed/:id`：获取指定的帖子，应该返回一个对象。

上述的例子中还会衍生出其他的数据操作，不仅仅只有 `GET`，这里不一一列举了。

#### 抽象出规则

上一节中，列举了要提供一个表的数据访问 API，大概要实现哪些路由。从这些枚举中，可以找出其中的规律，总结出一套规则。最终我们在「**把能实现的路由，全部实现**」的原则基础上，开发了 RestQL 的 koa 版本。

支持的 HTTP 方法：

HTTP verb | CRUD
--------- | -------------
GET       | Read
POST      | Create
PUT       | Create/Update
DELETE    | Delete


支持的带有 body 的 HTTP 方法：

HTTP verb | List         | Single
--------- | ------------ | ------
POST      | Array/Object | ×
PUT       | Array/Object | Object

**说明**：

* `List` 路径为返回值为数组的路径，包括：
    * `/resource`
    * `/resource/:id/association`, association 为 `1:n` 关系
    * `/resource/:id/association`, association 为 `n:m` 关系
* `Single` 路径为返回值为单个对象的路径，包括：
    * `/resource/:id`
    * `/resource/:id/association`, association 为 `1:1` 关系
    * `/resource/:id/association/:id`, association 为 `1:n` 关系
    * `/resource/:id/association/:id`, association 为 `n:m` 关系

### 如何使用

我们已经开源了 koa-restql，koa 应用开发者可以通过 npm 安装它：

```sh
npm install koa-restql
```

然后在 koa 应用的代码中引用 RestQL：

```js
const koa       = require('koa')
const RestQL    = require('koa-restql')

let app = koa()
// Build APIs from `sequelize.models`
let restql = new RestQL(sequelize.models)
app.use(restql.routes())
```

## 常见问题

### 修改参数

用户可以通过`querystring`来修改参数。强烈建议使用`qs`对 querystring 进行解析，例如：

```js
qs.stringify({a: 1, b:2}) // => a=1&b=2
```

RestQL 中的`querystring`仅有 3 条规则：

-  所有不以`_`开头的建，都会被放进`sequelize#query()`的`where`参数中。例如：

    ```js
    // query
    {
      name: "Li Xin"
    }
    // option for sequelize
    {
      where: {
        name: "Li Xin"
      }
    }
    ```

- 所有以`_`开头的建，都会被放进`sequelize#query()`的参数中，和`where`保持平级。例如：
    ```js
    // query
    {
      _limit: 10
    }
    // option for sequelize
    {
      limit: 10
    }
    ```
- 当需要使用关系时，可以用关系名称的字符串代替关系对象传入。例如需要使用`include`时：

    ```js
    // query
    {
      _include: ['friends']
    }
    // option for sequelize
    {
      include: [
        models.user.association.friends
      ]
    }
    ```

### 访问控制

通常来说，我们有两种方法实现访问控制：

#### 通过中间件

在 koa 应用挂载 RestQL 的 router 之前，可以实现一个鉴权中间件，控制用户的访问权限：

```js
app.use(authorizeMiddleware)
app.use(restql.routes())
```

![Authorize Middleware](/img/koa-restql-authorize-middleware.jpeg)

#### 通过 restql 参数

在使用`sequelize`定义关联时，我们可以设定`restql`参数，实现访问控制。例如：

- 禁止通过`restql`访问关联：

    ```js
    models.user.hasOne(
      models.privacy,
      {
        restql: {
          ignore: true
        }
      }
    )
    ```

- 禁止通过`restql`使用指定的 HTTP 方法访问关联

    ```js
    models.user.hasOne(
      models.privacy,
      {
        restql: {
          ignore: ['get']
        }
      }
    )
    ```

#### 其他语言/框架

目前我们仅实现了基于`node`和`koa`的版本，还没有其他语言/框架的实现版本。欢迎开发者提交其他语言/框架的实现到 [RestQL 组][restql]。

## 参考链接

- GitHub, [koajs/koa](https://github.com/koajs/koa)
- GitHub, [sequelize/sequelize](https://github.com/sequelize/sequelize)
- GitHub, [meituan-dianping/koa-restql][koa-restql]

[koa-restql]: https://github.com/Meituan-Dianping/koa-restql
[restql]: https://github.com/RestQL
[koa-restql-npm]: https://www.npmjs.com/package/koa-restql
