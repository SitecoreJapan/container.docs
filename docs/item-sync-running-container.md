---
id: item-sync-running-container
title: 実行中のコンテナとのアイテム同期
sidebar_label: 実行中のコンテナとのアイテム同期
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/item-sync-running-container です


このガイドでは、コンテナで稼働しているローカルのSitecore環境から、シリアル化されたアイテムをプッシュしたり、プルしたりする方法を説明します。これは、使用している Sitecore アイテムシリアライズツールによって異なります。テスト環境や本番環境では、アイテムのパッケージングやデプロイは重要ですが、日々の開発では、他のSitecore開発環境と同じように、これらのツールを使用したいと思うでしょう。

このガイドでは、Sitecore アイテムのシリアライズと、Sitecore 開発とデプロイメントプロセスへの適用については、すでに熟知していることを前提としています。

Sitecore CLI / Sitecoreコンテンツのシリアライズ

Sitecore 10でリリースされたSitecore CLIは、リモートのSitecoreインスタンスとの対話に最適化されています。コンテナで実行されているSitecore環境では、他のSitecoreインスタンスと同様に、sitecore ser pull、sitecore ser push、sitecore ser watchなどのコマンドを使用することができます。

詳細については、Sitecore CLIのドキュメントを参照してください。また、CMコンテナイメージに必要なSitecore Management Servicesモジュールをインストールする方法については、Sitecoreモジュールリファレンスを参照してください。

Sitecore TDS

Sitecore TDSは、HTTPベースのサービスを介して通信するため、他のSitecoreインスタンスと同様に、コンテナ内のSitecore環境でも全く同じように機能します。ただし、コンテナ環境とTDSプロジェクトをVisual Studioでセットアップする方法を知っておく必要があります。

完全な例については、GitHubのHelix.Examplesリポジトリを参照してください。

コンテナ用にTDSプロジェクトを設定する

これはSitecore TDSのドキュメントに詳しく書かれていますが、基本的な手順は以下の通りです。

Visual Studioビルドの場合と同様に、CMコンテナのDockerfileとランタイムファイルデプロイ用のエントリーポイントをセットアップします。
TDSプロジェクト上のSitecore Web Urlを、Sitecoreコンテナ環境でCMサービスに使用されるホスト名に設定します。
Docker Examplesリポジトリでは、https://cm.dockerexamples.localhost となります。
httpsを忘れずに!
TDSプロジェクト上のSitecore Deploy Folderを、Sitecore CMファイルのデプロイ用にマウントされたパスに設定します。
これまでに説明したソリューションの構造では、これが docker\deploywebsite フォルダです。パスは、TDSプロジェクトの場所からの相対パスにしてください。
TDSプロジェクトのコンテナデプロイを有効にするオプションをチェックします。
これは、コンテナベースの環境のためにTDSサービスインストールの一部の動作を最適化します。
TDSプロジェクトのInstall Sitecore Connectorオプションをチェックします。
また、TDS のこの設定により、コードビルドを実行時ファイルのデプロイに適した場所にデプロイできるようになります。

TdsGlobal.configでの設定

TdsGlobal.configを使用している場合は、以下のプロパティを使用して必要な値を設定することができます。

<?xml version="1.0" encoding="utf-8"?
<Project ToolsVersion="3.5" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup Condition=" '$(Configuration) == 'Debug' "> "プロパティグループの条件を指定します。
    <SitecoreWebUrl>https://cm.dockerexamples.localhost</SitecoreWebUrl>。
    <SitecoreDeployFolder>...\\.Dockerdeploy</SitecoreDeployFolder>.
    <InstallSitecoreConnector>True</InstallSitecoreConnector>です。
    <EnableContainerDeployment>True</EnableContainerDeployment>です。
    <! -->
    <SitecoreAccessGuid>00000000-0000-0000-0000-000000000000</SitecoreAccessGuid>
  </PropertyGroup> </PropertyGroup> </PropertyGroup> </PropertyGroup> </PropertyGroup> </PropertyGroup
</プロジェクト

コピー
TDSコンテナの構成

ユニコーン

重要：Unicornはサードパーティ製のオープンソースツールであり、Sitecore Supportではサポートされていません。これらの説明は、Unicornユーザーの利便性を高めるためのガイダンスとしてのみ提供されています。
Unicornは、Sitecoreプラットフォームのインプロセスで実行され、ファイルシステムから直接アイテムをプッシュ/プルします。開発中にバインドマウントを使用して、CMコンテナ内で実行されているUnicornが、ソリューションのソースコード内でシリアライズされたアイテムを更新できるようにすることができます。

完全な例については、GitHub の Helix.Examples リポジトリを参照してください。

シリアル化されたアイテムのマウント

Unicornの同期に使用するベースファイルシステムのパスは、通常、Sitecoreの設定でsourceFolderというsc.variableを使用して設定します。アイテムデプロイのためにUnicornを設定するときと同じように、環境変数からこの値を入力することができます。

<sc.variable name="sourceFolder" value="$(env:ITEM_SYNC_LOCATION)" />

コピー
ビルド時にすでにシリアル化されたアイテムを CM コンテナにコピーしている場合は、そのパスを設定するために使用した環境変数と同じものになるはずです。しかし、開発時には、docker-compose.override.yml でその環境変数をソリューションからマウントしたパスに設定することができます。

  cmを設定することができます。
    [...]
    という環境変数を設定します。
      ITEM_SYNC_LOCATION: c:\items-mounted
    ボリュームがあります。
      - ${LOCAL_ITEM_PATH}:c:\items-mounted

コピー
上記の例では、LOCAL_ITEM_PATHは、.env内でソリューション内のUnicornアイテムのルートの相対パスに設定されます。Sitecore Helixのプラクティスに従っている場合、これがルートソースフォルダである可能性が高いです。

LOCAL_ITEM_PATH=.

コピー
設定すると、コンテンツ エディタ内の Unicorn 通知は、CM コンテナ内のアイテムのパスを表示しますが、それらのアイテムへの変更は、コンテナ ホスト（開発環境）のファイルシステムにも反映されます。

コンテンツ エディタ内の Unicorn 通知

透過同期の設定

Unicornのトランスペアレントシンクを使用すると、機能ブランチを切り替えたり、ソースコントロールから最新のものを引っ張ってきたりする場合など、明示的にプッシュしなくてもシリアライズされたアイテムを扱うことができます。しかし、本番環境などの他の環境では、この機能を無効にしたい場合もあるでしょう。

その場合は、もう一度環境変数を利用してUnicornを設定することができます。

<unicorn role:require="スタンドアロンまたはコンテンツ管理"> とします。
    <デフォルト
        <dataProviderConfiguration set:enableTransparentSync="$(env:UNICORN_ENABLE_TRANSPARENT_SYNC)" />
    </defaults> </defaults
</ユニコーン

コピー
この値を docker-compose.override.yml と .env に設定します。

  cm に設定することができます。
    [...]
    環境に設定することができます。
      UNICORN_ENABLE_TRANSPARENT_SYNC: ${UNICORN_ENABLE_TRANSPARENT_SYNC}。

コピー
UNICORN_ENABLE_TRANSPARENT_SYNC=true

## 関連情報

* [Sitecore CLI ドキュメント](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)
* [Sitecore TDS - TDSとコンテナ](http://hedgehogdevelopment.github.io/tds/chapter8.html)
* [アイテム展開](item-deployment.md)