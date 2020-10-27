---
id: dockerfile-best-practices
title: Dockerfileのベストプラクティスとシナリオ
sidebar_label: Dockerfileのベストプラクティスとシナリオ
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/dockerfile-best-practices です


このページでは、独自のDockerfilesを書くためのベストプラクティスをリストアップし、DockerベースのSitecore開発中に遭遇する一般的なビルドシナリオをまとめています。

ベストプラクティス

Dockerfileを書くときには、Dockerビルドプロセスへの影響と結果としてのイメージの両方を考慮する必要があります。構造の悪いDockerfileは、ビルド時間が長くなったり、イメージサイズが大きくなったりする原因になります。幸いにも、最適化する方法はたくさんあります。

最良のガイドはDockerとMicrosoftから直接提供されています。どちらも徹底的に読む価値があります。

Dockerfileを書くためのベストプラクティス
WindowsのDockerfilesを最適化する
キーポイント

マルチステージビルドを使用して、ビルドの依存性を取り除き、最終的なイメージのサイズを小さくします。
.dockerignore ファイルをインクルードして、ビルドのコンテキスト (とイメージのサイズ) を小さくします。
イメージレイヤーを理解し、ビルドキャッシュを活用する。
キャッシングを最適化するために、変更頻度の低いものから最も変更頻度の高いものへとステップを順序立てます。
NuGet リストアの最適化

NuGetリストアを実行することは、Dockerfileでソリューションを構築する際の一般的なステップです。しかし、これは最適化を考えていないとビルド時間を食いつぶしてしまう可能性があります。

覚えておいてほしいのは、各ビルドステップでは、以前のすべてのステップがキャッシュされていれば結果がキャッシュされ、COPYコマンドでは、ソースファイルのハッシュが変更されていなければ結果がキャッシュされるということです。このことを念頭に置いて、キャッシュバストを最小限に抑えるために、NuGetリストアのためにコピーされるファイルをもう少し選択することができます。

簡単な例を示します。

FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS build

# NuGet の必需品をコピーして、別のレイヤーに復元します。
COPY *.sln nuget.config .
COPY src *.csproj .
RUN nuget restore

# 他の全てをコピーしてビルドなど
COPY src. .
RUN msbuild /p:Configuration=Release

[...]

コピー
最初に必要なNuGetファイルだけをコピーし、nugetリストアを実行してから、それ以外のファイルを取り込みます。これにより、NuGet の復元ステップをより頻繁にキャッシュすることができ、毎回再ダウンロードする必要がなくなります。

パッケージ参照に浮動小数点(*)やバージョン範囲を使用している場合 (PackageReference 形式でのみ利用可能)、キャッシュされた復元レイヤーで古いバージョンのパッケージが表示される可能性があることに注意してください。これは、正確なバージョンを使用している場合は問題ありません。
これは、単純なフォルダ構造を持つ基本的なソリューションには最適です。しかし、「COPY」コマンドのワイルドカードの制限により、フォルダ構造が失われるため、ほとんどのソリューション（例：Sitecore Helix）では、すぐに扱いにくくなります。

これを回避する方法はいくつかありますが、そのほとんどはフォルダ構造とプロジェクト名を仮定する必要があります。ほとんどのSitecoreの例で見られる方法は、ロボコピー(これらの仮定を取り除く)と一緒に、別の "準備 "ビルドステージを利用しています。

FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS prep

# ディレクトリ構造を保持したまま、NuGetの復元に必要なアーティファクトのみを収集します。
COPY *.sln nuget.config \nuget
COPY src
RUN Invoke-Expression 'robocopy C:\temp C:\nugetet\src /s /ndl /njh /njs *.csproj *.scproj packages.config'

[...]

# 新しいビルド段階、独立したキャッシュ
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8 AS build

# 事前に準備した NuGet アーティファクトをコピーし、別のレイヤーとして復元します。
COPY --from=prep .
RUN nuget restore

# 他の全てをコピーしてビルドなど
COPY src .
RUN msbuild /p:Configuration=Release

[...]

コピー
プライベートNuGetフィードを使う

ビルドでは、プライベートフィードからNuGetパッケージを取得する必要がある場合があります。Dockerコンテキストでビルドする際には、資格情報が保護されていることを確認するために、資格情報の管理に特別な配慮が必要です。

詳細は以下の記事を参照してください。

DockerシナリオでのNuGet資格情報の管理
Sitecoreのチーム開発で構築

Team Development for Sitecore (TDS)を使用したDockerソリューションのビルドには、HedgehogDevelopment.TDS NuGetパッケージとTDSライセンス環境変数が必要です。

https://hedgehogdevelopment.github.io/tds/chapter5.html#sitecore-tds-builds-using-cloud-servers
GitHubのHelix.Examplesリポジトリで例を見ることができます。

