---
id: add-modules
title: Sitecoreモジュールの追加
sidebar_label: Sitecoreモジュールの追加
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/add-modules です

このガイドでは、Sitecoreモジュールの「アセットイメージ」を紹介し、カスタムSitecore Dockerイメージを構築する際に、これらを使用して追加のSitecoreモジュールをインクルードする方法を説明します。この例では、Sitecore Experience Platform - Single (XP0) インスタンスに [Sitecore PowerShell Extensions (SPE)](https://doc.sitecorepowershell.com/) モジュールと [Sitecore Experience Accelerator (SXA)](https://doc.sitecore.com/developers/sxa/100/sitecore-experience-accelerator/en/index-en.html) モジュールを追加しています。

## 始める前に

このガイドでは、[カスタムSitecoreランタイムイメージをビルド](build-sitecore-images.md)できることを前提としています。また、[docker\build フォルダ](build-sitecore-images.md#ソリューションの構造を理解する)と [Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) にも精通している必要があります。

さらに、このガイドでは、追加されるSitecoreモジュールについて、少なくともある程度の知識があることを前提としています。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンしてください。例えば、C:\sitecore\docker-examples\ (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、custom-images フォルダを使用します。

## サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ[準備を行っていない場合](https://containers.doc.sitecore.com/docs/run-sitecore#準備するもの)は、準備手順に従うか、同梱のinit.ps1スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecoredocker-examples\custom-images）に移動します。以下のコマンドを実行し、-LicenseXmlPathをSitecoreライセンスファイルの場所に置き換えます。

```
.\init.ps1 -LicenseXmlPath C:\License\license.xml

```

## Sitecoreモジュールのアセットイメージを理解する

Sitecoreでは、カスタムSitecoreイメージを構築する際にSitecoreモジュールをインストールするために必要なファイルやスクリプトを含む、公式にサポートされているモジュール「アセットイメージ」を提供しています。これらのアセットイメージは、[ソリューションイメージ](build-solution.md#ソリューションイメージ)と同様に、ビルド時のソースとして使用することを目的としており、実行時には使用されません。

各トポロジーに対して、各Sitecoreモジュールに対して1つのアセットイメージがあります。利用可能なすべてのモジュールのリストについては、[Sitecoreモジュールリファレンス](module-reference.md) を参照してください。

> xp0イメージ(例: sxa-xp0-assets)はないことに注意してください。Sitecore Experience Platform - Single (XP0) インスタンスの場合は、xp1 イメージ (例: sxa-xp1-assets) を使用します。

### イメージの構造

各モジュールアセット画像には、以下のファイル構造を持つリソースが含まれています。

* **C:\module\[role]\content** - Content to overlay base Sitecore images
* **C:\module\db** - dacpac files with changes to databases required by module.
* **C:\module\solr** - モジュールに必要な Solr コアのデプロイに使用するファイル
* **C:\module\tools** - Docker イメージのビルド時に実行する追加ツールとスクリプト

> アセットイメージがコンテナとして実行されることはありませんが、インタラクティブシェルでイメージを実行することで、ファイルシステムを探索することができることを覚えておいてください。

特定のSitecoreモジュールをインストールするには、これらのリソースを使用して、カスタムイメージのビルドプロセス中に、ファイル、データベース、インデックスの変更をベースのSitecoreランタイムイメージにデプロイします。

これは、[必要なDockerfileの手順](module-reference.md)を [SitecoreランタイムのDockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) に追加することで実現します。

## Sitecore ランタイムイメージに適用する

次の例では、*Sitecore Experience Platform - Single (XP0)* トポロジーに Sitecore PowerShell Extensions (SPE) モジュールと Sitecore Experience Accelerator (SXA) モジュールを追加するための構成を示します。

### Dockerfileの追加手順

#### コンテンツマネジメント（CM）の役割

cmサービス用の [Sitececore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) を開く（例：C:\sitecore\docker-examples\custom-images\docker\build\cm\Dockerfile）。

SPEとSXAのモジュールのアセットイメージは、最初にARG([Docker Compose の設定](#docker-compose-の設定))で持ち込まれ、後で使うために名前付きビルドステージ speとsxaとして起動されているのがわかります。

```
ARG SXA_IMAGE
ARG SPE_IMAGE
[...]
FROM ${SPE_IMAGE} as spe
FROM ${SXA_IMAGE} as sxa
```

これで、[SPE](module-reference.md#sitecore-powershell-extensions-spe) と [SXA](module-reference.md#sitecore-experience-accelerator-sxa) の両方に必要なcm Dockerfile命令が、`WORKDIR`命令のすぐ後に追加されているのがわかります。

```
COPY --from=spe \module\cm\content .\

COPY --from=sxa \module\cm\content .\
COPY --from=sxa \module\tools \module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath .\; `
    Remove-Item -Path C:\module -Recurse -Force;
```

`COPY`の指示が調整されていることに注意してください。

*+* ソースの "--from" には spe と sxa の実際の名前付きビルドステージを使用してください。
* 指定するために .\ 相対パスを利用する、前回の `WORKDIR` は、作業ディレクトリを `C:\inetpub\wwwroot` に設定しています。

> **ベストプラクティス:** Dockerfileのベストプラクティスである、キャッシングを最適化するために最も変更頻度の低いものから最も変更頻度の高いものへと順を追って、モジュールの指示をソリューションの指示の前に追加する必要があります。

#### Microsoft SQL Server（mssql）の役割

ここで、mssqlサービス用の[Sitececore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) (例：C:\sitecore\docker-examples\custom-images\docker\build\mssql\Dockerfile)を開く。

同じ `ARG` とビルドステージが宣言され、[SPE](module-reference.md#sitecore-powershell-extensions-spe)と[SXA](module-reference.md#sitecore-experience-accelerator-sxa)の両方に必要なmssql Dockerfile命令が追加されているのがわかると思います。

```
COPY --from=spe \module\db \spe_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\spe_data; `
    Remove-Item -Path C:\spe_data -Recurse -Force;

COPY --from=sxa \module\db \sxa_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\sxa_data; `
    Remove-Item -Path C:\sxa_data -Recurse -Force;
```

#### Apache Solr (solr) ロール

最後に、[Sitececore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)（例：C:\sitecore\docker-examples\custom-images\docker\build\solr\Dockerfile）を開きます。

同じ`ARG`とビルドステージが宣言され、必要なsolr Dockerfile命令が追加されています。この場合は[SXA](module-reference.md#sitecore-experience-accelerator-sxa)に限ります。

```
COPY --from=sxa \module\solr \sxa_data
RUN C:\Add-SolrCores.ps1 -SolrPath C:\solr -SolrSchemaPath C:\sxa_data\managed-schema -SolrCoreNames 'sitecore_sxa_master_index,sitecore_sxa_web_index'; `
    Remove-Item -Path C:\sxa_data -Recurse -Force;
```

> SXAモジュールは、XP1とXM1トポロジで使用するために、cd Sitecore runtime Dockerfile (例: C:\sitecore\docker-examples\custom-images\docker\build\cd\Dockerfile)にも含まれています。

### Docker Compose の設定

custom-imagesフォルダのルートにある`docker-compose.override.yml`ファイルを開きます（例：C:\sitecore\docker-examples\custom-images\docker-compose.override.yml）。

> `docker-compose.yml`ファイルは、Sitecoreに付属のDocker Composeファイルです。`docker-compose.override.yml`は、メインファイルを拡張し、カスタムSitecoreイメージのビルドや開発に必要なオーバーライドや拡張子を備えています。

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
```

`SPE_IMAGE` と `SXA_IMAGE` の値は、[Sitecoreモジュールリファレンス](module-reference.md)に従って、各モジュールのDockerイメージリポジトリを使用するように設定しています。xp0イメージは存在しないので、SXAは `sxa-xp1-assets` を使用することを覚えておいてください。

特定のモジュールのイメージタグやバージョンは、専用の変数 `SPE_VERSION` と `SXA_VERSION` で定義されます。これらは[環境ファイル](https://docs.docker.com/compose/env-file/) (.env) で定義されています。

残りのサービス（`mssql`と`solr`）も同様の方法で設定されていることがわかります。

## Docker のサンプルを実行する

> [必要なサンプル](#サンプルの準備)の準備が完了したことを確認してください。

PowerShellプロンプトを開き、custom-imagesフォルダ（例：C:\sitecore\docker-examples\custom-images ）に移動します。Docker Compose `up`コマンドを使ってDocker Examplesを実行します。

```
docker-compose up -d
```

> このコマンドやガイドで使用されているその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Dockerのチートシート](cheat-sheet.md)を参照してください。

インスタンスが立ち上がって稼働したら、https://cm.dockerexamples.localhost/sitecore を参照して Sitecore にログインします。ユーザー名には「admin」を、パスワードには `.env` ファイルの [SITECORE_ADMIN_PASSWORD] に指定した値（`init.ps1`のデフォルトでは「Password12345」）を使用します。

Sitecore PowerShell Extensions (SPE) と Sitecore Experience Accelerator (SXA) に慣れている人なら、モジュールが実際にインストールされていることがすぐにわかるはずです。

慣れていない方は、Launchpad上に「PowerShell ISE」と「PowerShell Reports」というボタンが追加されているのがわかるはずです。これらはSitecore PowerShell Extensions (SPE)によって追加されたものです。

![Dockerの例 SPE Launchpadのボタン](/docs/SPE-Launchpad-Buttons.png "Dockerの例 SPE Launchpadのボタン")

ここでContent Editorを開くと、ルートのContentフォルダに「Tenant」の挿入オプションが表示されているはずです。これらはSitecore Experience Accelerator (SXA)によって追加されます。

![Dockerの例 SXA Content Editor Tenant](/docs/SXA-Content-Editor-Tenant.png "Dockerの例 SXA Content Editor Tenant")

終わったら、`down`コマンドでコンテナを停止して削除します。

```
docker-compose down
```

## 関連情報

* [Sitecore モジュールリファレンス](module-reference.md)