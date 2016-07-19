title: 通过 systemd 设置 docker 仓库镜像
date: 2016-07-19 17:05:55
tags: [docker, docker registry mirror, systemd]
---

具体步骤（伸手党直接从第4步开始看）：

1. 找到一个可用的镜像服务，参考 [Faster Docker pulls in China with DaoCloud](http://rzhw.me/blog/2015/12/faster-docker-pulls-in-china-with-daocloud/)。
2. 通过 yum 安装 docker 之后，检查 systemd service：
    ```sh
    systemctl status docker
    ```
    从输出中找到对应的 .service 文件：
    ```
    ● docker.service - Docker Application Container Engine
    Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; vendor preset: disabled)
    Active: active (running) since Tue 2016-07-19 15:02:49 CST; 2h 9min ago
      Docs: http://docs.docker.com
    ...
    ```
3. 在`docker.service`中找到相应的`OPTIONS`环境变量:
    ```sh
    vi /usr/lib/systemd/system/docker.service
    ```
    找到下面几行（为了更易于理解，这里把所有的干扰项都删掉了）：
    ```
    EnvironmentFile=-/etc/sysconfig/docker
    ExecStart=/bin/sh -c '/usr/bin/docker-current daemon \
              $OPTIONS \
              2>&1 | /usr/bin/forward-journald -tag docker'
    ```
4. 编辑`EnvironmentFile`项所指的文件，把参数加到`OPTIONS`环境变量里
    ```sh
    vi /etc/sysconfig/docker
    ```
    编辑下面的内容：
    ```
    # Modify these options if you want to change the way the docker daemon runs
    #OPTIONS='--selinux-enabled --log-driver=journald'
    OPTIONS='--selinux-enabled --log-driver=journald --registry-mirror=http://YOUR_ID.m.daocloud.io'
    ```
    **注意**：这个配置文件不支持使用 bash 的模板字符串。
5. 重新启动 docker 服务：
    ```sh
    sudo systemctl restart docker
    ```
