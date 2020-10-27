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

始める前に

このガイドでは、カスタムSitecoreランタイムイメージをビルドできることを前提としています。また、dockerbuildフォルダとSitecoreランタイムのDockerfilesにも精通している必要があります。

Docker Examples リポジトリをクローンする

まだやっていない場合は、Docker Examples リポジトリをマシン上のどこかにクローンしてください。例えば、C:\sitecoredocker-examples (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、custom-images フォルダを使用します。

サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ準備を行っていない場合は、準備手順に従うか、同梱のinit.ps1スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecoredocker-examples\custom-images）に移動します。以下のコマンドを実行し、-LicenseXmlPathをSitecoreライセンスファイルの場所に置き換えます。

.\init.ps1 -LicenseXmlPath C:\Licenselicense.xml

コピー
開発ENTRYPOINTスクリプトを理解する

ＥＮＴＲＹＰＯＩＮＴ指導について

まず、Dockerのentrypointとは何かを理解しておくと便利です。簡単に説明すると、entrypointはコンテナが最初に実行されたときに実行する命令を提供するということです。

ENTRYPOINT命令の詳細については、Dockerのドキュメントを参照してください。
すべてのSitecoreランタイムイメージには、デフォルトのENTRYPOINTが設定されています（Dockerfile命令の一部として）ので、使用するためにイメージをプルダウンするときには、これらは準備ができています。イメージのデフォルトのENTRYPOINTは、docker inspectコマンドを使って確認することができます。

なぜ開発用に別のイメージを使うのか？

典型的なSitecore開発のワークフローには、コードの変更を繰り返し行い、実行中のSitecoreインスタンスのWebルートにソリューションを構築することが含まれます。一見すると、これはマウントされたボリュームを持つDockerコンテナで実現可能なように見えます。しかし、現在のDocker for Windowsの制限により、コンテナ内のボリュームの保存先は存在しないか空のディレクトリでなければなりません。

解決策/回避策としては、マウントされた別の "ホット "フォルダで変更を監視し、SitecoreのWebルートにコピーするという方法があります。このウォッチプロセスが起動時に確実に開始されるようにするには、デフォルトのSitecore本番のENTRYPOINTをオーバーライドすることができます。

このウォッチプロセスとコンパニオンENTRYPOINTの組み合わせは、まさにsitecore-docker-tools-assetsイメージに含まれているものです。

sitecore-docker-tools-assetsイメージの開発ENTRYPOINT

イメージのビルドプロセスを支援する他のスクリプトとともに、sitecore-docker-tools-assets イメージには以下のスクリプトが含まれており、このガイドではこれらのスクリプトを中心に説明します。

スクリプトを見る

C:\toolsscriptsWatch-Directory.ps1 - ファイルの変更のソースパスを監視し、それに応じて宛先パスを更新します。
ENTRYPOINTスクリプト

C:\tools\entrypointsIisDevelopment.ps1 - IISベースのロール(例: cm, cd, xconnect)に使用する開発用のENTRYPOINTスクリプト。
C:Tools\entrypoints\worker\Development.ps1 - .NET コア・ベースのワーカー・ロール (例: xdbsearchworker, xdbautomationworker, cortexprocessingworker) で使用する開発用の ENTRYPOINT スクリプトです。
Development.ps1スクリプトの機能はそれぞれ同じです。以下のようになります。

ディレクトリが C:deploy にマウントされている場合、バックグラウンドジョブとしてウォッチプロセス (Watch-directory.ps1) を開始し
デフォルトのSitecore ENTRYPOINTを呼び出す
Note C:\deploy はデフォルトのソースディレクトリですが、必要に応じて上書きすることができます。ウォッチスクリプトのパラメータをカスタマイズして、異なるソースパスとデスティネーションパスを使用したり、追加のファイルやフォルダを除外したりすることができます。
ソリューションの構造を理解する

Dockerを使ったSitecore開発では、代表的なソリューションに「dockerフォルダ」という新しいフォルダが導入されています。dockerフォルダには、Docker開発をサポートするためのファイルやフォルダが含まれています。このガイドでは、deployフォルダに焦点を当てて説明します。

dockerdeployフォルダ

custom-imagesdocker フォルダに移動し、ここにある deploy フォルダの内容を見てください。以下のような構造になっています。

deploy
環境
[...]
環境] フォルダのそれぞれは、コードのデプロイ先として、また

コードのデプロイ先であり
開発ENTRYPOINTウォッチスクリプトのソース
この場合、WebサイトフォルダはSitecore Webサイト/プラットフォームコンテナ（cm、cdなど）を提供し、xconnectフォルダはSitecore xConnectコンテナ（xconnectなど）を提供します。

これらがどのように設定されているかは、次に説明します。

Docker Examples環境のプロジェクト

Docker Examplesリポジトリには、ファイルデプロイのシナリオを実演するのに役立つ2つのプロジェクトが含まれています。custom-imagesフォルダに移動し、Visual StudioでソリューションDockerExamples.slnを開きます。以下のプロジェクトを見てみましょう。

DockerExamples.Webサイト - Webサイト/プラットフォームの成果物のビルドと公開を容易にし、デフォルトのSample Inner Sublayout.ascxの簡単な修正も含まれています。
DockerExamples.XConnect - xConnectアーティファクトのビルドと公開を容易にします。
Helixソリューションでは、DockerExamples.WebサイトとDockerExamples.XConnectプロジェクトは、別個の環境モジュールと1つ以上のプロジェクト/機能モジュールに分割されることが多いですが、ここでは簡単のために組み合わせています。
これらのプロジェクトのそれぞれについて、「DockerDeploy」の公開プロファイルを見つけることができます。

Visual Studio DockerDeploy

それぞれのDockerDeploy.pubxmlファイルを調べると、対応するDockerDeploy環境サブフォルダにパブリッシュするように設定されていることがわかります。DockerExamples.Website を docker\deploy\website に、DockerExamples.XConnect を docker\deploy\xconnect に変更しました。

ファイルデプロイのオプション

Dockerの例のソリューションは、基本的なVisual Studioのファイルパブリッシュを使用したシンプルな例です。実際のソリューションでは、Team Development for Sitecore (TDS)やHelix Publishing Pipeline (HPP)に含まれているものや、独自のカスタムアプローチなど、より堅牢なデプロイメカニズムを使用しているかもしれません。

しかし、最終的な目標は同じです: ファイルを適切な dockerdeploy 環境サブフォルダに移動させることです。

これは、すでにSitecore開発のベストプラクティスであるWebルートへのデプロイに従っている人にとっては、非常に馴染み深いものに感じられるはずです。今では、ファイルを直接 Web ルートに送るのではなく、dockerdeploy に送ります。

Sitecore ランタイムイメージに適用

関係する主要なコンポーネントを理解したところで、これらがSitecoreランタイムのDockerfilesとDocker Composeでどのようにまとめられているかを見ていきます。

Dockerfileの指示を追加する

cmサービスのSitececore runtime Dockerfileを開く（例：C:\sitecoredocker-examplescustom-imagesdockerbuildcmDockerfile）。

TOOLING_IMAGEは、最初にARG（Docker Composeで設定したもの）を持ってきて、ビルド段階の名前付きツールとして起動されているのがわかります。

ARG TOOLING_IMAGE
[...]
FROM ${TOOLING_IMAGE} as tooling

コピー
すると、toolsフォルダ(entrypointスクリプトを含む)がtoolingイメージからコピーされているのがわかります(C:\toolsへ)。

COPY --from=tooling ♦♦♦\tools

コピー
xconnectサービス用のSitececore runtime Dockerfile（例：C:\sitecoreDocker-examples\custom-images\\dockerbuildxconnectDockerfile）を開くと、同じ手順が表示されます。

これらは、XP1 と XM1 トポロジで使用するための cd Sitecore runtime Dockerfile (例: C:\sitecoreDocker-examples\custom-images\dockerbuild\cdDockerfile) にも含まれています。
Sitecore runtime Dockerfileに必要なものはこれだけです。ここで重要なのは、ENTRYPOINTスクリプト(例: C:IoTs\\entrypoints\\iisDevelopment.ps1)とwatchスクリプト(例: C:IoTs\s\scripts\Watch-Directory.ps1)がイメージにコピーされ、実行時に利用できるようになっていることです。

Docker Composeで設定する

custom-imagesフォルダのルートにあるdocker-compose.override.ymlファイルを開きます（例：C:\sitecore\docker-examplescustom-imagesdocker-compose.override.yml）。

docker-compose.ymlファイルは、Sitecoreに付属のDocker Composeファイルです。docker-compose.override.ymlは、メインファイルを拡張し、カスタムSitecoreイメージのビルドや開発に必要なオーバーライドや拡張子を備えています。
どのように設定されているのか、cmサービスを見てみましょう。

cm.
  image: ${REGISTRY}${COMPOSE_PROJECT_NAME}-xp0-cm:${VERSION:-latest}
  をビルドします。
    context: ./docker/build/cm
    argsを使用しています。
      BASE_IMAGE. SITECORE_DOCKER_REGISTRY}sitecore-xp0-cm:${SITECORE_VERSION}。
      SPE_IMAGE. サイトコア・モジュール・レジストリ}spe-assets:${SPE_VERSION}spe-assets:${SPE_VERSION}spe-assets:${SPE_VERSION}。
      SXA_IMAGE. SITECORE_MODULE_REGISTRY}sxa-xp1-assets:${SXA_VERSION}sxa-xp1-assets:${SXA_VERSION}。
      TOOLING_IMAGE. サイトコア・ドッカー・ツールズ・アセット:${TOOLS_VERSION}sitecore-docker-tools-assets:${TOOLS_VERSION}sitecore-docker-tools-assets:${TOOLS_VERSION}の場合
      SOLUTION_IMAGE. REGISTRY}${COMPOSE_PROJECT_NAME}-solution:${VERSION:-latest}-solution:${VERSION:-latest}.
  [...]
  ボリュームがあるわ。
    - ${LOCAL_DEPLOY_PATH}website:C:
    [...]
  entrypoint: powershell -Command "& C:C:\toolsentrypointsiis\\Development.ps1"

コピー
この設定にはかなりの量が詰め込まれています。以下にその内容を示します。

TOOLING_IMAGE ビルド引数は sitecore-docker-tools-assets イメージリポジトリを使用するように設定されています。特定のイメージタグやバージョンは、環境ファイル (.env) で定義されている TOOLS_VERSION 変数によって決定されます。
また、.env ファイルの LOCAL_DEPLOY_PATH には、dockerdeploy フォルダの相対パスが設定されています。
この変数は、Dockerボリュームのあるデフォルトのwatch script source folder (C:\deploy)の実行中のコンテナに、docker\deploy website environment sub-folder (.\docker\deploy\website)を公開するために使用されます。
デフォルトのentrypointは上書きされ、development ENTRYPOINTスクリプトに設定されます。
ボリュームの詳細については、Dockerのドキュメントを参照してください。
xconnectサービスが同様の方法で設定されていることがわかります。ただし、C:deployボリュームマウントを代わりにdocker\deploy xconnect環境サブフォルダにマッピングします。

xconnect.
  [...]
  volumes.
    - ${LOCAL_DEPLOY_PATH}xconnect:C:\deploy
  [...]

コピー
このセットアップが完了すると、実行中の Sitecore Docker インスタンス内の Web サイト/プラットフォームまたは xConnect コンテナのいずれかにソリューションアセットを独立して公開することができます。

Dockerの実行例

必要なサンプルの準備が完了したことを確認してください。
PowerShellプロンプトを開き、custom-imagesフォルダ（例：C:\sitecoredocker-examples\custom-images）に移動します。Docker Compose upコマンドを使ってDocker Examplesを実行します。

docker-compose up -d

コピー
このコマンドやガイドで使用されているその他の一般的なコマンドの簡単なリファレンスについては、Sitecore Docker チートシートを参照してください。
インスタンスが立ち上がって実行できるようになったら、https://cm.dockerexamples.localhost を参照してください。おなじみのSitecoreのデフォルトページに、Dockerのロゴが追加されています。

Dockerの例 ホームページ

これはDockerExamples.WebサイトプロジェクトにあるSample Inner Sublayout.ascxに追加されています。

まだ行っていない場合は、custom-imagesフォルダに移動して、ソリューションのDockerExamples.slnを開きます。
Visual StudioでSample Inner Sublayout.ascxファイルを開き、変更を加えます。例えば、Dockerロゴの下に新しい段落を追加します。

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

コピー
DockerDeploy "パブリッシュプロファイルを使ってDockerExamples.Webサイトプロジェクトをパブリッシュします(Solution ExplorerでDockerExamples.Webサイトプロジェクトを右クリックして "Publish... "をクリックします)。

これは、ファイルをdocker\deploy websiteフォルダに公開していることを覚えておいてください。これは、ウォッチスクリプトを起動し、cmコンテナのウェブルートにコピーします。
公開が完了したら、ブラウザで https://cm.dockerexamples.localhost のページを更新すると、変更が反映されているのがわかるはずです。

Docker の例 ホームページの変更

xConnect の例でもお気軽に試してみてください。ソリューションで行ったxConnectの変更は、DockerExamples.XConnectプロジェクトの「DockerDeploy」パブリッシュプロファイルを使用して公開することができ、xconnectコンテナに反映されます。

終わったら、downコマンドを使ってコンテナを停止して削除します。

docker-compose down

コピー
フォルダのクリーンアップを展開

mssql や solr のデータフォルダと同様に、docker/deploy フォルダ内のファイルは docker-compose ダウン後も残っているため、データが古くなってしまう可能性があります。

これらのフォルダ内のファイルを手動で削除するか、付属の clean.ps1 スクリプトを使用してください。custom-images フォルダに移動し、PowerShell 管理者プロンプトから実行してください。

.Dockerclean.ps1

## 関連情報

* [Dockerfile ENTRYPOINT reference](https://docs.docker.com/engine/reference/builder/#entrypoint)