---
id: item-deployment
title: アイテム展開
sidebar_label: アイテム展開
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/item-deployment です


このガイドでは、Docker上でのSitecoreアイテムパッケージとデプロイの自動化戦略について説明します。これは、使用しているSitecoreアイテムのシリアライズツールによって異なります。このガイドでは、Sitecore アイテムのシリアライズと、Sitecore 開発とデプロイのプロセスへの適用について、すでに熟知していることを前提としています。

Sitecore CLI / Sitecoreコンテンツシリアライズ

Sitecore 10でリリースされたSitecore CLIは、リモートのSitecoreインスタンスとのスクリプトによる対話に最適化されています。継続的インテグレーションプロセスでアイテムをパッケージ化したり、デプロイ/デリバリプロセスでそれらのパッケージをインストールするために使用することができます。この点では、Sitecore CLIを使用してSitecore環境へのアイテムのデプロイを自動化することは、コンテナを使用する場合と変わりません。

詳細については、Sitecore CLIのドキュメントを参照してください。また、CMコンテナイメージに必要なSitecore Management Servicesモジュールをインストールする方法については、Sitecoreモジュールリファレンスを参照してください。

Sitecore TDS

Sitecore TDSには、アイテムのパッケージ化とデプロイを容易にするための多くのツールが組み込まれています。一般的なアプローチは、これらのツールを使用してソリューションのビルド中にアイテムパッケージを作成し、Sitecoreのランタイムイメージをビルドする際にコンテンツ管理(CM)イメージに追加することです。

完全な例については、GitHubのHelix.Examplesリポジトリを参照してください。

Sitecore TDSプロジェクトの構成

この例では、Sitecore TDSの2つの機能を利用しています。Build OutputとWebDeploy Packagesです。これらの設定は、TDS プロジェクトのプロパティページで設定します。

Build Output Path - "Build" ページにあり、これは Release ビルド設定用に設定する必要があります。すべてのTDSプロジェクトで共有されるパスを指定します。私たちの例では、これは、...\...TdsGeneratedPackages\Releaseに設定されています。
Build WebDeploy package - "WebDeploy Package" ページにあり、Release ビルド設定にチェックを入れる。Package Name を指定し、Code と Item Packaging Options の Item only Package を選択します。
以下は、TDS プロジェクトをそれに合わせて設定したことを前提としています。

ソリューションビルドでの設定

Sitecore TDSでは、Dockerビルドやクラウドビルドの際に環境変数のライセンスが必要になります。ソリューションビルドのDockerfileの中で、コードのコンパイルとビルドの段階（例ではビルダー）の開始時に、これらのARGを宣言してください。

ARG TDS_Owner
ARG TDS_Key

コピー
ARGスコープの関係でDockerfile内の位置が重要です。もしこれらが前のビルドステージで宣言されていた場合、ビルダーステージで使用されたときに値が空になってしまいます。また、これらの値はイメージのビルドにのみ使用されるため、ARGはENVと比較して使用されていることにも注意してください。
これらの値は、docker-compose.override.yml ファイルのソリューションサービス用に設定されます。例えば、以下のようになります。

ソリューションサービスは以下のようになります。
  image: ${REGISTRY}${COMPOSE_PROJECT_NAME}-solution:${VERSION:-latest}.
  をビルドします。
    コンテキスト: .
    argsを使用しています。
      BASE_IMAGE. SOLUTION_BASE_IMAGE}です。
      BUILD_IMAGE}です。SOLUTION_BUILD_IMAGE}です。
      TDS_Owner: ${TDS_OWNER}。
      TDS_KEY: ${TDS_KEY}.
  スケール。0

コピー
TDS_OWNERとTDS_KEYの値は、環境ファイル(.env)にあるか、ローカルの開発マシンのシステム環境変数や、セキュリティのためにビルドサーバー上の秘密情報として設定されている可能性があります。

ソリューションビルドのDockerfileを続けると、msbuild命令を単純化することができ、代わりにTDSプロジェクトで設定されたビルド出力に依存することができます。

RUN msbuild /p:Configuration=Release

コピー
ビルド出力は、ビルダの WORKDIR からの相対的な TDS プロジェクトで指定された場所（ビルド出力パス）に配置されます。私たちの例では、これは、ビルド出力が次のようになることを意味しています。

\build\TdsGeneratedPackages\Release (files)
\♪\build\TdsGeneratedPackages
ビルダーの段階から、以下のような構成で最終的なイメージにコピーします。

\ｳｪﾌﾞｻｲﾄ
\遺産とは
\A.T.F.T.Transforms
ということで、最終的な指示は

WORKDIR C:artifacts
COPY --from=builder 造り手
COPY --from=builder ♦\build\TdsGeneratedPackages\WebDeploy_Release .
COPY --from=builder C:Out\transforms .

コピー
Sitecore CMランタイムイメージに追加

これでアイテムがパッケージ化され、ソリューションイメージに含まれるようになったので、Sitecoreランタイムイメージをビルドする際にコンテンツ管理（CM）イメージに追加することができます。

cmサービスのDockerfileの最後に、アイテムパッケージをデプロイする指示を追加する必要があります。TDSには、これを処理するための2つのオプションがあります。

オプション1: コンテナ上でデプロイする create

Sitecore TDSがサイト起動時にアイテムパッケージをインストールできるようにします。これはTDSの組み込み機能を利用しています。ただし、このイメージを使用してコンテナが作成されるたびに実行されることに注意してください。



RUN Get-ChildItem -Path 'C:\temp\\*.wdp.zip' | % { Expand-Archive -Path $_.FullName -DestinationPath 'C:\temp' -Force;; }; `
    

    

    Remove-Item -Path 'C:C:A:Destination .
    # TDSがインストール後にアイテムを削除する権限を持っていることを確認する
    cmd /C icacls .IIS AppPool\tempWebDeployItems /grant 'IIS AppPool\DefaultAppPool:(OI)(CI)M'.

コピーします。
オプション 2: オンデマンドでのデプロイ

ツールイメージの Deploy-TdsWdpPackages.ps1 スクリプトを使用します。パッケージと一緒にコピーしてください。

COPY --from=tooling ♦\toolsscripts\Deploy-TdsWdpPackages.ps1 ♦\installDeploy-TdsWdpPackages.ps1




コピー
そして、以下のスクリプトでコンテナ上でオンデマンドでDeploy-TdsWdpPackages.ps1を起動します。

docker exec <container> powershell -command "C:\installDeploy-TdsWdpPackages.ps1"

コピー
ユニコーン

重要：Unicornはサードパーティ製のオープンソースツールであり、Sitecore Supportではサポートされていません。これらの説明は、Unicornユーザーの便宜のためのガイダンスとしてのみ提供されています。
ここで説明する他のシリアライズツールとは異なり、Unicornには組み込みのパッケージング機能はなく、Sitecoreプラットフォームのインプロセスで実行されます。そのため、Unicornの設定でシリアライズされたアイテムは、同期先のコンテンツ管理インスタンスのファイルシステム上に存在している必要があります。Dockerを使用すると、コンテナのビルド中にアイテムをコピーすることができるので、これを簡単に行うことができます。Unicornには、アイテムの同期をトリガーするためのPowerShellモジュールも用意されており、コンテナを使用する際にアイテムのデプロイを自動化するのに便利です。

以下の手順では、すでにDockerを使用してソリューションを構築し、カスタムSitecoreイメージを作成していることを想定しています。完全な例については、GitHubのHelix.Examplesリポジトリを参照してください。

ソリューションの成果物にシリアル化されたアイテムを追加する

Unicornを使用する場合、シリアライズされたアイテムは、通常、Sitecoreのソリューションソース内に配置され、Unicornの設定によって定義された構造に整理されます。ソリューションのビルド中に、これらのシリアル化されたアイテムをすべてコピーすることができますが、ディレクトリ構造を保持することが重要です。これを実現するための簡単なオプションとして、Robocopyがあります。

# ディレクトリ構造を保持したまま、シリアル化されたアイテムをコピーします。
RUN Invoke-Expression 'robocopy C:\build\\src C:\out\items /s /ndl /njh /njs *.yml'

# ... 後日、成果物のビルド段階で
WORKDIR C:artifacts


コピー
CM イメージにアイテムとデプロイメント スクリプトをビルドします。

ソリューションイメージにビルド成果物としてのアイテムがあるので、前回 msbuild 出力で行ったのと同じように、それらを CM イメージにコピーします。さらに、Unicorn リモーティングに必要なファイルを CM イメージに配置しておきます。

CM ビルドコンテキスト内の unicorn フォルダには、Unicorn リモートスクリプトに必要なファイルが含まれているはずです。

MicroCHAP.dll
ユニコーン.psm1
カスタムの sync.ps1
この場合の sync.ps1 スクリプトには Sync-Unicorn の標準的な呼び出しが含まれており、環境変数を使用して Unicorn の共有シークレットを入力する必要があります。

スクリプトパス = Split-Path $MyInvocation.MyCommand.Path
インポートモジュール $ScriptPathUnicorn.psm1
Sync-Unicorn -ControlPanelUrl 'http://localhost/unicorn.aspx' -SharedSecret $env:UNICORN_SHARED_SECRET

コピー
次に、CMのDockerfileで、このフォルダとシリアル化アイテムの成果物をコピーし、後でUnicornを設定するために使用できる環境変数を設定します。

# シリアル化アイテムのデフォルトの場所を設定します。
# この値はユニコーンの設定で使用されます
ENV ITEM_SYNC_LOCATION c:Items

# シリアライズされたアイテムとUnicorn同期スクリプトをコピーします
COPY --from=solution ″solution″ ″solution″ ″artartifactsifactitems″s\items″s
COPY .

コピー
UnicornとDocker環境の設定

Unicorn同期に使用されるベースファイルシステムのパスは、通常、Sitecoreの設定でsourceFolderというsc.variableを使用して設定されます。この値は、上記で定義した環境変数からDockerfileに入力することができます。

<sc.variable name="sourceFolder" value="$(env:ITEM_SYNC_LOCATION)" />

コピー
Unicornの共有シークレットは環境変数からも入力できるので、上記のsync.ps1で行ったのと同じ環境変数を使用することができます。

<authenticationProvider type="Unicorn.ControlPanel.Security.ChapAuthenticationProvider, Unicorn">
  <SharedSecret>$(env:UNICORN_SHARED_SECRET)</SharedSecret>。
</authenticationProvider> </authenticationProvider

コピー
そして、この環境変数を docker-compose.override.yml と .env に定義します。

cm で定義します。
    [...]
    環境変数を定義します。
      UNICORN_SHARED_SECRET: ${UNICORN_SHARED_SECRET}。

コピー
UNICORN_SHARED_SECRET=あなたの秘密の場所

コピー
同期を実行する

この時点で、Unicorn とのアイテム同期をトリガーするために必要なものはすべて揃っています。

CM コンテナのファイルシステム上でシリアライズされたアイテム
このパスをアイテムソースとして使用するように設定されたユニコーン
環境変数で設定されたUnicornの共有シークレット
同期をトリガするための PowerShell スクリプト
アイテムをデプロイしたいときは、手動であろうとデリバリーパイプライン内であろうと、docker exec を使用するか、本番用コンテナオーケストレータ内で同等のものを使用します。

docker exec <コンテナ> powershell -command "c:un\unicornsyncsync.ps1"

## 関連情報

* [Sitecore CLI documentation](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)
* [Sitecore TDS documentation](http://hedgehogdevelopment.github.io/tds/)
* [Item sync with a running container](item-sync-running-container.md)
