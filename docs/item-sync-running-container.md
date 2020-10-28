---
id: item-sync-running-container
title: 実行中のコンテナとのアイテム同期
sidebar_label: 実行中のコンテナとのアイテム同期
---

このガイドでは、コンテナで稼働しているローカルのSitecore環境から、シリアル化されたアイテムをプッシュしたり、プルしたりする方法を説明します。これは、使用している Sitecore アイテムシリアライズツールによって異なります。テスト環境や本番環境では、[アイテムのパッケージングやデプロイ](item-deployment.md)は重要ですが、日々の開発では、他のSitecore開発環境と同じように、これらのツールを使用したいと思うでしょう。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/item-sync-running-container です

このガイドでは、Sitecore アイテムのシリアライズと、Sitecore 開発とデプロイメントプロセスへの適用については、すでに熟知していることを前提としています。

## Sitecore CLI / Sitecoreコンテンツのシリアライズ

Sitecore 10でリリースされたSitecore CLIは、リモートのSitecoreインスタンスとの対話に最適化されています。コンテナで実行されているSitecore環境では、他のSitecoreインスタンスと同様に、`sitecore ser pull`、`sitecore ser push`、`sitecore ser watch`などのコマンドを使用することができます。

詳細については、[Sitecore CLIのドキュメント](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)を参照してください。また、CMコンテナイメージに必要なSitecore Management Servicesモジュールをインストールする方法については、[Sitecoreモジュールリファレンス](module-reference.md)を参照してください。

## Sitecore TDS

Sitecore TDSは、HTTPベースのサービスを介して通信するため、他のSitecoreインスタンスと同様に、コンテナ内のSitecore環境でも全く同じように機能します。ただし、コンテナ環境とTDSプロジェクトをVisual Studioでセットアップする方法を知っておく必要があります。

完全な例については、[GitHubのHelix.Examplesリポジトリ](https://github.com/Sitecore/Helix.Examples)を参照してください。

### コンテナ用にTDSプロジェクトを設定する

これは [Sitecore TDSのドキュメント](http://hedgehogdevelopment.github.io/tds/chapter8.html) に詳しく書かれていますが、基本的な手順は以下の通りです。

1. Visual Studioビルドの場合と同様に、CMコンテナのDockerfileと[ランタイムファイルデプロイ](file-deployment.md)用のエントリーポイントをセットアップします。
2. TDSプロジェクト上の *Sitecore Web Url* を、Sitecoreコンテナ環境でCMサービスに使用されるホスト名に設定します。
  * Docker Examplesリポジトリでは、https://cm.dockerexamples.localhost となります。
  * httpsを忘れずに!
3. TDSプロジェクト上のSitecore Deploy Folderを、Sitecore CMファイルのデプロイ用にマウントされたパスに設定します。
  * これまでに説明したソリューションの構造では、これが docker\deploy\website フォルダです。パスは、TDSプロジェクトの場所からの相対パスにしてください。
4. TDSプロジェクトのコンテナデプロイを有効にするオプションをチェックします。
  * これは、コンテナベースの環境のためにTDSサービスインストールの一部の動作を最適化します。
5. TDSプロジェクトのInstall Sitecore Connectorオプションをチェックします。

また、TDS のこの設定により、コードビルドを[実行時ファイルのデプロイ](file-deployment.md)に適した場所にデプロイできるようになります。

### TdsGlobal.config での設定

TdsGlobal.configを使用している場合は、以下のプロパティを使用して必要な値を設定することができます。

```xml
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="3.5" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup Condition=" '$(Configuration)' == 'Debug' ">
    <SitecoreWebUrl>https://cm.dockerexamples.localhost</SitecoreWebUrl>
    <SitecoreDeployFolder>..\..\docker\deploy</SitecoreDeployFolder>
    <InstallSitecoreConnector>True</InstallSitecoreConnector>
    <EnableContainerDeployment>True</EnableContainerDeployment>
    <!-- Your access GUID here: -->
    <SitecoreAccessGuid>00000000-0000-0000-0000-000000000000</SitecoreAccessGuid>
  </PropertyGroup>
</Project>
```

![TDSコンテナの構成](/docs/TDS-Container-Configuration.png "TDSコンテナの構成")

## Unicorn

> **重要：** Unicornはサードパーティ製のオープンソースツールであり、Sitecore Supportではサポートされていません。これらの説明は、Unicornユーザーの利便性を高めるためのガイダンスとしてのみ提供されています。

[Unicorn](https://github.com/SitecoreUnicorn/Unicorn)は、Sitecoreプラットフォームのインプロセスで実行され、ファイルシステムから直接アイテムをプッシュ/プルします。開発中に[バインドマウント](https://docs.docker.com/storage/bind-mounts/)を使用して、CMコンテナ内で実行されているUnicornが、ソリューションのソースコード内でシリアライズされたアイテムを更新できるようにすることができます。

完全な例については、GitHub の [Helix.Examples リポジトリ](https://github.com/Sitecore/Helix.Examples)を参照してください。

### シリアル化されたアイテムのマウント

Unicornの同期に使用するベースファイルシステムのパスは、通常、Sitecoreの設定でsourceFolderというsc.variableを使用して設定します。[アイテムデプロイのためにUnicornを設定](item-deployment.md#unicorn)するときと同じように、環境変数からこの値を入力することができます。

```xml
<sc.variable name="sourceFolder" value="$(env:ITEM_SYNC_LOCATION)" />
```

[ビルド時にすでにシリアル化されたアイテムを CM コンテナにコピー](item-deployment.md#build-items-and-deployment-scripts-into-your-cm-image)している場合は、そのパスを設定するために使用した環境変数と同じものになるはずです。しかし、開発時には、`docker-compose.override.yml` でその環境変数をソリューションからマウントしたパスに設定することができます。

```yml
  cm:
    [...]
    environment:
      ITEM_SYNC_LOCATION: c:\items-mounted
    volumes:
      - ${LOCAL_ITEM_PATH}:c:\items-mounted
```

上記の例では、`LOCAL_ITEM_PATH`は、`.env`内でソリューション内の Unicorn アイテムのルートの相対パスに設定されます。Sitecore Helix のプラクティスに従っている場合、これがルートソースフォルダである可能性が高いです。

```
LOCAL_ITEM_PATH=.\src
```

設定すると、コンテンツ エディタ内の Unicorn 通知は、CM コンテナ内のアイテムのパスを表示しますが、それらのアイテムへの変更は、コンテナ ホスト（開発環境）のファイルシステムにも反映されます。

![コンテンツ エディタ内の Unicorn 通知](/docs/Unicorn-Content-Editor-Notification.png "コンテンツ エディタ内の Unicorn 通知")

### 透過同期の設定

Unicornの[トランスペアレントシンク](https://kamsar.net/index.php/2015/10/Unicorn-Introducing-Transparent-Sync/) を使用すると、機能ブランチを切り替えたり、ソースコントロールから最新のものを引っ張ってきたりする場合など、明示的にプッシュしなくてもシリアライズされたアイテムを扱うことができます。しかし、本番環境などの他の環境では、この機能を無効にしたい場合もあるでしょう。

その場合は、もう一度環境変数を利用してUnicornを設定することができます。


```xml
<unicorn role:require="Standalone or ContentManagement">
    <defaults>
        <dataProviderConfiguration set:enableTransparentSync="$(env:UNICORN_ENABLE_TRANSPARENT_SYNC)" />
    </defaults>
</unicorn>
```

この値を docker-compose.override.yml と .env に設定します。

```yml
  cm:
    [...]
    environment:
      UNICORN_ENABLE_TRANSPARENT_SYNC: ${UNICORN_ENABLE_TRANSPARENT_SYNC}
```

```
UNICORN_ENABLE_TRANSPARENT_SYNC=true
```

## 関連情報

* [Sitecore CLI ドキュメント](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)
* [Sitecore TDS - TDSとコンテナ](http://hedgehogdevelopment.github.io/tds/chapter8.html)
* [アイテム展開](item-deployment.md)