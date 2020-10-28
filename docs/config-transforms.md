---
id: config-transforms
title: コンフィグ変換の適用
sidebar_label: コンフィグ変換の適用
---

Sitecoreの実装では、Sitecoreのconfigパッチでは変更できない設定ファイルの修正が必要になることがよくあります。例えば、Web.config、ConnectionStrings.config、Domains.config、Layers.configなどです。このような場合は、[XDT変換ファイル](https://docs.microsoft.com/ja-jp/previous-versions/aspnet/dd465326(v=vs.110)) を使用します。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/config-transforms です

このガイドでは、Sitecore Dockerイメージを構築する際に、これらのXDTベースのコンフィグトランスフォームをどのように適用するかを説明します。トランスフォームファイルは、[ソリューション内](#ソリューション変換) にある場合と、[特定のSitecoreロール用のDockerfileにローカルにある場合](#ロールの変換) があります。この例では、Sitecore Experience Management (XM1) インスタンスを使用しています。

## 始める前に

このガイドでは、ソリューションの[ビルド出力を含むカスタム Sitecore ランタイムイメージ](build-sitecore-images.md) をビルドできることを前提としています。また、[docker\build フォルダー](build-sitecore-images.md#ソリューションの構造を理解する) にも精通している必要があります。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンしてください。例えば、C:\sitecore\docker-examples\ (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、*custom-images* フォルダを使用します。

## サンプルの準備

カスタムイメージの例では、実行する前にいくつかの準備が必要です。まだ準備を行っていない場合は、[準備するもの](run-sitecore.md#準備するもの) に従うか、同梱の `init.ps1` スクリプトを実行して、これらの準備手順を自動的に実行してください。

PowerShell 管理者プロンプトを開き、custom-images フォルダ（例：C:\sitecoredocker-examples\custom-images）に移動します。以下のコマンドを実行し、`-LicenseXmlPath` をSitecoreライセンスファイルの場所に置き換えます。

```
.\init.ps1 -LicenseXmlPath C:\License\license.xml
```

## Docker サンプル変換ファイル

Docker Examplesソリューションには、カスタムの「Docker-Examples」httpヘッダを操作する `Web.config` 用の2つのXDT設定トランスフォームファイルが含まれています。*custom-images* フォルダに移動して、以下のトランスフォームファイルを見てください。

**\src\DockerExamples.Website\Web.config.xdt**

この変換ファイルはソリューション内にあるので、すべてのコアSitecoreロール（XM1トポロジーのCMとCD）に適用されます。これは[ソリューションのトランスフォーム](#ソリューション変換) の例です。ここでは、"Docker-Examples "のhttpヘッダを追加し、"Solution transform "に設定しています。

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Docker-Examples" xdt:Locator="Match(name)" value="Solution transform" xdt:Transform="InsertIfMissing" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

**\docker\build\cm\transforms\Web.config.xdt**

この変換ファイルは、cmサービスのローカルのdockerbuildフォルダ内にあります。これは[ロールトランスフォーム](#ロールの変換)の例です。こちらは "Docker-Examples "のhttpヘッダを "Role transform "に変更しています。

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Docker-Examples" xdt:Locator="Match(name)" value="Role transform" xdt:Transform="SetAttributes(value)" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

> **ベストプラクティス:** 複数の変換を適用する際には、変換は操作の順番を考慮しなければなりません。しかし、変換は毎回新鮮な設定ファイルに適用されるので、それらの変換が偶数であることを確認する必要はありません。

この例では、最初にソリューションの変換を適用し、次にロールの変換を適用します。次にこれらがどのように適用されるかを見てみましょう。

## ソリューション変換

すべてのコアSitecoreロールに適用される構成変換は、ソリューション構造に直接格納されます。

以下の例では、専用のソリューションビルドアーティファクトを利用して、ソリューションの変換を収集して適用しています。このアプローチの大きな利点は、[Sitecore Helix](https://helix.sitecore.net/)ソリューションでは一般的な、同じコンフィグファイルに対して複数のトランスフォームをサポートしていることです。

これは Sitecore Helix ソリューションではよくあることです。例えば、レイヤー間で複数の `Web.config` トランスフォームがあるかもしれません。

* \src\Foundation\[Module Name]\website\Web.config.xdt
* \src\Feature\[Module Name]\website\Web.config.xdt
* \src\Project\[Module Name]\website\Web.config.xdt

このシナリオでは、これらのファイルをすべてビルド出力に含めると（つまり、"ビルドアクション "を "コンテンツ "に設定すると）、1つだけが出力され、最終的に適用されることになります。その代わりに、これらのファイルをそれぞれ除外して(すなわち、"ビルドアクション "を "なし "に設定して)、ソリューションのビルドイメージに別々に収集することができます。

> また、[変換ファイルをメインのビルド出力に残しておき](#代替案---メインのビルド出力でトランスフォームファイルを使う)、ウェブルートで「その場で」変換を実行することもできますが、同じ設定ファイルに対して複数の変換をサポートしていないという欠点があります。

### ソリューションのビルドで設定する

custom-imagesフォルダに移動して、ここにある `Dockerfile`（例：C:\sitecore\docker-examples\custom-images\Dockerfile）を見てみましょう。

トランスフォームファイル(`.xdt`拡張子)は、ビルダの中に集められて、C:\out\transforms に落とされているのがわかります。ここでは、(`/s` フラグと一緒に) robocopy を使用することが、フォルダ構造を保持するために重要です。

```
RUN Invoke-Expression 'robocopy C:\build\src C:\out\transforms /s /ndl /njh /njs *.xdt'
```

> これは msbuild の前に行われるので、ビルド出力から除外されていない (つまり "Build Action" が "None" に設定されていない) 追加の .xdt ファイルを拾う心配がないことに注意してください。

ビルダーの段階から最終イメージにコピーされたこれらのファイルは、以下のような構造になっています。

* \artifacts\transforms

```
COPY --from=builder C:\out\transforms .\transforms\
```

### Sitecoreのランタイムイメージに適用

cmサービスの [Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) を開く（例： C:\sitecore\docker-examples\custom-images\docker\build\cm\Dockerfile）。

先ほど集めた、`\transforms\solution\` に着地しているのが分かると思います。

```
COPY --from=solution \artifacts\transforms\ \transforms\solution\
```

開発ツールを tooling イメージからコピーし (C:\tools に)、Invoke-XdtTransform.ps1 スクリプトを使用して変換を行います。

```
COPY --from=tooling \tools\ \tools\
RUN C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath C:\transforms\solution\DockerExamples.Website
```

Invoke-XdtTransform.ps1スクリプトは、-Pathと-XdtPathパラメータに2つのフォルダを受け入れます。フォルダを使用する場合

1. XdtPathのフォルダ構造は-Pathと一致しなければなりません。
2. XdtPath にある変換ファイルは、設定にマッチするように名前を付けなければなりません。

この場合、-Pathは `C:\inetpub\wwwroot` の現在のWORKDIRであり、`-XdtPath` は単一VS「Webサイト」プロジェクトのルートです。

#### Helixソリューションの例

Dockerの例のソリューションは、単一の「Webサイト」プロジェクトのシンプルな例です。[Sitecore Helixのプラクティス](https://helix.sitecore.net/) に従った実際のソリューションでは、入れ子になったフォルダ構造と[レイヤーの優先度](https://helix.sitecore.net/principles/architecture-principles/layers.html)(すなわち、Project > Feature > Foundation)に対応するために、transformコマンドを調整する必要があります。

```
RUN Get-ChildItem C:\transforms\solution\Foundation\*\website | ForEach-Object { & C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath $_.FullName }; `
    Get-ChildItem C:\transforms\solution\Feature\*\website | ForEach-Object { & C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath $_.FullName }; `
    Get-ChildItem C:\transforms\solution\Project\*\website | ForEach-Object { & C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath $_.FullName };
```

[GitHub の Helix.Examples リポジトリ](https://github.com/Sitecore/Helix.Examples) で例を見ることができます。

### 代替案 - メインのビルド出力でトランスフォームファイルを使う

専用のビルド成果物の代わりに、トランスフォームファイルを他のすべてのファイルと一緒にメインのビルド出力に残すことができます。しかし、上で述べたように、この方法の欠点は、同じコンフィグファイルに対して複数のトランスフォームをサポートしていないことです。

> [Dockerfileとイメージをビルドするソリューション](build-solution.md#ソリューションのビルド-dockerfile-とイメージ)がなく、代わりにより[従来のビルドの調整](build-sitecore-images.md#従来のビルドの調整)に頼っている場合は、これが唯一の選択肢になるかもしれません。

次のようになります。

```
RUN $xdts = [System.Collections.ArrayList]@(); `
    $xdts.AddRange(@(Get-ChildItem -Path .\*.xdt)); `
    $xdts.AddRange(@(Get-ChildItem -Path .\App_Config\*.xdt -Recurse)); `
    $xdts | ForEach-Object { & C:\tools\scripts\Invoke-XdtTransform.ps1 -Path $_.FullName.Replace('.xdt', '') -XdtPath $_.FullName }; `
    $xdts | ForEach-Object { Remove-Item -Path $_.FullName };
```

ご覧のように、**Invoke-XdtTransform.ps1** スクリプトは、一致する config ファイルと transform ファイルもパラメータとして受け入れます。

この例では、Web ルートと App_Config フォルダ内の **.xdt** ファイルを探して **Invoke-XdtTransform.ps1** スクリプトに渡し、.xdt ファイルを削除しています。

## ロールの変換

特定のSitecoreロールにのみ適用される設定変換は、そのロールの専用のdockerbuildフォルダ内に保存することができます。

### docker\build フォルダに追加します。

cm サービスの dockerbuild フォルダ（例：C:\sitecoredocker-examplescustom-imagesdockerbuildcm）に移動します。この役割のための「transform」フォルダが追加されていることに気付くと思います。

* build
  * cm
    * transforms
      * Web.config.xdt
    * Dockerfile

この例では、単一の *Web.config.xdt* トランスフォームがありますが、これは cm ロールに必要な他のトランスフォームを含むことができます。

> ソリューションの変換と同様に、変換ファイルはターゲットのフォルダ構造(例えば、C:\inetpubwwwroot)と一致するように構成されなければなりません。

これらの変換は、ロールの [Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile) 内に適用されます。

### Sitecoreランタイムイメージに適用

cmサービス用の[Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)（例：C:\sitecore\docker-examples\custom-images\docker\build\cm\Dockerfile）を開きます。

トランスフォームフォルダの内容は、Docker build contextからコピーして、`\transforms\role` に着地しています。

```shell
COPY .\transforms\ \transforms\role\
```

同じ `Invoke-XdtTransform.ps1` スクリプトを使用して、[ソリューション変換](#sitecoreのランタイムイメージに適用) の後に適用されます。

```shell
RUN C:\tools\scripts\Invoke-XdtTransform.ps1 -Path .\ -XdtPath C:\transforms\role
```

## Docker サンプルの実行例

> 例題の準備が完了したことを確認してください。

まず、cdサービスの [Sitecore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)（例：C:\sitecore\docker-examples\custom-images\docker\build\cd\Dockerfile）を開きます。cdサービスは、ソリューション変換を適用しているが、**ロール変換はしていません**。

PowerShellプロンプトを開いて、custom-imagesフォルダに移動します。Docker Compose upコマンドを使用してDocker Examplesを実行します。

```shell
docker-compose -f docker-compose.xm1.yml -f docker-compose.xm1.override.yml up -d
```

> `-f docker-compose.xm1.yml -f docker-compose.xm1.override.yml` に注意してください。このガイドでは Sitecore Experience Management (XM1) インスタンスを使用しているため、`docker-compose` コマンドでは、`-f` フラグで明示的に "xm1" Compose ファイル (デフォルトの Compose ファイルは XP0) を参照しています。

> このコマンドとガイドで使用されているその他の一般的なコマンドの簡単なリファレンスについては、Sitecore Docker チートシートを参照してください。

以下のコマンドで、Sitecore Experience Management (XM1) コンテナにアクセスできます。

* Sitecore Content Management (cm): https://cm.dockerexamples.localhost
* Sitecore Content Delivery (cd): https://cd.dockerexamples.localhost

インスタンスが立ち上がって実行できるようになったら、ブラウザの開発者ツールを使ってhttpヘッダを検査します。トランスフォームの例で追加された「Docker-Examples」というカスタムヘッダーが表示されているはずです。

cmサイトでは「Role transform」、cdサイトでは「Solution transform」と表示されます。

![Docker例のヘッダー](/docs/Docker-Examples-Header.png "Docker例のヘッダー")

## 実行中のコンテナにアップデートを適用する

ここで、例のWeb.config.xdtファイルの1つに変更を加えます。例えば、ソリューションのトランスフォームの値を "My transform "に変更します)。

config transform の変更を有効にするにはイメージビルドが必要なので、以下のコマンドを実行して、実行中のコンテナに適用された変更を確認する必要があります。

```shell
docker-compose -f docker-compose.xm1.yml -f docker-compose.xm1.override.yml up --build -d
```

また、影響を受けるコンテナのみをビルドするなど、より選択的な方法もあります。

```shell
docker-compose -f docker-compose.xm1.yml -f docker-compose.xm1.override.yml build solution cm cd
docker-compose -f docker-compose.xm1.yml -f docker-compose.xm1.override.yml up -d
```

どちらの場合も、upコマンドが呼ばれると、Dockerはcmとcdコンテナだけを再作成します。残りのロールは継続して実行されます。

> コンフィグのトランスフォームを積極的に開発する場合は、https://webconfigtransformationtester.apphb.com/ のようなトランスフォームテストツールを使ってフィードバックループを短くすると便利です。

終わったら、downコマンドを使ってコンテナを停止して削除します。

```shell
docker-compose -f docker-compose.xm1.yml -f docker-compose.xm1.override.yml down
```

## 関連情報

* [Microsoft XDT Transformation Syntax](https://docs.microsoft.com/ja-jp/previous-versions/aspnet/dd465326(v=vs.110))
* [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
