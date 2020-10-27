---
id: xconnect-model
title: カスタム xConnect モデルを含む
sidebar_label: カスタム xConnect モデルを含む
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/xconnect-model です

このガイドでは、Sitecore Experience Platform (XP) 実装用の Sitecore Docker イメージを構築する際に、カスタム xConnect モデルがどのように含まれているかを説明します。

始める前に

このガイドでは、ソリューションのビルド出力を含むカスタム Sitecore ランタイムイメージをビルドできることを前提としています。また、dockerbuild フォルダにも精通している必要があります。

さらに、このガイドでは、Sitecore xConnect、xConnect モデル、カスタマイズの方法についてある程度の知識があることを前提としています。

Docker Examples リポジトリをクローンします。

まだやっていない場合は、Docker Examples リポジトリをマシン上のどこかにクローンしてください。例えば、C:\sitecoredocker-examples (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、custom-images フォルダを使用します。

サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ準備を行っていない場合は、準備手順に従うか、同梱のinit.ps1スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecoredocker-examples\custom-images）に移動します。以下のコマンドを実行し、-LicenseXmlPathをSitecoreライセンスファイルの場所に置き換えます。

.\init.ps1 -LicenseXmlPath C:\Licenselicense.xml

コピー
xConnectモデルの展開を理解する

xConnect カスタムモデルの開発には、いくつかの必要なビルドアーティファクトがあり、それぞれのビルドアーティファクトは Sitecore Experience Platform コンテナ環境内の特定のイメージで終了する必要があります。

定義されたビルド成果物

カスタム xConnect モデルの作成とデプロイに関するドキュメントに基づいて、以下のような仮想的なビルド成果物が出てきます。

CustomModel.dll
CustomModel, 1.0.json
sc.CustomModel.xml (ドキュメントのステップ 2 Marketing Automation Engine セクションへのモデルのデプロイ)
Sitecore.XConnect.Client.configパッチ（ドキュメントの「コアロールへのモデルの展開」セクションのステップ2）。
アーティファクトを必要とする Sitecore イメージ

以下の表は、XP0 (シングル) と XP1 (スケーリング) の両方のトポロジ用の Sitecore イメージの一覧です。どのイメージが xConnect ビルド アーティファクトを必要とし、どこに含まれている必要があるかがわかります。イメージがここに表示されていない場合、そのイメージには成果物は必要ありません。

これらのアーティファクトのインクルードは、各イメージ/ロールの Sitecore ランタイム Dockerfile で行われます。

Sitecore イメージ/ロール XP0 XP1 CustomModel.dll CustomModel, 1.0.json sc.CustomModel.xml Sitecore.XConnect.Client.config パッチ
cd x root
cm x x x root
xconnect x root root\App_Data\Models root\App_DataConfig\SitecoreMarketingAutomation	
xdbsearchworker x x x root		
xdbautomationworker x x x x root root root\App_Data\Config\SitecoreMarketingAutomation	
cortexprocessingworker x x x root root rootApp_Data		
prc x root
rep x root
xdbcollection x rootbin rootApp_Data\Models		
xdbsearch x rootbin rootApp_Data		
xdbautomation x rootbin root\\App_Data\Models root\App_DataConfig\\SitecoreMarketingAutomation	
ルートパスは、イメージごとに異なることに注意してください。Worker" ロールの場合は C:\service、それ以外の場合は C:\inetpub\wwwroot となります。
Docker の xConnect プロジェクトの例

Docker Examples リポジトリには、カスタム xConnect モデルのデモに役立つ複数のプロジェクトが含まれています。custom-imagesフォルダに移動し、Visual StudioでソリューションDockerExamples.slnを開きます。以下のプロジェクトを見てみましょう。

DockerExamples.XConnect.Model - カスタム xConnect モデルとファセット（上の表のCustomModel.dll）が含まれています。
DockerExamples.XConnect - xConnectアーティファクトのビルドと公開を容易にし、必要なxConnect設定ファイルDockerExamples.XConnect.Model.DemoModel, 1.0.json(上の表のCustomModel, 1.0.json)とsc.DockerExamples.DemoModel.xml(上の表のsc.CustomModel.xml)を含んでいます。
DockerExamples.Webサイト - Webサイト/プラットフォームの成果物のビルドと公開を容易にし、必要なxConnect設定ファイルDockerExamples.XConnect.config(上の表のSitecore.XConnect.Client.configパッチ)も含みます。
Helixソリューションでは、DockerExamples.XConnectとDockerExamples.Websiteプロジェクトは、別個の環境モジュールと1つ以上のプロジェクト/機能モジュールに分割される可能性がありますが、ここでは簡単のためにまとめています。
App.XConnect.ModelBuilder - 必要なxConnectモデルJSONファイルを生成するためのコンソールアプリです。
App.XConnect.Demo - カスタムモデルとファセットにテストコンタクトを追加するコンソールアプリ。
ソリューション ビルドでの設定

custom-imagesフォルダに移動し、ここにあるDockerfile（例：C:\sitecoredocker-examplescustom-imagesDockerfile）を確認してください。

xConnect(DockerExamples.XConnect.csproj)は、Webサイト・プラットフォームビルド(DockerExamples.Website.csproj)とは別にビルドされており、出力先はC:\outxconnectとなっています。

RUN msbuild .srcDockerExamples.XConnectDockerExamples.XConnect.csproj /p:Configuration=Release /p:DeployOnBuild=True /p:DeployDefaultTarget=WebPublish /p:WebPublishMethod=FileSystem /p:PublishUrl=C:OUTxconnect

コピー
ビルダーの段階から最終イメージにコピーされ、以下のような構造になっているのがわかります。

\貢献度の高いものは、次のような構造になっています。
COPY --from=builder C:Out\xconnect .

コピー
代替 - xConnect モデルの JSON ファイルを動的に生成します。

モデルJSONを手動で生成し(例えば、App.XConnect.ModelBuilderを使用して)、ソリューションに含める代わりに(srcDockerExamples.XConnect.Model.DemoModel, 1.0.json)、Dockerfileの命令の一部としてこれを行うことができます。

この方法の欠点は、xConnect モデルを実行中のコンテナに公開できないことです(イメージ ビルドが必要なので)。
App.XConnect.ModelBuilder の例では、出力パスに引数を指定しています。ビルダーの段階で、App.XConnect.ModelBuilder をビルドし、それを使用して xConnect モデル JSON ファイルを生成することができます。

RUN msbuild .src\\App.XConnect.ModelBuilder App.XConnect.ModelBuilder.csproj /p:Configuration=Release /p:OutDir=C:\build
RUN .\App.XConnect.ModelBuilder C:Available

コピー
そして、これらをコピーするように、最終的な成果物の指示を調整してください。

COPY --from=builder C:Out\xconnect .
COPY --from=builder C:Outcomexconnect\\\\Models .

コピー
Sitecoreランタイムイメージにアーティファクトを追加する

次の例では、Sitecore Experience Platform - Single (XP0) トポロジの構成を示します。

また、Sitecore Experience Platform - Scaled (XP1)のトポロジーにアップストリーム環境でデプロイする場合は、Sitecoreランタイムイメージを設定することも考慮する必要があります。Docker Examplesリポジトリには、これらのサービス(xdbcollection、xdbsearchなど)用のSitecoreランタイムDockerfileのサンプルがあります。
xconnectサービス用のSitececore runtime Dockerfileを開く(例: C:\sitecoreDocker-examples\custom-imagesDockerbuildxconnectDockerfile)。

IIS イメージを使用するので、C:\pub\pub\wwwroot を作業ディレクトリに設定し、ソリューション・ビルド・イメージの xConnect ビルド・ファイルをコピーします。

WORKDIR C:\inetpub\wwwroot
COPY --from=solution ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝ ｿﾘｭｰｼｮﾝｿﾘｭｰｼｮﾝ

コピー
xdbsearchworker サービス用の Sitecore runtime Dockerfile を開く(例: C:sitecoreDocker-examplescustom-imagesDockerbuildxdbsearchworkerDockerfile)。

xConnect のワーカーロールは .NET Core であるため、C:\service の異なる作業ディレクトリを使用する。

WORKDIR C:\service

コピー
さて、上の表を見てみると、どのアーティファクトが含まれるか、ワーカーのロールがもう少し選択的になっていることに気づくでしょう。xdbsearchworkerイメージは、モデルJSONファイルのみを必要とします。

COPY --from=solution \artifactsxconnect\App_Data\Models .

コピー
ただし、xdbautomationworker（例：C:\sitecore\docker-examplescustom-images\dockerbuild\xdbautomationworkerDockerfile）は、モデルアセンブリとxmlファイルが必要です。


♪COPY --from=solution ♪AiRtifconationafcesxconnect\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\Sitecore.com

コピー
cortexprocessingworker（例：C:\sitecoreDocker-examplescustom-images\dockerbuildcortexprocessingworker\Dockerfile）では、モデル・アセンブリとJSONファイルが必要ですが、C:Dockerfileでは、モデル・アセンブリとJSONファイルが必要です。




コピー
Dockerの実行例

必要なサンプルの準備が完了したことを確認してください。
PowerShellプロンプトを開き、custom-imagesフォルダ（例：C:\sitecoredocker-examplescustom-images）に移動します。Docker Compose upコマンドを使用してDocker Examplesを実行します。

docker-compose up -d

コピー
このコマンドとガイドで使用されるその他の一般的なコマンドの簡単なリファレンスについては、Sitecore Docker チートシートを参照してください。
インスタンスが立ち上がって実行されたら、Visual Studio に戻り、App.XConnect.Demo コンソールアプリケーションを実行します。これにより、カスタムモデル（DemoModel）とファセット（DemoFacet）を使用するテストコンタクトが追加されます。

SQL Server に接続し、[Sitecore.Xdb.Collection.Shard0/1]...[xdb_collection]...[ContactFacets] からレコードを取得することで、カスタム facet でコンタクトが追加されたことを確認できます。

Dockerの例 xConnectモデル

終わったら、downコマンドでコンテナを停止して削除します。

docker-compose down

## 関連情報

* [xConnect モデル Sitecore のドキュメント](https://doc.sitecore.com/developers/100/sitecore-experience-platform/en/the-xconnect-model.html)