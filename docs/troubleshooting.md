---
id: troubleshooting
title: トラブルシューティング
sidebar_label: トラブルシューティング
---

このページでは、Docker Desktop for WindowsとDockerベースのSitecore開発の問題をトラブルシューティングするためのリソースと手順をまとめています。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/troubleshooting です


## リソース

### 一般的なDockerのリソース

* [ログとトラブルシューティングガイド](https://docs.docker.com/docker-for-windows/troubleshoot/) - Dockerの一般的な問題については、Dockerのこの公式ガイドを参照してください。
* [Docker Desktop for Windows の問題 on GitHub](https://github.com/docker/for-win/issues) - コミュニティから報告された問題をレビューしたり、自分の問題を投稿したりできます。
* [Docker Desktop for Windows フォーラム](https://forums.docker.com/c/docker-desktop-for-windows/) - Docker コミュニティからのヘルプを得たり、現在のユーザートピックを確認したり、ディスカッションに参加したりできます。
* [Stackoverflow](https://stackoverflow.com/) - もちろん、ここにはたくさんのDockerコンテンツがあります。

### Sitecore Docker リソース

* [Sitecore Community on Slack](https://sitecore.chat/) - アクティブなメンバーで構成された #docker チャンネルをご覧ください。
* [Sitecore Community forum](https://community.sitecore.net/) - 現在のユーザートピックを確認したり、ディスカッションに参加したり、自分のトピックを作成したりできます。
* [Sitecore Stack Exchange](https://sitecore.stackexchange.com/questions/tagged/docker) - Sitecore に特化した質問を検索したり、投稿したりできます。

### 役立つツール

ここにリストアップされているツールは、コンテナの可視性を高めてくれます。これらは必ずしもトラブルシューティングに特化したものではありませんが、ログ、リソース使用統計、コンテナ上のファイルシステムへのアクセスを向上させるのに役立ちます。

* [Visual Studio Containers ウィンドウ](https://docs.microsoft.com/ja-jp/visualstudio/containers/view-and-diagnose-containers) - ログを含むコンテナ情報を表示し、ファイルシステムを参照します。
* [Visual Studio Code Docker extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) - コンテナ、イメージ、ネットワーク、ボリュームなどを表示して管理します。
* [Portainer](https://www.portainer.io/) - ローカルを含む Docker 環境を管理するための人気のあるオープンソースのツールです。

## 一般的なトラブルシューティングの手順

**1. ログの確認**

ログは最初に見る場所になります。問題によっては、コンテナのログかエンジンのログをチェックすることになります。

コンテナのログへのアクセスについては、Sitecore Dockerのチートシートを参照してください。また、Docker Desktop（Dashboard）や上記の他のツールでもログを見ることができます。

> Sitecore CMやCDイメージの場合、すべてのビルトインSitecoreログファイルがデフォルトでストリーミングされるわけではないことに注意してください。LogMonitorの設定(`c:\LogMonitor\LogMonitorConfig.json`)に追加することもできますが、結果的に出力が過剰になる可能性があります。そのため、[Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) にあるように、Sitecoreのログフォルダを[バインドマウント](https://docs.docker.com/storage/bind-mounts/) しておくと便利かもしれません。
```
cm:
 [...]
 volumes:
   - ${LOCAL_DATA_PATH}\cm:C:\inetpub\wwwroot\App_Data\logs
```

Docker engine (daemon)のログは、`C:\Users\%USERNAME%\AppData\Local\Docker` にあります。

**2. Dockerデスクトップを再起動する**

多くの場合、Dockerデスクトップを再起動するだけで問題が解決することがあります。WindowsシステムトレイのDocker項目（クジラのアイコン）を使って再起動できます。

**3. マップされたボリュームデータをクリーンアップする**

コンテナが永続的なストレージにマップされたボリュームを使用している場合、これらのフォルダ内の古いデータが原因で問題が発生している可能性があります。デフォルトの Sitecore 設定では、[mssql と solr サービスでこの設定が有効になっています](run-sitecore#永続的なストレージのクリーンアップ)。

インスタンスがダウンしていることを確認し(`docker-compose down` など)、マウントされているフォルダ内のファイルを手動で削除するか、クリーンスクリプトを使用して削除してください([Docker Examplesリポジトリ](https://github.com/Sitecore/docker-examples) の `clean.ps1` の例を参照してください)。

**4. Dockerリソースの剪定**

最近やっていないのであれば、マシン上の使われていないDockerリソースをクリーンアップしてみてください。これは、最低限ディスクスペースを空けるために、毎日の習慣として取り入れておくと良いでしょう。

```shell
docker system prune
```

詳細は[Sitecore Dockerのチートシート](cheat-sheet.md#クリーンアップ) を参照してください。

**5. PCを再起動する**

時々、システムの再起動が必要になることがあります。

**6. 最新のDocker Desktop for Windowsにアップグレードする**

Dockerは、Docker Desktop for Windowsの新バージョンを継続的にリリースし、バグの修正や改善を行っています。WindowsのシステムトレイにあるDockerの項目(クジラのアイコン)でアップデートの有無を確認することができます。

**7. Docker Desktopを工場出荷時のデフォルトにリセットする**

これで、Docker Desktopのすべてのオプションが初期状態にリセットされ、Docker Desktopを最初にインストールしたときと同じ状態になります。これは、WindowsシステムトレイのDockerアイテム（クジラアイコン）の「Troubleshoot」オプションから行うことができます。

## コンテナ環境のメモリ使用量

Sitecoreでは、Sitecore Containersを使用して作業する場合、開発者用ワークステーションに32GBのメモリを推奨しており、最低でも16GBのメモリを使用することを推奨しています。システムメモリが不足しているためにエラーやパフォーマンスの問題が発生している場合は、以下のテクニックを使用して環境のメモリ使用量の削減を試みることができます。

* XP1 の代わりに XM1 または XP0 トポロジーを実行する。
* XM1 トポロジーを変更した「XM0」を実行する（開発用のみ）。これは、redis と cd サービスをスケールに設定することで実現できます。これは、S`itecore_AppSettings_role:define` 環境変数を使用して、*redis*と*cdサービス*をscale: 0に設定し、cmサービスをスタンドアロンモードに設定することで実現できます。

```yml
redis:
  [...]
  scale: 0
cd:
  [...]
  scale: 0
cm:
  [...]
  environment:
    Sitecore_AppSettings_role:define: Standalone
```

* 1909 コンテナでプロセス分離を実行できる Windows 10 バージョンを実行している場合は、環境変数 `SITECORE_VERSION` と `ISOLATION` を使用して 1909 ベースの Sitecore コンテナとプロセス分離に切り替えてください。

```yml
SITECORE_VERSION=10.0.0-1909
ISOLATION=process
```

* 個々のコンテナのメモリ制限を設定します。Dockerはデフォルトで1GBを使用していますが、特定のサービスではこれを減らすことができます（mssqlやsolrのサービスではないでしょう）。

* 必要のないコンテナのサービスを無効にする。例えば、XP1トポロジーでは、Marketing Automation Engineを利用していない場合、xdbautomation、xdbautomationrpt、xdbautomationworkerを無効にします。または、Cortexを使用しない場合は、cortexprocessing、cortexreporting、およびcortexprocessingworkerを無効にします。これは、サービスを scale に設定することで実現できます。0に設定し、依存条件を削除することで実現できます。

## 特定の問題

### ウイルス対策ソフトがインストールされているとDocker Desktopの起動に失敗する

ウイルス対策ソフトウェアのスキャンからDockerデータディレクトリ(`%ProgramData%\docker`)を除外してみてください。詳細は https://docs.docker.com/engine/security/antivirus/ を参照してください。

### Windows コンテナがインターネットにアクセスできない

これは、例えば、NuGetのリストア操作の接続エラーなど、様々な方法で発生する可能性があります。ソース https://api.nuget.org/v3/index.json のサービスインデックスをロードできません。そのようなホストは知られていません。

*参照* https://github.com/docker/for-win/issues/2760#issuecomment-430889666:

これは、ホスト上に複数のネットワークアダプター（イーサネット、Wi-Fiなど）が存在する場合によく発生します。Windows ネットワークスタックがゲートウェイルートを正しく選択するために、これらのアダプタの優先度を適切に設定する必要があります。これは、プライマリのインターネット接続ネットワーキングアダプタのInterfaceMetric値が最も低いものに設定することで解決できます。

```shell
Get-NetIPInterface -AddressFamily IPv4 | Sort-Object -Property InterfaceMetric -Descending
```

ここでも、ホストのプライマリインターネット接続ネットワークアダプタのInterfaceMetricの値が最も低くなるようにします。

このコマンドを使用して変更します (例では、プライマリアダプタのInterfaceAliasが「Wi-Fi」であると仮定しています)。

```shell
Set-NetIPInterface -InterfaceAlias 'Wi-Fi' -InterfaceMetric 3
```

これで完了です。Hyper-V で外部仮想スイッチを設定しているため、ホストのプライマリネットワークアダプタがブリッジされている場合は、外部仮想スイッチに InterfaceMetric の値が最も低い値になるように設定します。

このコマンドを使用してルーティングテーブルを確認することができます（最後の行にはプライマリアダプタのゲートウェイアドレスとifMetric値が表示されています）。

```shell
Get-NetRoute -AddressFamily IPv4
```

### 使用中のポート / "プロセスがファイルにアクセスできません"

Sitecore環境を起動しようとすると、以下のようなエラーが表示されることがあります。

```
ERROR: for myproject_traefik_1  Cannot start service traefik: failed to create endpoint myproject_traefik_1 on network myproject_default: failed during hnsCallRawResponse: hnsCall failed in Win32: The process cannot access the file because it is being used by another process. (0x20)
```

このエラーは、必要なポートを使用している IIS などを停止する必要があることを示しています。必要なポートの完全なリストについては、[最初のSitecoreインスタンスの実行](run-sitecore.md#始める前に) ガイドを参照してください。

### 無効なSQL Server管理者パスワードによるエラー

`SQL_SA_PASSWORD` の値は、SQL Server で定義された特定の強力なパスワード要件を満たす必要があります。これらの要件を満たしていないパスワードは、次のような症状を示します。

* お使いの環境（XConnect、CMなど）の不健全なコンテナ状態、起動時のエラーなど

```
ERROR: for traefik  Container <id> is unhealthy.
ERROR: Encountered errors while bringing up the project.
```
* XConnectコンテナのログでエラーが発生します。

```
Microsoft.Azure.SqlDatabase.ElasticScale.ShardManagement.ShardManagementException: Store Error: Login failed for user 'sa'.. The error occurred while attempting to perform the underlying storage operation during 'Microsoft.Azure.SqlDatabase.ElasticScale.ShardManagement.StoreException: Error occurred while performing store operation. See the inner SqlException for details. ---> System.Data.SqlClient.SqlException: Login failed for user 'sa'.
```

* SQL Server コンテナ ログでのエラー

```
VERBOSE: Changing SA login credentials
Msg 15118, Level 16, State 1, Server 96FAC1ED734A, Line 1
Password validation failed. The password does not meet the operating system policy requirements because it is not complex enough.
```

解決するには、SQL_SA_PASSWORDのSQLパスワードをデフォルトのSQL Serverポリシーに合わせて変更します。.envファイル内のパスワードを変更した後、docker-compose downを実行した後、マウントされているSQLデータフォルダをクリアすることを忘れないでください。コンテンツを手動で削除するか、クリーンスクリプトを使用することができます（[Docker Examplesリポジトリ](https://github.com/Sitecore/docker-examples) のclean.ps1の例を参照してください）。

### コンテナが作成ステータスでスタックする

通常は `docker-compose up` の一部として見られますが、特定のサービスの実行に失敗し、代わりにdocker ps -aで確認すると "Created "ステータスを報告することがあります。

Docker-composeファイル内の問題のあるコンテナのメモリ制限を増やしてみてください。Dockerはデフォルトで1GBに設定されていますが、サービスによってはこれでは不十分な場合があります。例えば、mssqlやsolrサービスのコンテナは2GBを必要とする場合があります。

```
mssql:
  [...]
  mem_limit: 2GB
solr:
  [...]
  mem_limit: 2GB
```

### 管理者としてSitecoreにログインできない

これは、持続的なSQLデータストレージが有効になっていて（Docker Composeの設定でマウントされたボリュームを介して）、.envファイルでSitecoreの管理者パスワード（`SITECORE_ADMIN_PASSWORD`変数）が変更されている場合に発生する可能性があります。パスワードはデータベースファイルの初期作成時に設定されているため、パスワード変更前にインスタンスを実行していた場合（`docker-compose up` の場合など）は、パスワードが古くなっています。

デフォルトのSitecoreの設定では、この設定が有効になっており、ボリュームは `mssql-data` フォルダにマウントされています。

```yml
mssql:
  [...]
  volumes:
    - type: bind
      source: .\mssql-data
      target: c:\data
```

解決するには、インスタンスがダウンしていることを確認し(つまり`docker-compose down`している)、マウントされているフォルダ内のファイルを削除します。これらのファイルを手動で削除するか、クリーンスクリプトを使用します ([Docker Examples リポジトリ](https://github.com/Sitecore/docker-examples) の `clean.ps1` の例を参照してください)。

> SQLデータを完全に一過性のものにしたい場合は、このボリュームマウントを削除することもできます。

### 誤った関数のエラー

コンテナの起動時やイメージの構築時に以下のようなエラーが表示されることがあります。

```
hcsshim::PrepareLayer - failed failed in win32 : Incorrect function. (0x1)
```

これは通常、Box、Dropbox、OneDrive などのツールと互換性のないドライバが原因です。回避策や解決策については、[GitHubのDocker Desktop for Windowsの問題](https://github.com/docker/for-win/issues/3884) に関する議論を参照してください。

### コンテナのシャットダウンに失敗した

コンテナの起動時やイメージの構築時に以下のようなエラーが表示されることがあります。

```
failed to shutdown container: container 45917373d49ed4130f7c7ac16f19f59379c1c98d0c429cc806a6f292d6792286 encountered an error during hcsshim::System::Shutdown: failure in a Windows system call: The connection with the virtual machine or container was closed. (0xc037010a): subsequent terminate failed container 45917373d49ed4130f7c7ac16f19f59379c1c98d0c429cc806a6f292d6792286 encountered an error during hcsshim::System::waitBackground: failure in a Windows system call: The connection with the virtual machine or container was closed. (0xc037010a)
```

Docker Desktop を再起動すればたいていの場合は解決しますが、システムを再起動する必要があるかもしれません。

この [Docker Desktop for Windows問題の進捗状況](https://github.com/docker/for-win/issues/7523) はGitHubで確認してください。

### ファイアウォールとプロセス分離の競合

ファイアウォールの設定によっては、プロセス分離を利用しているコンテナ同士の通信ができない場合があります。症状としては、不健全なコンテナやコンテナ間のネットワーク通信エラー (例: solr 接続エラー) がログを検査する際に発生することがあります。

特定のファイアウォールの競合を追跡するのに苦労するかもしれません。回避策として、影響を受ける個々のコンテナをデフォルトの隔離に設定することができます (例: `docker-compose.override.yml`)。例えば、以下のようにします。

```yml
solr:
  [...]
  isolation: default
```