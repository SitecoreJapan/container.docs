---
id: item-deployment
title: アイテム展開
sidebar_label: アイテム展開
---

このガイドでは、Docker上でのSitecoreアイテムパッケージとデプロイの自動化戦略について説明します。これは、使用しているSitecoreアイテムのシリアライズツールによって異なります。このガイドでは、Sitecore アイテムのシリアライズと、Sitecore 開発とデプロイのプロセスへの適用について、すでに熟知していることを前提としています。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/item-deployment です

## Sitecore CLI / Sitecoreコンテンツシリアライズ

Sitecore 10でリリースされたSitecore CLIは、リモートのSitecoreインスタンスとのスクリプトによる対話に最適化されています。継続的インテグレーションプロセスでアイテムをパッケージ化したり、デプロイ/デリバリプロセスでそれらのパッケージをインストールするために使用することができます。この点では、Sitecore CLIを使用してSitecore環境へのアイテムのデプロイを自動化することは、コンテナを使用する場合と変わりません。

詳細については、[Sitecore CLIのドキュメント](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)を参照してください。また、CMコンテナイメージに必要なSitecore Management Servicesモジュールをインストールする方法については、[Sitecoreモジュールリファレンス](https://containers.doc.sitecore.com/docs/module-reference)を参照してください。

## Sitecore TDS

[Sitecore TDS](https://www.teamdevelopmentforsitecore.com/)には、アイテムのパッケージ化とデプロイを容易にするための多くのツールが組み込まれています。一般的なアプローチは、これらのツールを使用して[ソリューションのビルド](build-solution.md)中にアイテムパッケージを作成し、[Sitecoreのランタイムイメージをビルド](build-sitecore-images.md)する際にコンテンツ管理(CM)イメージに追加することです。

完全な例については、[GitHubのHelix.Examplesリポジトリ](https://github.com/Sitecore/Helix.Examples)を参照してください。

### Sitecore TDSプロジェクトの構成

この例では、Sitecore TDSの2つの機能を利用しています。[Build Output](https://hedgehogdevelopment.github.io/tds/chapter4.html#build)と[WebDeploy Packages](https://hedgehogdevelopment.github.io/tds/chapter4.html#webdeploy-package)です。これらの設定は、TDS プロジェクトのプロパティページで設定します。

* **Build Output Path** - "Build" ページにあり、これは Release ビルド設定用に設定する必要があります。すべてのTDSプロジェクトで共有されるパスを指定します。私たちの例では、これは、`..\..\TdsGeneratedPackages\Release\` に設定されています。
* **Build WebDeploy package** - "WebDeploy Package" ページにあり、Release ビルド設定にチェックを入れる。Package Name を指定し、Code と Item Packaging Options の Item only Package を選択します。

以下は、TDS プロジェクトをそれに合わせて設定したことを前提としています。

### ソリューションビルドでの設定

Sitecore TDSでは、Dockerビルドやクラウドビルドの際に[環境変数のライセンス](dockerfile-best-practices.md#building-with-team-development-for-sitecore)が必要になります。ソリューションビルドのDockerfileの中で、コードのコンパイルとビルドの段階（例ではビルダー）の開始時に、これらのARGを宣言してください。

```
ARG TDS_Owner
ARG TDS_Key
```

> ARGスコープの関係でDockerfile内の位置が重要です。もしこれらが前のビルドステージで宣言されていた場合、ビルダーステージで使用されたときに値が空になってしまいます。また、これらの値はイメージのビルドにのみ使用されるため、ARGはENVと比較して使用されていることにも注意してください。

これらの値は、docker-compose.override.yml ファイルのソリューションサービス用に設定されます。例えば、以下のようになります。

```
solution:
  image: ${REGISTRY}${COMPOSE_PROJECT_NAME}-solution:${VERSION:-latest}
  build:
    context: .
    args:
      BASE_IMAGE: ${SOLUTION_BASE_IMAGE}
      BUILD_IMAGE: ${SOLUTION_BUILD_IMAGE}
      TDS_Owner: ${TDS_OWNER}
      TDS_Key: ${TDS_KEY}
  scale: 0
```

TDS_OWNERとTDS_KEYの値は、[環境ファイル](https://docs.docker.com/compose/env-file/)(.env)にあるか、ローカルの開発マシンのシステム環境変数や、セキュリティのためにビルドサーバー上の秘密情報として設定されている可能性があります。

[ソリューションビルドのDockerfile](build-solution.md#dockerfile-をビルド)を続けると、msbuild命令を単純化することができ、代わりにTDSプロジェクトで設定されたビルド出力に依存することができます。

```
RUN msbuild /p:Configuration=Release
```

ビルド出力は、ビルダの WORKDIR からの相対的な TDS プロジェクトで指定された場所（ビルド出力パス）に配置されます。私たちの例では、これは、ビルド出力が次のようになることを意味しています。

* \build\TdsGeneratedPackages\Release (files)
* \build\TdsGeneratedPackages\WebDeploy_Release (WDP item packages)

ビルダーの段階から、以下のような構成で最終的なイメージにコピーします。

* \artifacts\website
* \artifacts\packages
* \artifacts\transforms

ということで、最終的な指示が調整されています。

```
WORKDIR C:\artifacts
COPY --from=builder \build\TdsGeneratedPackages\Release .\website\
COPY --from=builder \build\TdsGeneratedPackages\WebDeploy_Release .\packages\
COPY --from=builder C:\out\transforms .\transforms\
```

### Sitecore CMランタイムイメージに追加

これでアイテムがパッケージ化され、ソリューションイメージに含まれるようになったので、[Sitecoreランタイムイメージをビルド](build-sitecore-images.md)する際にコンテンツ管理（CM）イメージに追加することができます。

[cmサービスのDockerfile](build-sitecore-images.md#ソリューションのビルド出力を使用したdockerfile)の最後に、アイテムパッケージをデプロイする指示を追加する必要があります。TDSには、これを処理するための2つのオプションがあります。

#### オプション1: コンテナ上でのデプロイ作成

Sitecore TDSがサイト起動時にアイテムパッケージをインストールできるようにします。これは[TDSの組み込み機能](https://hedgehogdevelopment.github.io/tds/chapter7.html#deployment-process)を利用しています。ただし、このイメージを使用してコンテナが作成されるたびに実行されることに注意してください。

```
COPY --from=solution \artifacts\packages\ \temp\
RUN Get-ChildItem -Path 'C:\\temp\\*.wdp.zip' | % { Expand-Archive -Path $_.FullName -DestinationPath 'C:\\temp' -Force; }; `
    Move-Item -Path 'C:\\temp\\Content\\Website\\Bin\*' -Destination .\bin -Force; `
    Move-Item -Path 'C:\\temp\\Content\\Website\\temp\*' -Destination .\temp -Force; `
    Remove-Item -Path 'C:\\temp' -Recurse -Force; `
    # Ensure TDS has permissions to delete items after install
    cmd /C icacls .\temp\WebDeployItems /grant 'IIS AppPool\DefaultAppPool:(OI)(CI)M';
```

#### オプション 2: オンデマンドでのデプロイ

ツールイメージの `Deploy-TdsWdpPackages.ps1` スクリプトを使用します。パッケージと一緒にコピーしてください。

```
COPY --from=tooling \tools\scripts\Deploy-TdsWdpPackages.ps1 \install\Deploy-TdsWdpPackages.ps1
COPY --from=solution \artifacts\packages\ \install\packages\
```

そして、以下のスクリプトでコンテナ上でオンデマンドでDeploy-TdsWdpPackages.ps1を起動します。

```
docker exec <container> powershell -command "C:\install\Deploy-TdsWdpPackages.ps1"

```

## Unicorn

> ***重要:*** Unicornはサードパーティ製のオープンソースツールであり、Sitecore Supportではサポートされていません。これらの説明は、Unicornユーザーの便宜のためのガイダンスとしてのみ提供されています。

ここで説明する他のシリアライズツールとは異なり、[Unicorn](https://github.com/SitecoreUnicorn/Unicorn)には組み込みのパッケージング機能はなく、Sitecoreプラットフォームのインプロセスで実行されます。そのため、Unicornの設定でシリアライズされたアイテムは、同期先のコンテンツ管理インスタンスのファイルシステム上に存在している必要があります。Dockerを使用すると、コンテナのビルド中にアイテムをコピーすることができるので、これを簡単に行うことができます。Unicornには、アイテムの同期をトリガーするための[PowerShellモジュール](https://github.com/SitecoreUnicorn/Unicorn/tree/master/doc/PowerShell%20Remote%20Scripting)も用意されており、コンテナを使用する際にアイテムのデプロイを自動化するのに便利です。

以下の手順では、すでにDockerを使用して[ソリューションを構築](build-solution.md)し、[カスタムSitecoreイメージを作成](build-sitecore-images.md)していることを想定しています。完全な例については、[GitHubのHelix.Examplesリポジトリ](https://github.com/Sitecore/Helix.Examples)を参照してください。

### ソリューションの成果物にシリアル化されたアイテムを追加する

Unicornを使用する場合、シリアライズされたアイテムは、通常、Sitecoreのソリューションソース内に配置され、[Sitecore Helix のプラクティス](https://helix.sitecore.net/)に従う可能性があります。ソリューションのビルド中に、これらのシリアル化されたアイテムをすべてコピーすることができますが、ディレクトリ構造を保持することが重要です。これを実現するための簡単なオプションとして、Robocopyがあります。

```
# ディレクトリ構造を保持したまま、シリアル化されたアイテムをコピー
RUN Invoke-Expression 'robocopy C:\build\src C:\out\items /s /ndl /njh /njs *.yml'

# ... アーティファクトのビルド段階で
WORKDIR C:\artifacts
COPY --from=builder c:\out\items .\items\
```

## CM イメージにアイテムとデプロイメント スクリプトをビルド

ソリューションイメージにビルド成果物としてのアイテムがあるので、前回 `msbuild` 出力で行ったのと同じように、それらを CM イメージにコピーします。さらに、Unicorn リモーティングに必要なファイルを CM イメージに配置しておきます。

CM [ビルドコンテキスト](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#understand-build-context)内の unicorn フォルダには、[Unicorn リモートスクリプトに必要なファイル](https://github.com/SitecoreUnicorn/Unicorn/tree/master/doc/PowerShell%20Remote%20Scripting)が含まれているはずです。

* `MicroCHAP.dll`
* `Unicorn.psm1`
* A custom `sync.ps1`

この場合の `sync.ps1` スクリプトには `Sync-Unicorn` の標準的な呼び出しが含まれており、環境変数を使用して Unicorn の共有シークレットを入力する必要があります。

```
$ScriptPath = Split-Path $MyInvocation.MyCommand.Path
Import-Module $ScriptPath\Unicorn.psm1
Sync-Unicorn -ControlPanelUrl 'http://localhost/unicorn.aspx' -SharedSecret $env:UNICORN_SHARED_SECRET
```

次に、CMのDockerfileで、このフォルダとシリアル化アイテムの成果物をコピーし、後でUnicornを設定するために使用できる環境変数を設定します。

```
# シリアル化されたアイテムのデフォルトの場所を設定する
# この値はユニコーンの設定で使用されます。
ENV ITEM_SYNC_LOCATION c:\items

# シリアル化されたアイテムとユニコーン同期スクリプトをコピーする
COPY --from=solution \artifacts\items\ \items\
COPY .\unicorn \unicorn\
```

### UnicornとDocker環境の設定

Unicorn同期に使用されるベースファイルシステムのパスは、通常、Sitecoreの設定で`sourceFolder`という`sc.variable`を使用して設定されます。この値は、上記で定義した環境変数から`Dockerfile`に入力することができます。

```
<sc.variable name="sourceFolder" value="$(env:ITEM_SYNC_LOCATION)" />
```

Unicornの共有シークレットは環境変数からも入力できるので、上記の`sync.ps1`で行ったのと同じ環境変数を使用することができます。

```
<authenticationProvider type="Unicorn.ControlPanel.Security.ChapAuthenticationProvider, Unicorn">
  <SharedSecret>$(env:UNICORN_SHARED_SECRET)</SharedSecret>
</authenticationProvider>
```

そして、この環境変数を `docker-compose.override.yml` と `.env` に定義します。

```
cm:
    [...]
    environment:
      UNICORN_SHARED_SECRET: ${UNICORN_SHARED_SECRET}
```

```
UNICORN_SHARED_SECRET=your-secret-here
```

### 同期を実行する

この時点で、Unicorn とのアイテム同期をトリガーするために必要なものはすべて揃っています。

* CM コンテナのファイルシステム上でシリアライズされたアイテム
* このパスをアイテムソースとして使用するように設定されたユニコーン
* 環境変数で設定されたUnicornの共有シークレット
* 同期をトリガするための PowerShell スクリプト

アイテムをデプロイしたいときは、手動であろうとデリバリーパイプライン内であろうと、docker exec を使用するか、本番用コンテナオーケストレータ内で同等のものを使用します。

```
docker exec <container> powershell -command "c:\unicorn\sync.ps1"
```

## 関連情報

* [Sitecore CLI documentation](https://doc.sitecore.com/developers/100/developer-tools/en/sitecore-command-line-interface.html)
* [Sitecore TDS documentation](http://hedgehogdevelopment.github.io/tds/)
* [Item sync with a running container](item-sync-running-container.md)
