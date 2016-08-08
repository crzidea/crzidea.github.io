title: 在 HTTPS 站点使用 jiathis
date: 2016-08-02 18:40:05
tags: [share, https]
---

> 我的反向代理服务器 IP 被屏蔽了，大家都洗洗睡吧，太恶心了，不提供 HTTPS 也不让别人提供。
> 我已经换成了多说的分享插件。

---

三步搞定：

1. 需要一个 https 的反向代理，懒得建的话，可以直接用我的：
    [//v3-jiathis-com-proxy.crzidea.com/code/jia.js](//v3-jiathis-com-proxy.crzidea.com/code/jia.js)。
2. 在全局配置变量中，设置`do_not_track: true`。可以干掉发往 id.jiathis.com 域的请求。
    ```js
    var jiathis_config={
        summary:"",
        shortUrl:false,
        hideMore:false,
        do_not_track: true // 干掉发往 id.jiathis.com 域的请求
    }
    ```
3. 禁用分享计数器，把类名包含`jiathis_counter_style`的 HTML 元素删掉即可。可以干掉发往 i.jiathis.com 域的请求。
