---
id: build-solution
title: ソリューションのビルド
sidebar_label: ソリューションのビルド
---

このガイドでは、DockerfileとDockerイメージのビルドプロセスと、それを使ってSitecoreソリューションをビルドする方法を紹介します。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/build-solution です

## 始める前に

このガイドでは、「はじめに」のドキュメントを読んだことを前提としています。具体的には、すぐに使える [Sitecoreインスタンスを正常に実行](run-sitecore.md) できることを前提としています。

## Docker Examples リポジトリをクローンする

まだやっていない場合は、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンしてください。例えば、C:\sitecore\docker-examples\ (この記事では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、custom-images フォルダを使用します。

## Dockerfiles を理解する

### Dockerfilesの簡単な紹介

Dockerfileを書くことは、アプリケーションをコンテナ化するための最初のステップです。[Dockerfile](intro#dockerfile) には、Dockerイメージの組み立て方や実行方法の指示が含まれていることを覚えておいてください。Dockerfileのコマンドは、イメージの組み立て方のステップバイステップのレシピと考えることができます。

ここでは、シンプルな（Sitecoreではない）ASP.NET MVCアプリの例を示します。

```ASP
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS build
WORKDIR /app

COPY *.sln .
COPY aspnetmvcapp/*.csproj ./aspnetmvcapp/
RUN nuget restore

COPY aspnetmvcapp/. ./aspnetmvcapp/
WORKDIR /app/aspnetmvcapp
RUN msbuild /p:Configuration=Release

FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8 AS runtime
WORKDIR /inetpub/wwwroot
COPY --from=build /app/aspnetmvcapp/. ./
```

この例では [マルチステージビルド](https://docs.docker.com/develop/develop-images/multistage-build/) を使用しています。最初に `mcr.microsoft.com/dotnet/framework/sdk` イメージを使ってコードをビルドし (ビルド段階)、出力を `mcr.microsoft.com/dotnet/framework/aspnet` イメージ (ランタイム段階) にコピーします。

Dockerfileは [Docker buildコマンド](https://docs.docker.com/engine/reference/commandline/build/) に渡され、イメージをビルドして作成します。

オプションの [.dockerignore](https://docs.docker.com/engine/reference/builder/#dockerignore-file) を使用すると、ファイルやフォルダをビルドコンテキストから除外し、サイズを小さくしたり、COPYコマンドやADDコマンドで機密データをスキップしたりすることができます。

> Dockerfiles の詳細については、[Docker のドキュメント](https://docs.docker.com/engine/reference/builder/)を参照してください。

### コードのビルドはどこで行われるべきでしょうか？

上の例で見たように、コードのコンパイルとビルドはDockerfileの命令の一部です。.NETの場合、これにはNuGetのリストアとMSBuildの呼び出しが含まれているかもしれません。このようにDockerfileで直接アプリケーションをビルドすることは、より「伝統的な」ビルドに比べて以下のような利点があります。

* **移植性** - ビルドプロセス全体が「コンテナ化」されています。ビルドエージェントとローカル環境は、Docker以外に何もインストールする必要がありません。
* **ビルド環境のコントロール** - どのビルド依存関係（とどのバージョン）を使用するかはソリューションが所有します。
* **効率性** - ビルドステップが非常に冗長であっても、Dockerのビルドキャッシュを使用することで、リビルドが最適化されます。
* **Dockerエコシステムの中でうまく実行する** - ビルドはDockerコマンドを使ってトリガーすることができ、他のイメージで使用するためのビルド成果物の取得は、Dockerfile FROM命令で簡単に行えます。

このガイドでは、このアプローチに焦点を当てています。

> Dockerfileでのビルドが望ましいとはいえ、ソリューションをビルドするためには従来の方法に頼らざるを得ない場合もあります（レガシーコードベースやビルドプロセスの制限などの理由で）。このシナリオの詳細については、次の記事を参照してください。

## ソリューションのビルド Dockerfile とイメージ

ほとんどのDockerの例では、コードがコンパイルされ、ベースとなるWindowsイメージの上にビルドされ、結果として得られたイメージが直接実行されます（ランタイムイメージと呼ばれます）。

しかし、典型的なSitecoreの実装では、1つのVisual Studioソリューションで複数のロール（例：WebサイトやXConnectアセンブリ）用のビルド成果物を作成するのが一般的で、いくつかの成果物は複数のロール（例：CM/CD）にデプロイする必要があります。コンテナの場合、同じビルド出力を複数の Sitecore ランタイムイメージの上に重ねる必要があります。各Sitecoreイメージごとにビルド命令を複製することもできますが、これは非常に非効率的です。

そこで必要なのは、(1)ソリューションをビルドし、(2)ビルド結果のイメージ上に構造化されたビルド成果物として出力を保存することだけに特化したDockerfileです。

### Dockerfile をビルド

これはまさにルートの `Dockerfile` の例にあるものです。

> Dockerコミュニティでは、`Dockerfile.build`という名前のビルド用Dockerfileをよく見かけます。

*custom-images* フォルダに移動して、ここにある `Dockerfile` を見てみてください (例: *C:\sitecore\docker-examples\custom-images\Dockerfile* )。

> ここでは、簡単のために `BASE_IMAGE` と `BUILD_IMAGE` のARGを展開しています。

このファイルは、[エスケープ文字](https://docs.docker.com/engine/reference/builder/#escape) を (デフォルトのバックスラッシュではなく) バックスティックに設定するためのエスケープディレクティブで始まります。

```yml
# escape=`
```

次に、NuGetのリストアに必要なアーティファクトだけを集めるための `prep` 段階を行います。これは.NETビルドでよく行われる最適化です。[Dockerfile のベストプラクティス - NuGet リストアの最適化](dockerfile-best-practices.md#nuget-リストアの最適化) を参照してください。

```yml
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS prep

COPY *.sln nuget.config Directory.Build.targets Packages.props \nuget\
COPY src\ \temp\
RUN Invoke-Expression 'robocopy C:\temp C:\nuget\src /s /ndl /njh /njs *.csproj *.scproj packages.config'
```

新しいビルダーステージは、[.NET Framework SDKイメージ](https://hub.docker.com/_/microsoft-dotnet-framework-sdk/) に基づいてコードのコンパイルとビルドプロセスを開始し、BUILD_CONFIGURATION ARGが宣言されます（これは [Docker Composeで設定](#docker-composeで設定する) された "debug "か "release "のどちらかになります）。

```yml
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS builder
ARG BUILD_CONFIGURATION
```

SHELL命令は、それ以降のすべての命令でデフォルトのシェルをPowerShell（デフォルトのcmdから）に切り替えます。これはWindowsのDockerfilesでよく見かける命令です。

```yml
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]
```

次に、作業ディレクトリを作成し、先ほど収集したNuGetアーティファクトをコピーし、(最適化された)nugetリストアを行います。

```yml
WORKDIR C:\build
COPY --from=prep .\nuget .\
RUN nuget restore
```

復元後、残りのソースコードをコピーして、変換ファイルを C:\outtransforms に集めています。

```yml
COPY src\ .\src\
RUN Invoke-Expression 'robocopy C:\build\src C:\out\transforms /s /ndl /njh /njs *.xdt'
```

> この例では、COPYコマンドのサイズを小さくし、binやobjフォルダのようなものを除外する.dockerignore(Dockerfileと並んでいる)が含まれています。 これはDockerfileをビルドする際のベストプラクティスです。

> コンフィグ変換についての詳細は、 [コンフィグ変換の適用](config-transforms.md) ガイドを参照してください。


次に、設定した `BUILD_CONFIGURATION` に対してmsbuildを使用してビルドを実行します。 この例では、Webサイト/プラットフォーム(*DockerExamples.Website.csproj*)とxConnect(*DockerExamples.XConnect.csproj*)の両方の環境をターゲットにしたプロジェクトが含まれています。単純なファイルシステムの公開で、出力先はそれぞれ `C:\out\website` と `C:\out\xconnect` になります。

```
RUN msbuild .\src\DockerExamples.Website\DockerExamples.Website.csproj /p:Configuration=$env:BUILD_CONFIGURATION /p:DeployOnBuild=True /p:DeployDefaultTarget=WebPublish /p:WebPublishMethod=FileSystem /p:PublishUrl=C:\out\website
RUN msbuild .\src\DockerExamples.XConnect\DockerExamples.XConnect.csproj /p:Configuration=$env:BUILD_CONFIGURATION /p:DeployOnBuild=True /p:DeployDefaultTarget=WebPublish /p:WebPublishMethod=FileSystem /p:PublishUrl=C:\out\xconnect
```

> xConnect ビルドの詳細については、[カスタム xConnect モデルを含む](xconnect-model.md) するガイドを参照してください。

ビルドが完了したら、最終イメージ用のビルド出力を収集します。このステージでは、Microsoft Nano Server イメージを使用します。このイメージはファイルを配信するだけで実行されることはないため、ベースイメージは最適化されたサイズで、他のランタイムイメージよりもはるかに小さいものが選択されます。

```yml
FROM mcr.microsoft.com/windows/nanoserver:1809
```

出力ファイルは、の段階から、`builder` 以下の構造で最終イメージにコピーされます。

* \artifacts\website
* \artifacts\transforms
* \artifacts\xconnect

```yml
WORKDIR C:\artifacts
COPY --from=builder C:\out\website .\website\
COPY --from=builder C:\out\transforms .\transforms\
COPY --from=builder C:\out\xconnect .\xconnect\
```

> この例では、Sitecore アイテムのシリアライズは考慮していません。シリアライズのフレームワークや戦略によっては、ソリューションのビルドDockerfileに追加の指示がある場合があります。詳細については、[アイテムの展開](item-deployment.md) を参照してください。

### ソリューションイメージ

ソリューションの [Dockerfileのビルド](#dockerfile-をビルド) は、ビルドの成果物だけで構成されるイメージを生成します。アセットイメージ」と呼ばれることもありますが、結果として得られるソリューションイメージは決してDockerコンテナで実行されることを意図したものではありません。

次回の記事では、このソリューションイメージが実際にどのようにして[カスタムSitecoreイメージを作成する](build-sitecore-images.md) ために使用されるかを見ていきます。

## Docker Composeで設定する

イメージを生成するためには [Dockerのビルドコマンド](https://docs.docker.com/engine/reference/commandline/build/) を使ってDockerfileを送る必要があることを覚えておいてください。ビルドコマンドを直接使うこともできますが、多くの場合はDocker Composeで設定します。

custom-imagesフォルダ（例：*C:\sitecore\docker-examples\custom-images* ）に移動して、以下のファイルを見てみましょう。

* .env
* docker-compose.yml
* docker-compose.override.yml

これらは全てDocker Composeファイルの種類です。`.env` ファイルと `docker-compose.yml` ファイルは以前の記事で見ましたが、`docker-compose.override.yml` は新しいものです。

> Composeファイルの形式については、[Dockerのドキュメント](https://docs.docker.com/compose/compose-file/) を参照してください。

### docker-compose.override.yml を理解する

Docker Composeコマンド(例: `docker-compose up -d`)では、特に指定がない限り、`docker-compose.override.yml` ファイルは自動的にメインの `docker-compose.yml` ファイルと一緒にインクルードされます。Docker Composeに2つ以上のComposeファイルが渡されると、それらをマージして、すべてのリソースと設定を1つのマージされた定義にまとめます。

> 複数のComposeファイルの使用方法の詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/extends/#multiple-compose-files) を参照してください。

この例では、`docker-compose.yml` ファイルは *Sitecore Experience Platform - Single (XP0)* Docker Compose ファイルで、Sitecore から提供されています。`docker-compose.override.yml` *は、メインファイルを拡張し、カスタムSitecoreイメージのビルドや開発に必要なオーバーライドや拡張機能を備えています*。

### ソリューションサービスの設定

`docker-compose.override.yml` ファイルでは、ソリューションイメージのビルドが定義されています。このファイルを開いて、ソリューションサービスがどのように設定されているかを見てみましょう。

```yml
solution:
  image: ${REGISTRY}${COMPOSE_PROJECT_NAME}-solution:${VERSION:-latest}
  build:
    context: .
    args:
      BASE_IMAGE: ${SOLUTION_BASE_IMAGE}
      BUILD_IMAGE: ${SOLUTION_BUILD_IMAGE}
      BUILD_CONFIGURATION: ${BUILD_CONFIGURATION}
  scale: 0
```

いくつかの重要な注意点があります。

* 変数の値（例：`${SOLUTION_BASE_IMAGE}`）は、この例では環境ファイル([.env](https://docs.docker.com/compose/env-file/) )で定義されていますが、ローカルの開発マシン上のシステム環境変数やビルドサーバ上のシークレットから取得することもできます。
* イメージ名には "-solution" という接尾辞を使用します。デフォルトの変数値では、タグ付けされたバージョンは `docker-examples-solution:latest` になります。
* `build` `context` は `.` に設定されており、Docker Composeが同じ場所で [Dockerfile をビルド](#dockerfile-をビルド) を使用するように指示します。
* `build` `args` はビルドDockerfileにあるものと相関しています。
* `scale` は0に設定されており、`docker-compose up` に `solution` サービスのコンテナが起動しないようになっています。

## ソリューションイメージをビルド

PowerShellプロンプトを開き、Composeファイルと同じフォルダ(例: *C:\sitecore\docker-examples\custom-images* )から以下を実行します。

```powershell
docker-compose build solution
```

* このガイドで使用されているコマンドやその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Docker チートシート](cheat-sheet.md) を参照してください。

これでソリューションイメージのビルドプロセスが開始され、順調にいけばイメージが作成されます。

```powershell
Building solution
Step 1/21 : ARG BASE_IMAGE
Step 2/21 : ARG BUILD_IMAGE
Step 3/21 : FROM ${BUILD_IMAGE} AS prep
[...]
Successfully built 9bb20b2ab6db
Successfully tagged docker-examples-solution:latest
```

すべてのDockerイメージをリストアップすることで、イメージが作成されたことが確認できます。

```powershell
docker images
```

```yml
REPOSITORY                TAG     IMAGE ID      CREATED        SIZE
docker-examples-solution  latest  9bb20b2ab6db  2 minutes ago  259MB
```

## ソリューションイメージのビルドのトラブルシューティング

まずは[トラブルシューティングガイド](troubleshooting.md) をご覧ください。

ソリューションイメージ (または他の「アセットイメージ」) に特有のよくあるトラブルシューティングの問題は、イメージがコンテナとして実行されることがないため、結果として得られるファイルシステムをどのように探索するかが明らかではないということです。これは、[対話型シェルでイメージを実行](cheat-sheet.md#イメージ内での対話型シェルの実行) することで可能です。

例えば、上記のソリューションイメージの例に対して対話型コマンドプロンプトを開くには (Nano Server には PowerShell がありません)、以下のようにします。

```powershell
docker run -it --rm docker-examples-solution:latest
```

exit と入力して一時的なコンテナを削除し、前の PowerShell セッションに戻ります。

## 次のステップ

ソリューションがどのように構築され、ビルドアーティファクトを持つイメージを手に入れたかを見てきましたが、Sitecore ランタイムイメージを作成するためにどのように使用されるかについては、リンクをたどってください。

* [カスタムSitecoreイメージを構築する](build-sitecore-images.md)

## 関連情報

* [Dockerfile参照](https://docs.docker.com/engine/reference/builder/)
* [WindowsでのDockerfile](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/manage-docker/manage-windows-dockerfile)
* [Dockerfileのベストプラクティスとシナリオ](dockerfile-best-practices.md)
