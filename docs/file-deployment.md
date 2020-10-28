---
id: file-deployment
title: 実行中のコンテナへのファイル展開
sidebar_label: 実行中のコンテナへのファイル展開
---

このガイドでは、Visual Studio からローカルで実行しているコンテナに直接ファイルをデプロイできるように Sitecore ソリューションを設定する方法を説明します。これは、カスタムSitecoreイメージを毎回再構築しなければならないのではなく、効率的なフィードバックループを確保するために、開発中に不可欠です。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/file-deployment です

ここでは、その概要を簡単に説明します。

![ファイルの展開](/docs/file-deployment.svg "ファイルの展開")

DockerのサンプルソリューションからSitecore Experience Platform - Single (XP0)インスタンスに変更点を公開することで、実際の動作を確認することができます。

## 始める前に

このガイドでは、[カスタムSitecoreランタイムイメージをビルド](build-sitecore-images.md)できることを前提としています。また、[dockerbuildフォルダ](build-sitecore-images.md#ソリューションの構造を理解する)と[SitecoreランタイムのDockerfiles](build-sitecore-images.md#sitecore-ランタイム-dockerfile)にも精通している必要があります。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンしてください。例えば、CC:\sitecore\docker-examples\  (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、*custom-images* フォルダを使用します。

## サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ準備を行っていない場合は、[準備手順](run-sitecore.md#準備するもの)に従うか、同梱の`init.ps1`スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecore\docker-examples\custom-images）に移動します。以下のコマンドを実行し、-LicenseXmlPathをSitecoreライセンスファイルの場所に置き換えます。

```
.\init.ps1 -LicenseXmlPath C:\License\license.xml
```

## 開発 ENTRYPOINT スクリプトを理解する

### ENTRYPOINT 実行について

まず、Dockerの `ENTRYPOINT` とは何かを理解しておくと便利です。簡単に説明すると、 `ENTRYPOINT` はコンテナが最初に実行されたときに実行する命令を提供するということです。

> `ENTRYPOINT` 実行の詳細については、[Dockerのドキュメント](https://docs.docker.com/engine/reference/builder/#entrypoint)を参照してください。

すべてのSitecoreランタイムイメージには、デフォルトの `ENTRYPOINT` が設定されています（Dockerfile命令の一部として）ので、使用するためにイメージをプルダウンするときには、これらは準備ができています。イメージのデフォルトの `ENTRYPOINT` は、[docker inspectコマンド](cheat-sheet.md#イメージの管理)を使って確認することができます。

### なぜ開発用に別のイメージを使うのか？

典型的なSitecore開発のワークフローには、コードの変更を繰り返し行い、実行中のSitecoreインスタンスのWebルートにソリューションを構築することが含まれます。一見すると、これはマウントされたボリュームを持つDockerコンテナで実現可能なように見えます。しかし、現在の[Docker for Windowsの制限](https://docs.docker.com/engine/reference/builder/#notes-about-specifying-volumes)により、コンテナ内のボリュームの保存先は存在しないか空のディレクトリでなければなりません。

解決策/回避策としては、マウントされた別の "ホット "フォルダで変更を監視し、SitecoreのWebルートにコピーするという方法があります。このウォッチプロセスが起動時に確実に開始されるようにするには、デフォルトのSitecore本番の`ENTRYPOINT`をオーバーライドすることができます。

このウォッチプロセスとコンパニオン`ENTRYPOINT`の組み合わせは、まさに[sitecore-docker-tools-assetsイメージ](#sitecore-docker-tools-assets-イメージの開発-entrypoint)に含まれているものです。

### sitecore-docker-tools-assets イメージの開発 ENTRYPOINT

イメージのビルドプロセスを支援する他のスクリプトとともに、sitecore-docker-tools-assets イメージには以下のスクリプトが含まれており、このガイドではこれらのスクリプトを中心に説明します。

#### スクリプトを見る

* **C:\toolsscriptsWatch-Directory.ps1** - ファイルの変更のソースパスを監視し、それに応じて宛先パスを更新します。

#### ENTRYPOINT スクリプト

* **C:\tools\entrypoints\iis\Development.ps1**  - IISベースのロール(例: cm, cd, xconnect)に使用する開発用のENTRYPOINTスクリプト。
* **C:\tools\entrypoints\worker\Development.ps1** - .NET Core ベースのワーカー・ロール (例: *xdbsearchworker*, *xdbautomationworker*, *cortexprocessingworker*) で使用する開発用の ENTRYPOINT スクリプトです。

*Development.ps1* スクリプトの機能はそれぞれ同じです。以下のようになります。

1. ディレクトリが `C:\deploy` にマウントされている場合、バックグラウンドジョブとしてウォッチプロセス (*Watch-Directory.ps1*) を開始し
* デフォルトのSitecore `ENTRYPOINT` を呼び出す

> 注意 `C:\deploy` はデフォルトのソースディレクトリですが、必要に応じて上書きすることができます。ウォッチスクリプトのパラメータをカスタマイズして、異なるソースパスとデスティネーションパスを使用したり、追加のファイルやフォルダを除外したりすることができます。

## ソリューションの構造を理解する

Dockerを使ったSitecore開発では、代表的なソリューションに「dockerフォルダ」という新しいフォルダが導入されています。dockerフォルダには、Docker開発をサポートするためのファイルやフォルダが含まれています。このガイドでは、deployフォルダに焦点を当てて説明します。

**docker\deploy フォルダ**

*custom-images\docker* フォルダに移動し、ここにある deploy フォルダの内容を見てください（例：C:\sitecore\docker-examples\custom-images\docker\deploy ）。以下のような構造になっています。

* deploy
  * [environment]
  * [...]

`[environment]` フォルダのそれぞれは、コードのデプロイ先として、また

* コードのデプロイ先であり
* 開発 `ENTRYPOINT` ウォッチスクリプトのソース

この場合、`Website` フォルダはSitecore website/platform コンテナ（cm、cdなど）を提供し、`xconnect`フォルダはSitecore xConnectコンテナ（*xconnect*など）を提供します。

これらがどのように設定されているかは、次に説明します。

## Docker Examples環境のプロジェクト

Docker Examplesリポジトリには、ファイルデプロイのシナリオを実演するのに役立つ2つのプロジェクトが含まれています。custom-imagesフォルダに移動し、Visual StudioでソリューションDockerExamples.slnを開きます。以下のプロジェクトを見てみましょう。

* **DockerExamples.Website** - website/platform の成果物のビルドと公開を容易にし、デフォルトの`Sample Inner Sublayout.ascx`の簡単な修正も含まれています。
* **DockerExamples.XConnect** - xConnectアーティファクトのビルドと公開を容易にします。

> Helixソリューションでは、*DockerExamples.Website* と *DockerExamples.XConnect* プロジェクトは、別個の環境モジュールと1つ以上の Project/Feature モジュールに分割されることが多いですが、ここでは簡単のために組み合わせています。

これらのプロジェクトのそれぞれについて、「DockerDeploy」の公開プロファイルを見つけることができます。

![Visual Studio DockerDeploy](/docs/VS-DockerDeploy.png "Visual Studio DockerDeploy")

それぞれの `DockerDeploy.pubxml` ファイルを調べると、対応するDockerDeploy環境サブフォルダにパブリッシュするように設定されていることがわかります。**DockerExamples.Website** を *docker\deploy\website* に、**DockerExamples.XConnect** を *docker\deploy\xconnect* に変更しました。

### ファイルデプロイのオプション

Dockerの例のソリューションは、基本的なVisual Studioのファイルパブリッシュを使用したシンプルな例です。実際のソリューションでは、[Team Development for Sitecore (TDS)](https://www.teamdevelopmentforsitecore.com/) やHelix Publishing Pipeline (HPP)に含まれているものや、独自のカスタムアプローチなど、より堅牢なデプロイメカニズムを使用しているかもしれません。

しかし、最終的な目標は同じです: **ファイルを適切な *docker\deploy* 環境サブフォルダに移動させることです**。

これは、すでにSitecore開発のベストプラクティスである[Webルートへのデプロイ](https://helix.sitecore.net/devops/development/local-deployment.html) に従っている人にとっては、非常に馴染み深いものに感じられるはずです。今では、ファイルを直接 Web ルートに送るのではなく、*docker\deploy* に送ります。

## Sitecore ランタイムイメージに適用

関係する主要なコンポーネントを理解したところで、これらがSitecoreランタイムのDockerfilesとDocker Composeでどのようにまとめられているかを見ていきます。

### Dockerfile の指示を追加する

cmサービスの[Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)を開く（例：C:\sitecore\docker-examples\custom-images\docker\build\cm\Dockerfile）。

`TOOLING_IMAGE` は、最初に `ARG`（[Docker Composeで設定したもの](file-deployment.md#docker-composeで設定する)）を持ってきて、ビルド段階の名前付きツールとして起動されているのがわかります。

```
ARG TOOLING_IMAGE
[...]
FROM ${TOOLING_IMAGE} as tooling
```

すると、`tools` フォルダ( `ENTRYPOINT` スクリプトを含む)が `tooling` イメージからコピーされているのがわかります(C:\toolsへ)。

```
COPY --from=tooling \tools\ \tools\
```

xconnectサービス用の[Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)（例：C:\sitecore\docker-examples\custom-images\docker\build\xconnect\Dockerfile）を開くと、同じ手順が表示されます。

> これらは、XP1 と XM1 トポロジで使用するための cd Sitecore runtime Dockerfile (例: C:\sitecore\docker-examples\custom-images\docker\build\cd\Dockerfile) にも含まれています。

Sitecore runtime Dockerfileに必要なものはこれだけです。ここで重要なのは、`ENTRYPOINT` スクリプト(例: C:\tools\entrypoints\iis\Development.ps1) とwatchスクリプト(例: C:\tools\scripts\Watch-Directory.ps1)がイメージにコピーされ、実行時に利用できるようになっていることです。

### Docker Composeで設定する

*custom-images* フォルダのルートにある `docker-compose.override.yml` ファイルを開きます（例：C:\sitecore\docker-examples\custom-images\docker-compose.override.yml）。

> `docker-compose.yml` ファイルは、Sitecoreに付属のDocker Composeファイルです。`docker-compose.override.yml` は、メインファイルを拡張し、カスタムSitecoreイメージのビルドや開発に必要なオーバーライドや拡張子を備えています。

どのように設定されているのか、cmサービスを見てみましょう。

```
cm:
  image: ${REGISTRY}${COMPOSE_PROJECT_NAME}-xp0-cm:${VERSION:-latest}
  build:
    context: ./docker/build/cm
    args:
      BASE_IMAGE: ${SITECORE_DOCKER_REGISTRY}sitecore-xp0-cm:${SITECORE_VERSION}
      SPE_IMAGE: ${SITECORE_MODULE_REGISTRY}spe-assets:${SPE_VERSION}
      SXA_IMAGE: ${SITECORE_MODULE_REGISTRY}sxa-xp1-assets:${SXA_VERSION}
      TOOLING_IMAGE: ${SITECORE_TOOLS_REGISTRY}sitecore-docker-tools-assets:${TOOLS_VERSION}
      SOLUTION_IMAGE: ${REGISTRY}${COMPOSE_PROJECT_NAME}-solution:${VERSION:-latest}
  [...]
  volumes:
    - ${LOCAL_DEPLOY_PATH}\website:C:\deploy
    [...]
  entrypoint: powershell -Command "& C:\tools\entrypoints\iis\Development.ps1"
```  

この設定にはかなりの量が詰め込まれています。以下にその内容を示します。

* `TOOLING_IMAGE` ビルド引数は `sitecore-docker-tools-assets` イメージリポジトリを使用するように設定されています。特定のイメージタグやバージョンは、[環境ファイル](https://docs.docker.com/compose/env-file/) (.env) で定義されている `TOOLS_VERSION` 変数によって決定されます。
* また、.env ファイルの `LOCAL_DEPLOY_PATH` には、[docker\deploy フォルダ](#ソリューションの構造を理解する)の相対パスが設定されています。
* この変数は、Dockerボリュームのある[デフォルトのwatch script source folder](#sitecore-docker-tools-assets-イメージの開発-entrypoint) (C:\deploy)の実行中のコンテナに、*docker\deploy* website environment sub-folder (`.\docker\deploy\website`)を公開するために使用されます。
* デフォルトの [entrypoint](https://docs.docker.com/compose/compose-file/#entrypoint) は上書きされ、[development ENTRYPOINTスクリプト](#sitecore-docker-tools-assets-イメージの開発-entrypoint)に設定されます。

> ボリュームの詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/compose-file/#volumes)を参照してください。

`xconnect` サービスが同様の方法で設定されていることがわかります。ただし、`C:\deploy` ボリュームマウントを代わりにdocker\deploy xconnect環境サブフォルダにマッピングします。

```yml
xconnect:
  [...]
  volumes:
    - ${LOCAL_DEPLOY_PATH}\xconnect:C:\deploy
  [...]
```

このセットアップが完了すると、実行中の Sitecore Docker インスタンス内の Web サイト/プラットフォームまたは xConnect コンテナのいずれかにソリューションアセットを独立して公開することができます。

## Dockerの実行例

> 必要な[サンプルの準備](#サンプルの準備)が完了したことを確認してください。

PowerShellプロンプトを開き、custom-imagesフォルダ（例：C:\sitecore\docker-examples\custom-images）に移動します。Docker Compose `up`コマンドを使ってDocker Examplesを実行します。

```
docker-compose up -d
```

> このコマンドやガイドで使用されているその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Docker チートシート](cheat-sheet.md)を参照してください。

インスタンスが立ち上がって実行できるようになったら、https://cm.dockerexamples.localhost を参照してください。おなじみのSitecoreのデフォルトページに、Dockerのロゴが追加されています。

![Dockerの例 ホームページ](/docs/Docker-Examples-Homepage.png "Dockerの例 ホームページ")

これは *DockerExamples.Website* プロジェクトにある `Sample Inner Sublayout.ascx` に追加されています。

* まだ行っていない場合は、*custom-images*フォルダに移動して、ソリューションの *DockerExamples.sln* を開きます。

Visual Studioで *Sample Inner Sublayout.ascx* ファイルを開き、変更を加えます。例えば、Dockerロゴの下に新しい段落を追加します。

```C#
<%@ Control Language="c#" AutoEventWireup="true" TargetSchema="http://schemas.microsoft.com/intellisense/ie5" %>
<div id="InnerCenter">
    <div id="Header">
        <img src="-/media/Default Website/sc_logo.ashx" alt="Sitecore" id="scLogo" />
        <p style="margin: 0 16px; font-size: 30px;">&#43;</p>
        <img src="/images/docker-logo.png" alt="Docker" />
        <p><strong>&#61; Awesome!</strong></p>
    </div>
    <div id="Content">
        <div id="LeftContent">
            <sc:placeholder runat="server" key="content" />
        </div>              
    </div>
    <div id="Footer"><hr class="divider"/>&#169; <%= Sitecore.DateUtil.ToServerTime(DateTime.UtcNow).Year.ToString()%> Sitecore</div>
</div>
```

DockerDeploy パブリッシュプロファイルを使って *DockerExamples.Website* プロジェクトをパブリッシュします(Solution Explorerで *DockerExamples.Website* プロジェクトを右クリックして "Publish... "をクリックします)。

> これは、ファイルを docker\deploy *website* フォルダに公開していることを覚えておいてください。これは、ウォッチスクリプトを起動し、cmコンテナのウェブルートにコピーします。

公開が完了したら、ブラウザで https://cm.dockerexamples.localhost のページを更新すると、変更が反映されているのがわかるはずです。

![Docker の例 ホームページの変更](/docs/Docker-Examples-Homepage-Modified.png "Docker の例 ホームページの変更")

xConnect の例でもお気軽に試してみてください。ソリューションで行ったxConnectの変更は、*DockerExamples.XConnect*プロジェクトの「DockerDeploy」パブリッシュプロファイルを使用して公開することができ、xconnectコンテナに反映されます。

終わったら、`down` コマンドを使ってコンテナを停止して削除します。

```
docker-compose down
```

### フォルダのクリーンアップを展開

[mssql や solr のデータフォルダ](run-sitecore.md#永続的なストレージのクリーンアップ)と同様に、docker/deploy フォルダ内のファイルは `docker-compose down` 後も残っているため、データが古くなってしまう可能性があります。

これらのフォルダ内のファイルを手動で削除するか、付属の `clean.ps1` スクリプトを使用してください。*custom-images* フォルダに移動し、PowerShell 管理者プロンプトから実行してください。

```
.\docker\clean.ps1
```

## 関連情報

* [Dockerfile ENTRYPOINT reference](https://docs.docker.com/engine/reference/builder/#entrypoint)