---
title: 浅尝 Windows Subsystem for Linux
date: 2016-11-30 11:00
tags: [Windows, WSL, Bash, tmux, mintty, wsltty]
---

## 安装/卸载/重置

## 启动目录



## 新建文件默认权限 - umask

```sh
touch test && ll test
```

```
-rw-rw-rw- 1 crzidea crzidea 0 Nov 30 11:45 test
```

```sh
umask # 0000
```

```sh
umask 022
```

```sh
rm test && touch test && ll test
```

```
-rw-r--r-- 1 crzidea crzidea 0 Nov 30 11:45 test
```

## 文件系统事件 - inotify
	
- 在 bash 环境下修改 /mnt/c 中的文件，也可使用这些事件。
- ~~在 Windows 环境中修改文件，不会触发事件~~。

## 互相访问

## 个性化终端 - bash.exe

- 颜色
- 字体
- 光标
  - 终端光标
  - vi 光标

## 中文字符

- bash.exe
- ConEmu
- mintty

## 个性化终端 - mintty

- mintty 需要从 [cygwin64](cygwin64) 提取
- [wsltty](https://github.com/mintty/wsltty)
- [wslbridge](https://github.com/rprichard/wslbridge/releases)

## 建议
