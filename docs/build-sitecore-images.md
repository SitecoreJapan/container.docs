---
id: build-sitecore-images
title: カスタムSitecoreイメージを構築する
sidebar_label: カスタムSitecoreイメージを構築する
---

このガイドでは、ソリューションからのビルド出力を他のアセットと一緒に、ベースのSitecoreランタイムイメージにレイヤー化して、独自のカスタムSitecoreイメージを作成する方法について説明します。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/build-sitecore-images です

ここでは、その概要を簡単に説明します。

![カスタムイメージ](/docs/custom-image.svg "カスタムイメージ")


Docker Examplesソリューションを使って、カスタム *Sitecore Experience Platform - Single (XP0)* イメージを構築する方法をご紹介します。

## 始める前に

このガイドでは、[ソリューションをビルド](build-solution.md) して、ビルド成果物を含むDocker[ソリューションイメージ](build-solution#ソリューションイメージ) を持っているか、または従来の方法でビルド出力を利用できることを前提としています。

[Dockerfiles](build-solution.md#dockerfiles-を理解する) と [Docker Compose](build-solution.md#docker-composeで設定する) と、それらがイメージをビルドするためにどのように使用されるのかを熟知している必要があります。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンしてください。例えば、*C:\sitecore\docker-examples\* (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、custom-images フォルダを使用します。

## ソリューションの構造を理解する

Dockerを使ったSitecore開発では、代表的なソリューションに「dockerフォルダ」という新しいフォルダが導入されています。dockerフォルダには、Docker開発をサポートするためのファイルやフォルダが含まれています。このガイドでは、ビルドフォルダに焦点を当てて説明します。

**docker\build フォルダ**

*custom-images\docker* フォルダに移動し、ここにある「build」フォルダ（例：*C:\sitecore\docker-examples\custom-images\docker\build* ）の内容を見てみましょう。以下のような構造になっています。

* build
  * [service]
    * Dockerfile
  * [...]

各[`service`]フォルダ

* 与えられたSitecoreトポロジーを構成するコンテナを表します。この例では、*Sitecore Experience Platform - Single (XP0)* なので、"mssql"、"solr"、"id"、"cm"、"xconnect "など。
* 最低でも `Dockerfile` が含まれています。これは [SitecoreランタイムのDockerfile](#sitecore-ランタイム-dockerfile) です。
* [Docker Composeファイル](#docker-composeで設定する) 内の対応するサービスのDockerビルドコンテキストとして使用されます。

> Docker Examplesリポジトリには、すべてのSitecoreトポロジのサービスをカバーするビルドフォルダが含まれていることに注意してください。

## Sitecore ランタイム Dockerfile

SitecoreランタイムDockerfileは、Sitecoreランタイムイメージのカスタマイズされたバージョンの構築を担当します。

> **ベストプラクティス:** Dockerfileは、Sitecoreトポロジーを構成するコンテナごとに作成する必要があります。

現在カスタマイズを行っていない場合でも、Sitecoreトポロジーを構成する各ロール/コンテナごとにSitecoreランタイムDockerfileを作成する必要があります（「[空のDockerfile](#empty-dockerfile)」を参照）。これを推奨します。

1. ホットフィックスや将来のカスタマイズを行うための専用レイヤーがある。
2. 結果として得られる画像は「自分のもの」であり、名前を付けたり、タグを付けたり、ラベルを付けたり、ソリューションに応じて保存したりすることができます。

> 一般的な [Dockerfileのベストプラクティス](dockerfile-best-practices.md) にも従うことを忘れないでください。

### ソリューションのビルド出力を使用したDockerfile

cmサービスのDockerfileを開く（例：*C:\sitecore\docker-examples\custom-images\docker\build\cm\Dockerfile*）。これは、あなたの [ソリューション・イメージ](build-solution#ソリューションイメージ) のビルド・アーティファクトを使用した例です。

> ここでは、選択されたDockerfileの指示のみをカバーしています。一般的な命令の詳細については、[build Dockerfile](#dockerfile-をビルド) のドキュメントを参照してください。

#### ビルドステージの初期化

ファイルは複数のビルドステージを初期化することで開始します。

```YML
ARG BASE_IMAGE
ARG SXA_IMAGE
ARG SPE_IMAGE
ARG TOOLING_IMAGE
ARG SOLUTION_IMAGE

FROM ${SOLUTION_IMAGE} as solution
FROM ${TOOLING_IMAGE} as tooling
FROM ${SPE_IMAGE} as spe
FROM ${SXA_IMAGE} as sxa
FROM ${BASE_IMAGE}
```

`solution`、`tooling`、`spe`、`sxa` のイメージが持ち込まれ、後で使用するために名前が付けられています（`COPY`の指示があります）。最後は、Sitecoreで渡された `BASE_IMAGE`（[Docker Composeで設定した](#docker-composeで設定する) ）を使って、カスタムイメージを開始します。

#### 開発ツールの追加

開発ツールは、ツールイメージからコピーされます（C:\toolsへ）。これらは、[ローカル開発のための ENTRYPOINT を提供](file-deployment.md#understand-development-entrypoint-scripts) するとともに、後で変形を適用するために使用されます。

```YML
COPY --from=tooling \tools\ \tools\
```

#### 作業ディレクトリの設定

これはIISイメージを使用しているので、私たちのカスタマイズのほとんどは、`C:\inetpub\wwwroot` 内で行われますので、これは作業ディレクトリに設定されています。

```YML
WORKDIR C:\inetpub\wwwroot
```

#### Sitecoreモジュールの追加

Sitecore モジュールは、cm ロールに[必要な指示](module-reference.md) に従って追加されます。この例では、Sitecore PowerShell Extensions (SPE) と Sitecore Experience Accelerator (SXA) が含まれています。

> Sitecore モジュールの詳細については、[Sitecoreモジュールの追加](add-modules.md) ガイドを参照してください。

```YML
COPY --from=spe \module\cm\content .\
COPY --from=sxa \module\cm\content .\
COPY --from=sxa \module\tools \module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath .\; `
    Remove-Item -Path C:\module -Recurse -Force;
```

> **ベストプラクティス:** Dockerfileのベストプラクティスである、キャッシングを最適化するために変更頻度の低いものから最も頻繁に変更されるものへと順を追って、ソリューションの指示の前にモジュールの指示を追加する必要があります。

#### ファイルの追加

次に、ソリューションのビルドイメージのファイルをコピーします。出力ファイルは例のソリューションイメージ `\artifacts\website` に保存されています。

```YML
COPY --from=solution \artifacts\website\ .\
```

#### トランスフォームの追加

cm サービスには、ソリューション変換ファイルとロール変換ファイルの両方の例があります。

> 設定変換の詳細については、[コンフィグ変換の適用](config-transforms.md) ガイドを参照してください。

まず、ソリューション変換をコピーして(思い出したと思いますが、出力された変換は、例のソリューション画像に\artifacts\transforms\ に保存されています)、次にロール変換を行います。

```YML
COPY --from=solution \artifacts\transforms\ \transforms\solution\
COPY .\transforms\ \transforms\role\
```

#### トランスフォームを適用する

最後に、解決策とロール変換をウェブルートに適用します。

```YML
RUN C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath C:\transforms\solution\DockerExamples.Website
RUN C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath C:\transforms\role
```

#### アイテムの追加

お使いのSitecoreアイテムのシリアライズフレームワークと戦略によっては、cm Dockerfileにこれらを考慮した追加の指示がここに記載されている場合があります。詳細は[アイテム展開](item-deployment.md) を参照してください。

### 空のDockerfile

idサービスのDockerfileを開く（例：C:\sitecore\docker-examples\custom-images\docker\build\id\Dockerfile）。

```YML
# escape=`

ARG BASE_IMAGE

FROM ${BASE_IMAGE}
```

これは空のDockerfileの例です。通常のエスケープディレクティブと、Sitecoreで渡されたBASE_IMAGE（[Docker Composeで設定](#docker-composeで設定する) ）を使ったFROM命令以外には何もないことがわかります。

## Docker Composeで設定する

ソリューションイメージと同様に、カスタムSitecoreランタイムイメージのビルドも `docker-compose.override.yml` ファイルで設定します。

> `docker-compose.yml` ファイルは、Sitecoreに付属のDocker Composeファイルであることを覚えておいてください。`docker-compose.override.yml` は、メインファイルを拡張し、カスタムSitecoreイメージのビルドや開発に必要なオーバーライドや拡張機能を備えています。

custom-imagesフォルダのルートにある `docker-compose.override.yml` ファイルを開きます（例：*C:\sitecore\docker-examples\custom-images\docker-compose.override.yml* ）。

*cm* サービスの設定を見てみましょう。

```yml
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
  depends_on:
    - solution
  [...]
```

いくつかの重要な注意点があります。

* 変数の値(例: ${SITECORE_DOCKER_REGISTRY})は、[環境ファイル](https://docs.docker.com/compose/env-file/) (.env)、ローカルの開発マシンのシステム環境変数、またはビルドサーバのシークレットのいずれかから取得することができます。
* イメージ名には "-xp0-cm" という接尾辞を使用します。デフォルトの変数値では、タグ付けされたバージョンは `docker-examples-xp0-cm:latest` になります。
* `build` `context` は `./docker/build/cm` に設定されています。Docker Composeはここにある [SitecoreランタイムDockerfile](#sitecore-ランタイム-dockerfile) を使用します。
* `depends_on` にはソリューションサービスが最初にビルドされるように設定されています。

残りのSitecoreランタイムイメージも同様の方法で設定されていることがわかります。

> エントリポイントやボリュームなどの追加のプロパティが設定されていることに気づくかもしれません。これらはイメージのビルドプロセスには関与しないので、このガイドでは省略します。ただし、これらについては他のガイドで説明しています。

## 従来のビルドの調整

ソリューションのビルドには [Dockerfileをビルド](build-solution.md#dockerfile-をビルド) することが望ましいとはいえ、タスクランナー(gruntやgulpなど)、カスタムPowerShellスクリプト、または他のビルドツール(cakeなど)と一緒にMSBuildを使用する、より「伝統的な」手段に頼る必要があるかもしれません。多くの場合、これは単にレガシーコードベースやビルドプロセスの制限によるものです。

この場合、以下のことを行う必要があります。

1. ビルド出力が、PowerShell などの方法で、それを必要とする dockerbuild フォルダ (この例では cm) への道を確実に作ること。これは、ビルド成果物が個々のDockerfileのビルドコンテキストの一部になるようにするために必要です。
2. docker-compose.override.yml内のソリューションサービスと依存関係を削除します。
3. Dockerfileがソリューションイメージではなく、ローカルのビルドコンテキストからCOPYになるように調整します。

## Sitecoreイメージをビルド

PowerShellプロンプトを開き、Composeファイルと同じフォルダ(例: C:\sitecore\docker-examples\custom-images )から以下を実行します。

```powershell
docker-compose build
```

> このガイドで使用されるこのコマンドやその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Dockerのチートシート](cheat-sheet.md) を参照してください。

これにより、ソリューションイメージのビルドプロセスが開始され、定義されたすべてのカスタムSitecoreランタイムイメージが作成されます。すべてが順調に進むと、カスタムSitecoreランタイムイメージが作成されます。

```powershell
Building solution
[...]
Successfully built baeb10e0ed5a
Successfully tagged docker-examples-xp0-cm:latest
```

すべてのDockerイメージをリストアップすることで、イメージが作成されたことが確認できます。

```powershell
docker images
```

```powershell
REPOSITORY                                  TAG     IMAGE ID      CREATED        SIZE
docker-examples-xp0-cm                      latest  baeb10e0ed5a  2 minutes ago  9.75GB
docker-examples-xp0-solr                    latest  a6cb09ff4658  2 minutes ago  5.19GB
docker-examples-xp0-mssql                   latest  a5d2c06253c4  2 minutes ago  6.62GB
docker-examples-xp0-xconnect                latest  54ecccb36ec5  2 minutes ago  8.4GB
docker-examples-xp0-cortexprocessingworker  latest  cce1aa42f146  2 minutes ago  7.9GB
docker-examples-xp0-xdbautomationworker     latest  73a2d8707319  2 minutes ago  7.9GB
docker-examples-xp0-xdbsearchworker         latest  1b94f7eb2b49  2 minutes ago  7.92GB
docker-examples-id                          latest  d60b3e9c21f3  2 minutes ago  5.45GB
docker-examples-solution                    latest  9bb20b2ab6db  7 minutes ago  259MB
```

## 次のステップ

Sitecore のランタイムイメージがどのように作成されるかの基本を見てきましたが、次は以下のトピックでさらに深く掘り下げていきましょう。

* [コンフィグ変換を適用する](config-transforms.md)
* [Sitecoreモジュールの追加](add-modules.md)
* [カスタム xConnect モデルを含む](xconnect-model.md)
* [アイテム展開](item-deployment.md)

関連情報

* [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
* [Dockerfile on Windows](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/manage-docker/manage-windows-dockerfile)
* [Dockerfile best practices and scenarios](dockerfile-best-practices.md)