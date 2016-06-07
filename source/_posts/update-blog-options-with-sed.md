title: 使用 sed 修改博客配置项
date: 2016-05-12 16:47:01
tags: [sed, range, replace, shell, array, date]
---

伸手党请跳至本文最后一条命令。

## `sed`基本用法

提到`sed`，我之前用的最多的用法大概就是：

```sh
sed 's/old-word/new-word/g' file
```

例如，有一篇博客的文件如下：

```text
---
title: 使用 sed 修改博文配置
date: 2016-05-12 16:47
status: draft
tags: [sed, range, replace, shell, array]
---

博文开始
...
```

每次上线的时候，都要将上面文件内容的`status`选项由`draft`修改为`public`:

```sh
sed 's/^status:.*/status: public/' blog.md
```

## 使用`shell`的模板字符串

但是当我们需要修改时间的时候，又要怎么做呢？
这个时候另一个命令行工具就需要登场了：`date`。

例如，需要按照上面文件内容中的时间格式，输出当前的时间，可以这样搞：

```sh
date +'%Y-%m-%d %H:%M'
```

把上面的执行结果放入到我们的`sed`参数中，修改时间的脚本就成了。
模板字符串使用双引号，这一点和 php 非常相似。

```sh
sed "s/^date:.*/date: $(date +'%Y-%m-%d %H:%M')/" blog.md
```

到这里，我们要替换内容的功能，基本上都已经实现了。如果我是一个不严肃、懒惰的工程师，下面的内容可能就不会存在了。

## 查找边界

上面的脚本里存在的问题在于，如果你的博客的内容中出现了`^update:.*`或`^date:.*`可以匹配到的行，内容就会被错误的修改。例如本篇博客就已经存在这种情况了。

```text
---
title: 使用 sed 修改博文配置
date: 2016-05-12 16:47:01
status: draft
tags: [sed, range, replace, shell, array]
---

博文开始

update: xxxx-xx-xx xx:xx
status: test
...
```

实际上，这里只需要修改两个`---`之间的内容。
那么问题就变成了：「如何找出前两个`---`的行号？」这地方我绕了一个弯路，下面会解释。
查找行号的方法：

```sh
grep -n '^---\s*$' blog.md
```

输出的文本虽然对人可读，但是无法直接用它来编程，所以需要处理一下：

```sh
head_range_string=$(
  grep -n '^---\s*$' blog.md |\
  head -n 2 |\
  awk -F ':' '{print $1}'
)
```

处理之后，变量中就只剩下了对我们有用的字符串了。但是字符串毕竟是**一个**变量，想从里面获取到那个数字是开始行号，那个数字是结束行号，还是需要再做一次处理：

```sh
head_range_array=($head_range_string)
head_start=${head_range_array[0]}
head_end=${head_range_array[1]}
```

## 在`sed`的命令中标记边界

把得到的变量放到`sed`的脚本里，边界的问题就可以解决了：

```sh
sed -i '' "${head_start},${head_end} s/^status:.*/status: public/" blog.md
sed -i '' "${head_start},${head_end} s/^date:.*/date: $(date +'%Y-%m-%d %H:%M')/" blog.md
```
（`-i`参数的作用是在原文件操作，结果不输出到终端。）

## `sed`批处理

上面的脚本中，调用了两次`sed`，实际上会有 4 次 IO（两次读文件，两次写文件）。加入我们要修改的配置项更多，调用次数也会更多。
实际上，`sed`是支持再一次执行中，处理多条命令（command）的。修改后的版本：

```sh
sed -i '' "${head_start},${head_end} { s/^date:.*/date: $(date +'%Y-%m-%d %H:%M')/; s/^status:.*/status: publish/; }" blog.md
```

## 让`sed`自己查找边界

上面说饶了一点弯路，实际上我们其实不需要用`grep`+`head`+`tail`+`awk`+`array`的组合来查找边界，`sed`自己就可以根据正则来匹配：

```sh
sed -i '' "/^---/,/^---/ { s/^date:.*/date: $(date +'%Y-%m-%d %H:%M')/; s/^status:.*/status: publish/; }" blog.md
```

所以刚才写了这么多，最后只用这一条命令就够了。
