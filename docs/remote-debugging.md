---
id: remote-debugging
title: コンテナで実行しているコードをデバッグする
sidebar_label: コンテナで実行しているコードをデバッグする
---

この記事では、Visual Studioを使って、ローカルのDockerコンテナでコードを実行しているときにステップスルーする方法を説明します。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/remote-debugging です

## 始める前に

このガイドでは、ソリューションのビルド出力を含む[カスタムSitecoreランタイムイメージをビルド](build-sitecore-images.md)して実行できることを前提としています。

独自のイメージを持っていない場合は、[Docker Examplesリポジトリ](https://github.com/Sitecore/docker-examples)にあるカスタムイメージを使用することができます。[準備手順](run-sitecore.md#準備するもの)に従うか、同梱の `init.ps1` スクリプトを実行するだけで、これらの準備手順が自動的に実行されます。

## 前提条件

ローカルのDockerコンテナでアプリをデバッグするには、以下のものが必要です。

* Visual Studio 2019 バージョン 16.5.0 以降。

## デバッグシンボルが利用可能であることを確認する

コンテナに特有のものではありませんが、デバッグシンボルがコンテナにデプロイされていることを確認する必要があります。

[ソリューションイメージ](build-solution.md#ソリューションイメージ)を "Debug" ビルド設定でビルドしている場合は、すでに行われているかもしれません。例えば、Docker Examplesリポジトリのカスタムイメージの例では、[環境変数BUILD_CONFIGURATIONを使用](build-solution.md)しており、デフォルトではこれを "Debug "に設定しています。

また、Visual Studioから実行中のコンテナに「Debug」[ファイルのデプロイ](file-deployment.md)を実行することもできます。

## Visual Studioデバッガをアタッチする

Visual Studio では、コンテナ内のプロセスにアタッチするには 2 つのオプションがあります。

### オプション 1 - [コンテナ] ウィンドウを使用します。

> コンテナ ウィンドウが表示されていない場合は、上部の **表示** メニューから開いてください。**その他のウィンドウ**を選択し、**コンテナ** を選択します。

実行中のコンテナのリストで、デバッグしたいコンテナを右クリックし、**プロセスにアタッチ** をクリックします。

![Visual Studio Containers ウィンドウ](/docs/VS-Containers.png "Visual Studio Containers ウィンドウ")

**プロセスへアタッチ** ダイアログが表示され、コンテナ内で実行中の利用可能なプロセスが表示されます。

![Visual Studio プロセスへのアタッチ](/docs/VS-Attach.png "Visual Studio プロセスへのアタッチ")


通常どおりプロセス（例：w3wp.exe）を選択し（表示されていない場合は、**すべてのユーザーからのプロセスを表示する**にチェックを入れます）、**アタッチ**をクリックします。

> コンテナ ウィンドウの詳細については、[Microsoft のドキュメント](https://docs.microsoft.com/ja-jp/visualstudio/containers/view-and-diagnose-containers)を参照してください。

### オプション2 - [デバッグ]メニューを使用する

コンテナウィンドウよりも少し手順が多くなりますが、デバッグメニューを使用することもできます。

1. 上部の**デバッグ**メニューから、**プロセスへアタッチ...**を選択して、**プロセスへアタッチ**ダイアログを開きます。
2. **接続タイプ**は**Docker（Windowsコンテナ）**を選択
3. **Connection ターゲット**の場合は、「**Find...**」ボタンをクリックします。実行中のコンテナがリストに表示されます。デバッグするコンテナを選択し、**OK** をクリックします。
4. **アタッチ先**には、**マネージドコード(v4.6, v4.5, v4.0)**が選択されていることを確認します(これがデフォルトになっているはずです)。
5. 通常通りプロセス(例: *w3wp.exe*)を選択し(表示されていない場合は、**すべてのユーザーからのプロセスを表示**するにチェックを入れます)、アタッチをクリックします。

## 関連情報

* [Visual Studio ContainersウィンドウのMicrosoftドキュメント](https://docs.microsoft.com/ja-jp/visualstudio/containers/view-and-diagnose-containers)
