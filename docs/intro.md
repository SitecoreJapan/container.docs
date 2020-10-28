---
id: intro
title: 概要
sidebar_label: 概要
---

コンテナとDockerの概念を徹底的にカバーしている優れたリソースはすでに多数存在します。さらなる読み物の下に推奨事項を見つけることができます。そのため、このドキュメントでは、このトピックの概要を簡単に説明するだけです。さらに重要なのは、コンテナ技術がSitecore開発にどのようにフィットするかを見ていくことです。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/intro です

## コンテナとDockerの紹介

ソフトウェア開発の世界でコンテナを取り巻く話題や、Sitecoreがイメージを提供するようになったことを聞いたことがあると思います。これは新しいことではありませんが、Windowsにとっては比較的新しいことであり、Sitecoreにとっては確かに新しいことです。

### コンテナとは？

コンテナとは、コードがライブラリや依存関係と一緒にパッケージ化されたソフトウェアの実行可能な単位です（画像を参照）。

アプリケーションのコンテナ化は、開発者がアプリケーションロジックと依存関係に集中し、IT 運用チームがデプロイと管理に集中できるように、懸念事項を明確に分離することができます。

コンテナ化の主なメリットをいくつかご紹介します。

* **軽量** - ディスク上の小さなサイズと非常に低いオーバーヘッド。

* **分離** - コンテナは、アプリケーションをお互いからだけでなく、基礎となるシステムからも分離します。固有の制約により、コンテナはデフォルトでセキュアになっています。

* **移植性** - コンテナは、コンテナのランタイム環境をサポートする任意のマシン上で実行されます。ローカルでビルドして、オンプレミス環境やクラウド環境に簡単に移行することができます。

* **緩い結合** - コンテナは自己完結性が高く、カプセル化されているため、他のものを中断することなく、1つを交換したり、アップグレードしたりすることができます。

* **スケーラビリティ** - コンテナはルースカップリングで軽量なため、新しいコンテナを作成することで迅速にスケールアウトすることができます。

要するに、コンテナを使えば、アプリの開発、デプロイ、管理が簡単になります。

#### 仮想マシンとどう違うの？

コンテナを理解する最も簡単な方法は、従来の VM との違いを理解することかもしれません。

コンテナはハードウェアスタックを仮想化するのではなく、オペレーティングシステム（OS）レベルで仮想化し、複数のコンテナをOSカーネルの上で直接実行します。これはコンテナがはるかに軽量であることを意味します。OS カーネルを共有し、起動が非常に速く、OS 全体を起動するのに比べてメモリの使用量はほんのわずかです。

![仮想マシンとどう違うの？](/docs/VMs-Containers.png "仮想マシンとどう違うの？")

より詳細な比較については、[コンテナと仮想マシン](https://docs.microsoft.com/ja-jp/virtualization/windowscontainers/about/containers-vs-vm) を参照してください。

### Dockerとは？

コンテナが登場したのは数十年前のことですが、現代のコンテナ開発は2013年のDockerの登場で本格的に動き出しました。

Dockerはコンテナ上にアプリケーションを構築するためのオープンソースプロジェクトであると同時に、この技術を推進し進化させる[企業](https://www.docker.com) でもあります。彼らはDockerの公式レジストリであるDocker Hubも所有しています。Dockerがコンテナの代名詞となっているのは、Dockerの普及に最も成功しているからだ。元々はLinux用に作られたDockerは、現在ではWindowsやMacOSでも動作するようになりました。

コンテナとSitecoreといえば、コンテナ技術は必ずDockerになります。

### 用語解説

知っておきたい用語をご紹介します。

#### イメージ

すべてのコードと依存関係を含むパッケージで、コンテナを作成するための青写真となります。多くの場合、画像は別の画像をベースにしていて、追加でカスタマイズされています。イメージは一度作成されると不変です。

#### Dockerfile

Dockerからのテキストドキュメント形式で、Dockerイメージを組み立てる方法の指示が含まれています。このファイルはDocker CLIのビルドコマンドに渡され、イメージをビルドします。

#### レジストリ

レジストリとは、イメージを保存する場所のことです。これは、パブリック（Docker Hub）またはプライベート（Azure Container Registry）のいずれかになります。レジストリには、1つまたは複数のリポジトリが含まれています。

#### リポジトリ

リポジトリとは、同じ名前の画像を集めたもので、バージョンやバリアントを示すタグが付けられています。画像参照では、リポジトリは最後のコロンの前の部分です。例えば、mcr.microsoft.com/windows/servercore:ltsc2019の「mcr.microsoft.com/windows/servercore」です。

#### タグ

タグはリポジトリ内の特定の画像への参照です。画像の参照では、これは最後のコロンの後の部分で、バージョン番号やアーキテクチャのバリアントなどに使われることが多いです。例えば、mcr.microsoft.com/windows/servercore:ltsc2019の "ltsc2019 "です。タグを指定しない場合、Dockerはタグ名を "latest "にデフォルト設定します。

#### コンテナ

コンテナはイメージのインスタンスです。コンテナは、Dockerイメージの内容、実行環境、標準的な命令セットで構成されています。

#### コンポーズ

マルチコンテナアプリケーションの実行方法を定義するためのDockerのCLIツールと(YAMLベースの)テキストドキュメント形式です。定義を作成したら、1つのコマンド(docker-compose up)でマルチコンテナアプリケーション全体をデプロイすることができ、イメージごとにコンテナを作成します。

#### オーケストレータ

コンテナオーケストレータは、コンテナの管理ツールです。本番環境でのコンテナのデプロイや管理を支援します。現在最も普及しているのはKubernetesで、Azure Kubernetes Service (AKS)を介してMicrosoftがしっかりとサポートしています。

## コンテナベースのSitecore開発のご紹介

さて、概念の基本的な理解ができたところで、これはSitecore開発にとってどのような意味があるのでしょうか？

### なぜSitecoreとコンテナなのか？

Sitecore開発が自然な流れになっているのには、いくつかの理由があります。特に、Sitecoreが長年にわたってマイクロサービスベースのアーキテクチャへと移行してきたことが挙げられます。

コンテナがない場合、関与するサービスの数が増えていくため、面倒な作業になることがあります。一方、コンテナはこのアーキテクチャに非常に適しています（実際にはそれを奨励しています）。開発者の環境で完全にスケーリングされた XP1 トポロジをスピンアップすることは、もはや困難ではありません。

その他の理由は以下の通りです。

* **インストール不要** - SIF (Sitecore Install Framework) や SIM (Sitecore Instance Manager) などを使ったインストールが不要になります。Sitecoreは、すぐに使える[コンテナイメージ](#sitecore-イメージ)を提供します。`docker-compose up`で簡単にインスタンスを立ち上げて稼働させましょう。コンテナイメージはすべて自動的にダウンロードされます。

* **マルチプロジェクトの効率化** - VMベースのアイソレーションの約束、実現。複数のSitecoreインスタンスを同時に実行することで、SQLやSolrのバージョンが異なることを気にすることなく、複数のSitecoreインスタンスを同時に実行できます。プロジェクト間を移動する際には、インスタンス全体を迅速に起動・停止し、マシンのリソースを有効活用します。

* **シンプルなオンボーディング** - オンボーディングプロセスは、[インストールの前提条件](environment-setup.md)、コードリポジトリのクローン作成、`docker-compose up`の実行というシンプルなものになりました。

* **環境の一貫性** - 環境の不整合による問題を排除します。私のマシンでは動作する」ということはもうありません。ビルドをコンテナ化して、DevOps / 継続的インテグレーション (CI) を通じてビルド環境を完全にコントロールできます。

* **環境の安定性** - コンテナの不変性により、ローカルの Sitecore インスタンスに問題が発生しても、`docker-compose down` と `docker-compose up` を実行するだけで心配ありません。

#### 私のチームに適していますか？

コンテナがSitecore開発者にもたらす多くのメリットが見えてきました。しかし、組織にとっては、他にも考慮しなければならないことがあるでしょう。コンテナとDockerがチームに適しているかどうかを判断するために、[Sitecore Knowledge Centerのこちらの記事](https://www.sitecore.com/knowledge-center/getting-started/should-my-team-adopt-docker)をご覧ください。

### Sitecore イメージ

#### バージョン10.0以上

Sitecoreバージョン10.0からは、Sitecore Container Registry（SCR）であるscr.sitecore.comで、すべてのロールとトポロジーに対応したコンテナイメージを利用できるようになりました。

> **注意:** Sitecore Container Registryの使用方法については、[Sitecoreイメージリファレンス](https://containers.doc.sitecore.com/docs/image-reference) を参照してください。

#### 以前のバージョン

以前のバージョンの Sitecore では、[docker-images コミュニティリポジトリ](https://github.com/Sitecore/docker-images) を使うことができます。この場合、最初にイメージをビルドする必要があるため、少し手間がかかりますが、プロセスはスクリプト化されており、非常によくドキュメント化されています。バージョン10.0以前のコンテナに対するSitecoreのサポートについては、[こちらのナレッジベースの記事](https://kb.sitecore.net/articles/161310) を参照してください。

### Sitecore Dockerリソース

[Sitecore のイメージ](#sitecore-イメージ) に加えて、以下のリソースにも精通しておきましょう。ドキュメントに沿っている場合、これらは途中で参照されます。

* **[Docker Examples](https://github.com/Sitecore/docker-examples)** - コンテナ開発に推奨される構造を持つVisual Studioソリューションの例と、様々なトポロジでSitecoreインスタンスを構築するためのDockerコンパイルファイルを含むリポジトリ。

* **[Helix Examples](https://github.com/Sitecore/Helix.Examples)**  - 同じ[Sitecore Helix](https://helix.sitecore.net/)に特化したサンプルリポジトリで、Sitecore 10用にDockerコンテナで更新されています。

## 次のステップ

ここまで紹介してきましたが、コンテナベースのSitecore開発を行うための環境を設定するには、以下のリンクをクリックしてください。

* [環境をセットアップする](environment-setup.md)

## 関連情報

#### Sitecoreナレッジセンター

* https://www.sitecore.com/knowledge-center/getting-started/should-my-team-adopt-docker

#### Dockerドキュメント

* https://docs.docker.com/engine/docker-overview/
* https://docs.docker.com/get-started

#### マイクロソフトドキュメント

* https://docs.microsoft.com/ja-jp/dotnet/architecture/microservices/container-docker-introduction
* https://docs.microsoft.com/ja-jp/virtualization/windowscontainers

#### その他の学習教材

Dockerが提供しているラボ。

* https://github.com/docker/labs/blob/master/windows/windows-containers
* https://github.com/docker/labs/tree/master/windows/modernize-traditional-apps/modernize-aspnet
* https://github.com/docker/labs/tree/master/dockercon-us-2017/windows-101

PluralsightはDockerのコンテンツが充実しています。

* https://www.pluralsight.com/courses/docker-windows-getting-started
* https://www.pluralsight.com/courses/docker-web-development
