---
id: xconnect-model
title: カスタム xConnect モデルを含む
sidebar_label: カスタム xConnect モデルを含む
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/xconnect-model です

このガイドでは、Sitecore Experience Platform (XP) 実装用の Sitecore Docker イメージを構築する際に、カスタム xConnect モデルがどのように含まれているかを説明します。

## 始める前に

このガイドでは、ソリューションのビルド出力を含むカスタム [Sitecore ランタイムイメージをビルドできること](build-sitecore-images.md)を前提としています。また、[dockerbuild フォルダ](build-sitecore-images.md#ソリューションの構造を理解する)にも精通している必要があります。

さらに、このガイドでは、Sitecore xConnect、[xConnect モデル](https://doc.sitecore.com/developers/100/sitecore-experience-platform/en/the-xconnect-model.html)、[カスタマイズの方法](https://doc.sitecore.com/developers/100/sitecore-experience-platform/en/create-a-model.html) についてある程度の知識があることを前提としています。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples)をマシン上のどこかにクローンしてください。例えば、 C:\sitecore\docker-examples (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、*custom-images* フォルダを使用します。

## サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ準備を行っていない場合は、[準備手順](run-sitecore.md#準備するもの)に従うか、同梱の `init.ps1` スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecore\docker-examples\custom-images）に移動します。以下のコマンドを実行し、`-LicenseXmlPath` をSitecoreライセンスファイルの場所に置き換えます。

```
.\init.ps1 -LicenseXmlPath C:\License\license.xml
```

## xConnectモデルの展開を理解する

xConnect カスタムモデルの開発には、いくつかの必要なビルドアーティファクトがあり、それぞれのビルドアーティファクトは Sitecore Experience Platform コンテナ環境内の特定のイメージで終了する必要があります。

### 定義されたビルド成果物

[カスタム xConnect モデルの作成とデプロイ](https://doc.sitecore.com/developers/100/sitecore-experience-platform/en/deploy-a-custom-model.html) に関するドキュメントに基づいて、以下のような仮想的なビルド成果物が出てきます。

* **CustomModel.dll**
* **CustomModel, 1.0.json**
* **sc.CustomModel.xml** (ドキュメントのステップ 2 Marketing Automation Engine セクションへのモデルのデプロイ)
* **Sitecore.XConnect.Client.config パッチ**（ドキュメントの「コアロールへのモデルの展開」セクションのステップ2）。

### アーティファクトを必要とする Sitecore イメージ

以下の表は、XP0 (シングル) と XP1 (スケーリング) の両方のトポロジ用の Sitecore イメージの一覧です。どのイメージが xConnect ビルド アーティファクトを必要とし、どこに含まれている必要があるかがわかります。イメージがここに表示されていない場合、そのイメージには成果物は必要ありません。

これらのアーティファクトのインクルードは、各イメージ/ロールの [Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) で行われます。

| Sitecore image / role  | XP0 | XP1 | CustomModel.dll | CustomModel, 1.0.json | sc.CustomModel.xml                                | Sitecore.XConnect.Client.config patch |
|------------------------|-----|-----|-----------------|-----------------------|---------------------------------------------------|---------------------------------------|
| cd                     |     | x   | root\bin        |                       |                                                   | x                                     |
| cm                     | x   | x   | root\bin        |                       |                                                   | x                                     |
| xconnect               | x   |     | root\bin        | root\App_Data\Models  | root\App_Data\Config\Sitecore\MarketingAutomation |                                       |
| xdbsearchworker        | x   | x   |                 | root\App_Data\Models  |                                                   |                                       |
| xdbautomationworker    | x   | x   | root            |                       | root\App_Data\Config\Sitecore\MarketingAutomation |                                       |
| cortexprocessingworker | x   | x   | root            | root\App_Data\Models  |                                                   |                                       |
| prc                    |     | x   | root\bin        |                       |                                                   | x                                     |
| rep                    |     | x   | root\bin        |                       |                                                   | x                                     |
| xdbcollection          |     | x   | root\bin        | root\App_Data\Models  |                                                   |                                       |
| xdbsearch              |     | x   | root\bin        | root\App_Data\Models  |                                                   |                                       |
| xdbautomation          |     | x   | root\bin        | root\App_Data\Models  | root\App_Data\Config\Sitecore\MarketingAutomation |                                       |

> `root` パスは、イメージごとに異なることに注意してください。Worker" ロールの場合は `C:\service`、それ以外の場合は `C:\inetpub\wwwroot` となります。

## Docker の xConnect プロジェクトの例

Docker Examples リポジトリには、カスタム xConnect モデルのデモに役立つ複数のプロジェクトが含まれています。custom-imagesフォルダに移動し、Visual StudioでソリューションDockerExamples.slnを開きます。以下のプロジェクトを見てみましょう。

* **DockerExamples.XConnect.Model** - カスタム xConnect モデルとファセット（上の表のCustomModel.dll）が含まれています。
* **DockerExamples.XConnect** - xConnectアーティファクトのビルドと公開を容易にし、必要なxConnect設定ファイル `DockerExamples.XConnect.Model.DemoModel, 1.0.json` (上の表の*CustomModel, 1.0.json*)と `sc.DockerExamples.DemoModel.xml` (上の表の *sc.CustomModel.xml* )を含んでいます。
* **DockerExamples.Website** - Webサイト/プラットフォームの成果物のビルドと公開を容易にし、必要なxConnect設定ファイル `DockerExamples.XConnect.config`(上の表のSitecore.XConnect.Client.configパッチ)も含みます。

> [Helixソリューション](https://helix.sitecore.net/) では、 *DockerExamples.XConnect* と *DockerExamples.Website* プロジェクトは、別個の環境モジュールと1つ以上のプロジェクト/機能モジュールに分割される可能性がありますが、ここでは簡単のためにまとめています。

* **App.XConnect.ModelBuilder** - 必要なxConnectモデルJSONファイルを生成するためのコンソールアプリです。
* **App.XConnect.Demo** - カスタムモデルとファセットにテストコンタクトを追加するコンソールアプリ。

## ソリューション ビルドでの設定

custom-imagesフォルダに移動し、ここにある `Dockerfile`（例：C:\sitecore\docker-examples\custom-images\Dockerfile）を確認してください。

xConnect(*DockerExamples.XConnect.csproj*)は、Webサイト・プラットフォームビルド(*DockerExamples.Website.csproj*)とは別にビルドされており、出力先は `C:\out\xconnect` となっています。

```
RUN msbuild .\src\DockerExamples.XConnect\DockerExamples.XConnect.csproj /p:Configuration=Release /p:DeployOnBuild=True /p:DeployDefaultTarget=WebPublish /p:WebPublishMethod=FileSystem /p:PublishUrl=C:\out\xconnect
```

`builder` の段階から最終イメージにコピーされ、以下のような構造になっているのがわかります。

* \artifacts\xconnect

```
COPY --from=builder C:\out\xconnect .\xconnect\
```

### 代替 - xConnect モデルの JSON ファイルを動的に生成します。

モデルJSONを手動で生成し(例えば、*App.XConnect.ModelBuilder*を使用して)、ソリューションに含める代わりに(\src\DockerExamples.XConnect\App_Data\Models\DockerExamples.XConnect.Model.DemoModel, 1.0.json)、Dockerfileの命令の一部としてこれを行うことができます。

> この方法の欠点は、[xConnect モデルを実行中のコンテナに公開](file-deployment.md)できないことです(イメージ ビルドが必要なので)。

*App.XConnect.ModelBuilder* の例では、出力パスに引数を指定しています。ビルダーの段階で、*App.XConnect.ModelBuilder* をビルドし、それを使用して xConnect モデル JSON ファイルを生成することができます。

```
RUN msbuild .\src\App.XConnect.ModelBuilder\App.XConnect.ModelBuilder.csproj /p:Configuration=Release /p:OutDir=C:\build
RUN .\App.XConnect.ModelBuilder C:\out\xconnect\models
```

そして、これらをコピーするように、最終的な成果物の指示を調整してください。

```
COPY --from=builder C:\out\xconnect .\xconnect\
COPY --from=builder C:\out\xconnect\models .\xconnect\App_Data\Models\
```

## Sitecoreランタイムイメージにアーティファクトを追加する

次の例では、Sitecore Experience Platform - Single (XP0) トポロジの構成を示します。

> また、Sitecore Experience Platform - Scaled (XP1)のトポロジーにアップストリーム環境でデプロイする場合は、Sitecoreランタイムイメージを設定することも考慮する必要があります。Docker Examplesリポジトリには、これらのサービス(xdbcollection、xdbsearchなど)用のSitecoreランタイムDockerfileのサンプルがあります。

xconnectサービス用の[Sitececore ランタイム Dockerfile](build-sitecore-images#sitecore-ランタイム-dockerfile)を開く(例: C:\sitecore\docker-examples\custom-images\docker\build\xconnect\Dockerfile)。

IIS イメージを使用するので、`C:\inetpub\wwwroot` を作業ディレクトリに設定し、ソリューション・ビルド・イメージの xConnect ビルド・ファイルをコピーします。

```
WORKDIR C:\inetpub\wwwroot
COPY --from=solution \artifacts\xconnect\ .\
```

*xdbsearchworker* サービス用の Sitecore runtime Dockerfile を開く(例: C:\sitecore\docker-examples\custom-images\docker\build\xdbsearchworker\Dockerfile)。

xConnect のワーカーロールは .NET Core であるため、`C:\service` の異なる作業ディレクトリを使用する。

```
WORKDIR C:\service
```

さて、[上の表](#アーティファクトを必要とする-sitecore-イメージ)を見てみると、どのアーティファクトが含まれるか、ワーカーのロールがもう少し選択的になっていることに気づくでしょう。*xdbsearchworker* イメージは、モデルJSONファイルのみを必要とします。

```
COPY --from=solution \artifacts\xconnect\App_Data\Models\ .\App_Data\Models\
```

ただし、*xdbautomationworker*（例：C:\sitecore\docker-examples\custom-images\docker\build\xdbautomationworker\Dockerfile）は、モデルアセンブリとxmlファイルが必要です。

```
COPY --from=solution \artifacts\xconnect\bin\ .\
COPY --from=solution \artifacts\xconnect\App_Data\Config\Sitecore\MarketingAutomation\ .\App_Data\Config\Sitecore\MarketingAutomation\
```

*cortexprocessingworker*（例：C:\sitecore\docker-examples\custom-images\docker\build\cortexprocessingworker\Dockerfile ）では、モデル・アセンブリとJSONファイルが必要ですが、C:Dockerfileでは、モデル・アセンブリとJSONファイルが必要です。

```
COPY --from=solution \artifacts\xconnect\bin\ .\
COPY --from=solution \artifacts\xconnect\App_Data\Models\ .\App_Data\Models\
```

## Docker サンプルの実行

> 必要な[サンプルの準備](#サンプルの準備)が完了したことを確認してください。

PowerShellプロンプトを開き、custom-imagesフォルダ（例：C:\sitecore\docker-examples\custom-images）に移動します。Docker Compose` up`コマンドを使用してDocker Examplesを実行します。

```
docker-compose up -d
```

> このコマンドとガイドで使用されるその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Docker チートシート](cheat-sheet.md)を参照してください。

インスタンスが立ち上がって実行されたら、Visual Studio に戻り、*App.XConnect.Demo* コンソールアプリケーションを実行します。これにより、カスタムモデル（`DemoModel`）とファセット（`DemoFacet`）を使用するテストコンタクトが追加されます。

[SQL Server に接続](run-sitecore#sql-serverへの接続についての注意点)し、`[Sitecore.Xdb.Collection.Shard0/1].[xdb_collection].[ContactFacets]` からレコードを取得することで、カスタム facet でコンタクトが追加されたことを確認できます。

![Dockerの例 xConnectモデル](/docs/Docker-Examples-XConnect-Model.png "Dockerの例 xConnectモデル")

終わったら、`down`コマンドでコンテナを停止して削除します。

```
docker-compose down
```

## 関連情報

* [xConnect モデル Sitecore のドキュメント](https://doc.sitecore.com/developers/100/sitecore-experience-platform/en/the-xconnect-model.html)