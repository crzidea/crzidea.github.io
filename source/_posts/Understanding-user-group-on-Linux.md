title: 理解 Linux 中的用户组
date: 2016-07-25 13:35:13
tags: [user group, linux]
---

**注意**：为了避免实际操作过程中 SELinux 可能会造成的影响，建议先关闭 SELinux：

```sh
setenforce Permissive
```

## 基本概念

### 用户

创建用户：

```sh
useradd LOGIN
```

### 组

- 查看用户所属的组：
    ```sh
    groups LOGIN
    ```
- 为用户设置默认组：
    ```sh
    usermod -g GROUP1 LOGIN
    ```
    **注意**：执行该命令会讲指定用户`$HOME`目录中的文件权限重新设置。
- 将用户添加到组：
    ```sh
    usermod -aG GROUP2 LOGIN
    ```
    **注意**：讲用户添加到组并不会更改用户的默认组。
- 使用指定的组进行操作：
    ```sh
    sg GROUP2 [COMMAND]
    ```
    **小贴士**：不加`COMMAND`参数会默认运行一个 bash 进程。

## 实例

### 讲用户添加到一个有 sudo 权限的组中

```sh
# 一般系统中都会有一个名为 wheel 的组
sudo usermod -g wheel $USER
# 假如你不想在每次使用 sudo 时输入密码，就在下面的文件中添加一行
# %wheel  ALL=(ALL)   NOPASSWD: ALL
sudo visudo
```

### 不使用 sudo 访问 docker

```sh
sudo usermod  -aG docker $USER
sg docker 'docker ps'
# 假如你觉得上面这个命令太长，可以不输入`COMMAND`参数
sg docker
# 现在打开了一个新的 bash 进程，你的所有操作默认会使用`docker`组的权限进行
```
