---
title: 浅尝 Windows Subsystem for Linux
date: 2016-11-30 11:00
tags: [Windows, WSL, Bash, tmux, mintty, wsltty]
---

## 安装/卸载/重置

```ps
lxrun /?
```

## 目录结构

- `/` => `%localappdata%\Lxss\rootfs`
- `/mnt/c` => `C:\`

## 新建文件默认权限 - umask

目前 WSL 默认的新建文件默认权限存在问题。例如运行下面的命令：

```sh
touch test && ll test
```

输出结果：

```
-rw-rw-rw- 1 crzidea crzidea 0 Nov 30 11:45 test
```

可以看到 group 和 other 用户都默认拥有了写权限。这是因为 umask 没有被正确设置：

```sh
umask # 输出结果为 0000
```

要解决这个问题，需要在 bashrc 中手动加入下面一行命令
：
```sh
umask 022
```

重新打开终端后，重新执行上面的测试：

```sh
rm test && touch test && ll test
```

可以看到文件权限可以被正确设置了：

```
-rw-r--r-- 1 crzidea crzidea 0 Nov 30 11:45 test
```

## tmux 相关


## 文件系统事件 - inotify

```sh
sudo apt install -y inotify-tools
```

- 在 bash 环境下修改 /mnt/c 中的文件，也可使用这些事件。
- ~~在 Windows 环境中修改文件，不会触发事件~~。

## 使用 bash 启动 Windows 应用程序

```sh
export PATH=$PATH:/mnt/c/Windows/System32
notepad.exe
```

**注意**：被调用的 Windows 应用程序可能无法正确识别传入的路径参数，例如：

```sh
explorer.exe / # 无法正确识别 `/` 路径
```

## 个性化终端 - bash.exe

- 颜色
- 字体
- 光标
  - 终端光标
  - vi 光标

## 中文字符

默认的 bash 命令行程序可能会无法正确显示中文，建议使用 mintty/wsltty 作为日常使用的终端应用程序。

## 个性化终端 - mintty

### 安装

- mintty 需要从 [cygwin64](cygwin64) 提取
- [wsltty](https://github.com/mintty/wsltty)
- [wslbridge](https://github.com/rprichard/wslbridge/releases)

### 配置文件

下载[已经配置好的 Monokai 样式文件](https://github.com/crzidea/confbook/blob/master/.minttyrc)放入下面的目录，重新打开 mintty 即可：

```
%localappdata%\wsltty\home\%username%\
```

## 参考资料

- [Bash on Ubuntu on Windows - Release Notes](https://msdn.microsoft.com/en-us/commandline/wsl/release_notes)
