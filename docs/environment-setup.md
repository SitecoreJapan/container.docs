---
id: environment-setup
title: 環境を整える
sidebar_label: 環境を整える
---

本ドキュメントは、Docker Desktopを使用する **Windows 10** が動作する開発環境に適用されます。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/environment-setup です

Docker Engine - Enterpriseを使用する **Windows Server** が動作するその他の環境（ビルドエージェントなど）については、[Dockerのドキュメント](https://hub.docker.com/editions/enterprise/docker-ee-server-windows) を参照してください。注意 Docker Composeは [別インストール](https://docs.docker.com/compose/install/) です。

## 前提条件

Windows 10でDockerを実行するには、以下のものが必要です。

Windows 10 Professional または Enterprise バージョン 1809 (2019 LTSC) 以降。プロセス分離を有効にするには、バージョン 1909 を推奨します。
Hyper-Vが有効になっていること。

> Docker Desktopのインストーラは必要に応じてHyper-Vも有効にしますが、インストール時にマシンの再起動が必要になります。

> VirtualBoxユーザーの方への注意点。Hyper-V を有効にすると、VirtualBox は動作しなくなります。ただし、既存のVirtualBox VMイメージはすべて保持されます。

### ハードウェアガイドライン

ハードウェアはまず、Hyper-V自体を実行するための要件を満たす必要があります。互換性の確認方法を含む詳細については、[Windows 10 Hyper-V システム要件](https://docs.microsoft.com/ja-jp/virtualization/hyper-v-on-windows/reference/hyper-v-requirements)を参照してください。要約すると、Hyper-Vには以下の要件が必要です。

* Second-level address translation (SLAT)とハードウェア支援仮想化を備えた64ビットプロセッサ。
* 少なくとも4GBのRAM（Sitecoreのガイドラインについては下記を参照）。
* BIOSで仮想化サポートがオンになっていること

上記のHyper-Vの要件に加えて、Sitecore開発に推奨されるハードウェアは以下の通りです。

* 16GBのRAM（最低）、32GBのRAM（推奨）。これは、インスタンスの数やどのトポロジを実行する予定か（コンテナを同時に実行する数など）によって異なります。例えば、XM1 や XP0 インスタンスの場合は 16GB で十分かもしれませんが、フル XP1 インスタンスを実行すると問題が発生する可能性が高いでしょう。
* クアッドコア以上のCPU。
* Sitecore コンテナイメージ用に約 25GB のディスク空き容量。Dockerコンテナをダウンロードして実行する際に最適なパフォーマンスを得るためには、SSDストレージを強く推奨します。

## インストール

前提条件を満たせば、インストール自体は非常に簡単です。

### Dockerデスクトップのインストール

1. [Docker Desktop for Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows/)をダウンロードし、インストーラーを実行します。
2. インストール時に、**LinuxコンテナではなくWindowsコンテナを使用すること**を選択します。また、インストール後にWindowsコンテナに切り替えることもできます（下記参照）。

または、以下のコマンドで[Chocolatey](https://chocolatey.org/)を使ってインストールします。

```powershell
choco install docker-desktop
```

詳細は [Dockerのドキュメント](https://docs.docker.com/docker-for-windows/install/) を参照してください。

### Dockerデスクトップを起動する

Docker Desktopはインストールしても自動的に起動しません。まだ起動していない場合は、[Docker Desktopを起動](https://docs.docker.com/docker-for-windows/install/#start-docker-desktop)します。

![Docker Desktopを起動する](/docs/Docker-Desktop-App.png "Docker Desktopを起動する")


WindowsシステムトレイのDockerアイテム（クジラのアイコン）が安定していれば、Docker Desktopが起動して準備が整います。

> 注意 Docker Desktopはログイン時に自動的に起動するように設定されているので、通常は手動で起動する必要はありません。

### Windowsコンテナに切り替える

今回はWindowsベースのコンテナを使ってSitecoreの開発を行います。インストール時にWindowsコンテナを選択しなかった場合は、今すぐWindowsコンテナを選択する必要があります。

WindowsのシステムトレイにあるDockerの項目（クジラのアイコン）を使って切り替えることができます（下図）。

![Dockerメニュー](/docs/Docker-Menu.png "Dockerメニュー")

## 検証

コマンドプロンプトからdocker versionを実行して、インストールの基本的な詳細を確認します。DockerクライアントとDockerサーバーのOSが "windows "と表示されているはずです。

```shell
PS C:\WINDOWS\system32> docker version
Client: Docker Engine - Community
 Version:           19.03.8
 API version:       1.40
 Go version:        go1.12.17
 Git commit:        afacb8b
 Built:             Wed Mar 11 01:23:10 2020
 OS/Arch:           windows/amd64
 Experimental:      false

Server: Docker Engine - Community
 Engine:
  Version:          19.03.8
  API version:      1.40 (minimum version 1.24)
  Go version:       go1.12.17
  Git commit:       afacb8b
  Built:            Wed Mar 11 01:37:20 2020
  OS/Arch:          windows/amd64
  Experimental:     false
```

## 次のステップ

環境が正しく設定されたので、最初のコンテナベースの Sitecore インスタンスを実行する方法を説明します。

* [最初のSitecoreインスタンスを実行する](run-sitecore)

## 関連情報

* [Docker for Windows FAQ](https://docs.docker.com/docker-for-windows/faqs/)
* [マイクロソフト オンプレミスシナリオでのWindowsコンテナとDockerのサポートポリシー](https://support.microsoft.com/en-us/help/4489234/support-policy-for-windows-containers-and-docker-on-premises)
