---
id: dockerfile-best-practices
title: Dockerfileのベストプラクティスとシナリオ
sidebar_label: Dockerfileのベストプラクティスとシナリオ
---

このページでは、独自のDockerfilesを書くためのベストプラクティスをリストアップし、DockerベースのSitecore開発中に遭遇する一般的なビルドシナリオをまとめています。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/dockerfile-best-practices です

## ベストプラクティス

Dockerfileを書くときには、Dockerビルドプロセスへの影響と結果としてのイメージの両方を考慮する必要があります。構造の悪いDockerfileは、ビルド時間が長くなったり、イメージサイズが大きくなったりする原因になります。幸いにも、最適化する方法はたくさんあります。

最良のガイドはDockerとMicrosoftから直接提供されています。どちらも徹底的に読む価値があります。

* [Dockerfileを書くためのベストプラクティス](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
* [Windows Dockerfile を最適化する](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/manage-docker/optimize-windows-dockerfile)

**キーポイント**

* [マルチステージビルド](https://docs.docker.com/develop/develop-images/multistage-build/)を使用して、ビルドの依存性を取り除き、最終的なイメージのサイズを小さくします。
* [.dockerignore ファイル](https://docs.docker.com/engine/reference/builder/#dockerignore-file)をインクルードして、[ビルドのコンテキスト](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#understand-build-context) (とイメージのサイズ) を小さくします。
* [イメージレイヤー](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/manage-docker/optimize-windows-dockerfile#image-layers-in-docker-build)を理解し、ビルドキャッシュを活用する。
* キャッシングを最適化するために、変更頻度の低いものから最も変更頻度の[命令の順序指定](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/manage-docker/optimize-windows-dockerfile#ordering-instructions)を順序立てます。

## NuGet リストアの最適化

NuGetリストアを実行することは、Dockerfileでソリューションを構築する際の一般的なステップです。しかし、これは最適化を考えていないとビルド時間を食いつぶしてしまう可能性があります。

覚えておいてほしいのは、各ビルドステップでは、以前のすべてのステップがキャッシュされていれば結果がキャッシュされ、`COPY`コマンドでは、ソースファイルのハッシュが変更されていなければ結果がキャッシュされるということです。このことを念頭に置いて、キャッシュバストを最小限に抑えるために、NuGetリストアのためにコピーされるファイルをもう少し選択することができます。

簡単な例を示します。

```
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS build

# NuGet のエッセンスをコピーし、別のレイヤーとして復元する
COPY *.sln nuget.config .
COPY src\*.csproj .\src\
RUN nuget restore

# 他のすべてをコピーして、ビルドなど
COPY src\. .\src\
RUN msbuild /p:Configuration=Release

[...]
```

最初に必要なNuGetファイルだけをコピーし、`nuget restore` を実行してから、それ以外のファイルを取り込みます。これにより、NuGet の復元ステップをより頻繁にキャッシュすることができ、毎回再ダウンロードする必要がなくなります。

> パッケージ参照に[浮動小数点(*)やバージョン範囲](https://docs.microsoft.com/ja-jp/nuget/concepts/package-versioning)を使用している場合 (PackageReference 形式でのみ利用可能)、キャッシュされた復元レイヤーで古いバージョンのパッケージが表示される可能性があることに注意してください。これは、正確なバージョンを使用している場合は問題ありません。

これは、単純なフォルダ構造を持つ基本的なソリューションには最適です。しかし、[COPY コマンドのワイルドカードの制限](https://github.com/moby/moby/issues/15858)により、フォルダ構造が失われるため、ほとんどのソリューション（例：Sitecore Helix）では、すぐに扱いにくくなります。

これを[回避する方法](https://stackoverflow.com/questions/51372791/is-there-a-more-elegant-way-to-copy-specific-files-using-docker-copy-to-the-work)はいくつかありますが、そのほとんどはフォルダ構造とプロジェクト名を仮定する必要があります。ほとんどのSitecoreの例で見られる方法は、`robocopy`(これらの仮定を取り除く)と一緒に、別の "準備 "ビルドステージを利用しています。

```
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS prep

# Gather only artifacts necessary for NuGet restore, retaining directory structure
COPY *.sln nuget.config \nuget\
COPY src\ \temp\
RUN Invoke-Expression 'robocopy C:\temp C:\nuget\src /s /ndl /njh /njs *.csproj *.scproj packages.config'

[...]

# New build stage, independent cache
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS build

# Copy prepped NuGet artifacts, and restore as distinct layer
COPY --from=prep .\nuget .\
RUN nuget restore

# Copy everything else, build, etc
COPY src\ .\src\
RUN msbuild /p:Configuration=Release

[...]
```

## プライベートNuGetフィードを使う

ビルドでは、プライベートフィードからNuGetパッケージを取得する必要がある場合があります。Dockerコンテキストでビルドする際には、資格情報が保護されていることを確認するために、資格情報の管理に特別な配慮が必要です。

詳細は以下の記事を参照してください。

* [DockerシナリオでのNuGet資格情報の管理](https://github.com/dotnet/dotnet-docker/blob/master/documentation/scenarios/nuget-credentials.md)

## Team Development for Sitecore で構築

Team Development for Sitecore (TDS)を使用したDockerソリューションのビルドには、`HedgehogDevelopment.TDS` NuGetパッケージとTDSライセンス環境変数が必要です。

* https://hedgehogdevelopment.github.io/tds/chapter5.html#sitecore-tds-builds-using-cloud-servers

[GitHubのHelix.Examplesリポジトリ](https://github.com/Sitecore/Helix.Examples)で例を見ることができます。

