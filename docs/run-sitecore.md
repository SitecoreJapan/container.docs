---
id: run-sitecore
title: 最初のSitecoreインスタンスの実行
sidebar_label: 最初のSitecoreインスタンスの実行
---

コンテナベースの Sitecore は、ローカルの開発環境で Sitecore インスタンスをセットアップする際のエクスペリエンスを大幅に向上させます。このガイドでは、Sitecore Experience Platform - Single (XP0) インスタンスを最小限の設定で素早く立ち上げる方法を紹介します。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/run-sitecore です


> このガイドでは、簡単にするためにSitecore Experience Platform - Single (XP0)の構成を使用していますが、どの構成でも同じアプローチで起動することができます。

> 各Sitecoreトポロジー用のDocker Composeファイルは、https://dev.sitecore.com からダウンロードできるSitecore Container Support Packageに含まれています。

## 始める前に

このガイドでは、コンテナとDockerの基本的な知識と、Sitecoreがどのように関わっているかを理解していることを前提としています。これらのトピックについてブラッシュアップする必要がある場合は、[イントロダクション](intro.md) を参照してください。

また、このガイドでは、Windows上でDockerを使って開発するためのローカル環境がすでに設定されていることを前提としています。詳細については、[環境設定](environment-setup.md) のドキュメントを参照してください。特に、[Windows コンテナに切り替えている](/docs/environment-setup#windowsコンテナに切り替える) ことを確認してください。

デフォルトのSitecoreコンテナの設定では、特定のポートを使用します。コンフリクトを回避するために、以下のポートが他のプロセスで使用されていないことを確認する必要があります。**443、8079、8081、8884、14330** です。
最後に、有効なSitecoreライセンスファイルが必要です。お持ちでない場合は、Sitecoreの担当者に連絡してください。

## Docker Examples リポジトリをクローンする

まず、[Docker Examplesリポジトリ](https://github.com/Sitecore/docker-examples) をマシン上のどこかにクローンします。例えば、C:\sitecore\docker-examples\ (以下の手順では、このフォルダが使用されていると仮定しています)。

このリポジトリには、Sitecore Containers DevEx ドキュメントのコンパニオンコードが含まれています。このガイドでは、get-started フォルダを使用します。

PowerShell プロンプトを開き、get-started フォルダに移動し、内容を確認します。

```powershell
cd C:\sitecore\docker-examples\getting-started
ls
```

簡単に説明すると、以下のようになります。

* `docker-compose.yml` と `.env` - [Docker Compose](https://docs.docker.com/compose/) ファイルの種類。これらはバニラのSitecoreインスタンスを起動するために必要な主なファイルです。*Sitecore Container Support Packageに含まれています。*
* `mssql-data`, `solr-data` そして `traefik` - Sitecoreインスタンス内のDockerコンテナが利用するサポートフォルダ。*Sitecore Container Support Packageに含まれています。*
* `init.ps1` と `clean.ps1` - ヘルパースクリプトの例。*Sitecore Container Support Packageには含まれていません。*

それぞれについては、このガイドを通して詳しく説明します。

## Docker Composeファイルを理解する

### docker-compose.yml

この Compose ファイルは、docker-compose コマンドで使用されるメインの設定ファイルです。このファイルには、異なるコンテナ（サービスと呼ばれる）とその設定に関する情報が含まれています。

Sitecoreの場合、サービスは一般的にトポロジーを構成する個々のSitecoreロール（mssql、solr、id、cmなど）を表します。この場合、Sitecore Experience Platform - Single (XP0) インスタンスの場合です。

> Composeファイル形式の詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/compose-file/) を参照してください。

### .env

これは環境ファイルです。ここの値は、Composeファイルで参照される環境変数（例：`SITECORE_DOCKER_REGISTRY`）や、Composeの設定に使用される環境変数（例：`COMPOSE_PROJECT_NAME`）のデフォルト値を提供します。

> 環境ファイルの詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/env-file/)を参照してください。

環境変数は、コンテナーに設定を渡すための好ましい仕組みです。これらがSitecoreコンテナでどのように使われているかは、`docker-compose.yml` ファイルで確認できます。例えば、mssqlサービスは、SQL Server SAパスワード（`SA_PASSWORD`）を設定するために環境変数を設定します。


```yml
mssql:
  isolation: ${ISOLATION}
  image: ${SITECORE_DOCKER_REGISTRY}sitecore-xp0-mssql:${SITECORE_VERSION}
  environment:
    SA_PASSWORD: ${SQL_SA_PASSWORD}
    SITECORE_ADMIN_PASSWORD: ${SITECORE_ADMIN_PASSWORD}
    ACCEPT_EULA: "Y"
    SQL_SERVER: mssql
  ports:
    - "14330:1433"
```

値は変数置換(`${SQL_SA_PASSWORD}`)を使用して`.env`ファイルから取得しています。

> Docker Composeでの環境変数の使用方法については、[Dockerのドキュメント](https://docs.docker.com/compose/environment-variables/) を参照してください。

## 準備するもの

Sitecore インスタンスを開始する前に、少しだけ準備をしておく必要があります。このセクションでは、その手順を説明します。
とはいえ、このリポジトリには、これらの準備作業を自動的に実行するスクリプト - `init.ps1` スクリプト - も含まれています。PowerShellの管理者プロンプトから `-LicenseXmlPath` をSitecoreライセンスファイルの場所に置き換えて実行してください。

```powershell
.\init.ps1 -LicenseXmlPath C:\License\license.xml
```

> このガイドを一度は自分で読んでみて、手順をよりよく理解することが有益です。

### SitecoreDockerToolsをインストールする

このガイドでは、[SitecoreDockerTools](https://sitecore.myget.org/feed/sc-powershell/package/nuget/SitecoreDockerTools) PowerShellモジュールを利用します。SitecoreDockerToolsには、DockerベースのSitecore開発をサポートするための様々なヘルパーコマンドが含まれています。必須ではありませんが、これらのコマンドを使用することで、準備の手順を大幅に簡略化することができます。
PowerShellから以下のコマンドを実行してインストールするか、[SitecoreDockerToolsのMyGetページ](https://sitecore.myget.org/feed/sc-powershell/package/nuget/SitecoreDockerTools) の指示に従ってください。

```powershell
Register-PSRepository -Name "SitecoreGallery" -SourceLocation "https://sitecore.myget.org/F/sc-powershell/api/v2"
Install-Module SitecoreDockerTools
```

### 環境ファイルを入力します

.env ファイルをよく見てみると、いくつかの未割り当ての値があることに気づくでしょう。

```
COMPOSE_PROJECT_NAME=sitecore-xp0
SITECORE_DOCKER_REGISTRY=scr.sitecore.com/platform/
SITECORE_VERSION=10.0.0-ltsc2019
SITECORE_ADMIN_PASSWORD=
SQL_SA_PASSWORD=
TELERIK_ENCRYPTION_KEY=
SITECORE_IDSECRET=
SITECORE_ID_CERTIFICATE=
SITECORE_ID_CERTIFICATE_PASSWORD=
SITECORE_LICENSE=
CM_HOST=xp0cm.localhost
ID_HOST=xp0id.localhost
TRAEFIK_IMAGE=traefik:v2.2.0-windowsservercore-1809
TRAEFIK_ISOLATION=hyperv
ISOLATION=default
```

> これらの変数のそれぞれの設定方法については、 [Installation Guide for a Developer Workstation with Containers](https://dev.sitecore.net/Downloads/Sitecore_Experience_Platform/100/Sitecore_Experience_Platform_100.aspx) で詳しく説明されています。

入力された変数を更新したい場合は歓迎しますが、現時点では必須ではありません。主に空の変数を更新することに興味があるようですが、それは次の手順で説明します。

#### Sitecoreの管理者とSQL SAのパスワードを設定する

`SITECORE_ADMIN_PASSWORD` と `SQL_SA_PASSWORD` 変数には、`.env` ファイル内で選択したパスワードを直接設定することができます。

> SQL SAパスワードは、[SQL Serverの複雑な要件](https://docs.microsoft.com/ja-jp/sql/relational-databases/security/password-policy) を満たす必要があることに注意してください。

SitecoreDockerToolsモジュールを使用して、PowerShellでこれらを設定したり、生成したりすることもできます（`init.ps1`ではデフォルトで両方とも "Password12345 "に設定されています）。以下では、他の変数でも設定できる例を見てみましょう。

#### Telerik暗号化キーの設定

環境ファイルと同じフォルダ（例：C:\sitecore\docker-examples\getting-startedから、管理者として以下のPowerShellスクリプトを実行します。

```powershell
Import-Module SitecoreDockerTools
Set-DockerComposeEnvFileVariable "TELERIK_ENCRYPTION_KEY" -Value (Get-SitecoreRandomString 128)
```

これは、*SitecoreDockerTools*モジュールをセッションにインポートし、2つのコマンドレットを利用して`TELERIK_ENCRYPTION_KEY`変数を設定します。

* `Set-DockerComposeEnvFileVariable` - Docker Compose `.env`ファイルの変数値を設定します。
* `Get-SitecoreRandomString` - パスワードやキーとして使用するランダムな文字列を返します。

> 詳細はPowerShellの `Get-Help` コマンドレット（例：`Get-Help Set-DockerComposeEnvFileVariable`）を使って各コマンドを確認できます。また、`Get-Command` (例: `Get-Command -Module SitecoreDockerTools`) を使用して、使用可能なすべてのコマンドを一覧表示することもできます。

#### Identity Server 変数の設定

次に、Identity Server に必要な変数を入力します。以下のPowerShellスクリプトを実行します。

```powershell
Import-Module SitecoreDockerTools
Set-DockerComposeEnvFileVariable "SITECORE_IDSECRET" -Value (Get-SitecoreRandomString 64 -DisallowSpecial)
$idCertPassword = Get-SitecoreRandomString 12 -DisallowSpecial
Set-DockerComposeEnvFileVariable "SITECORE_ID_CERTIFICATE" -Value (Get-SitecoreCertificateAsBase64String -DnsName "localhost" -Password (ConvertTo-SecureString -String $idCertPassword -Force -AsPlainText))
Set-DockerComposeEnvFileVariable "SITECORE_ID_CERTIFICATE_PASSWORD" -Value $idCertPassword
```

これは、`SITECORE_IDSECRET`、`SITECORE_ID_CERTIFICATE`、および `SITECORE_ID_CERTIFICATE_PASSWORD` 変数を処理するために、*SitecoreDockerTools* にある別のコマンドレットを使用します。

* `Get-SitecoreCertificateAsBase64String` - 新しい自己署名証明書を生成し、パスワードで保護されたBase64エンコードされた形式で証明書を返します。

#### Sitecore ライセンス変数を設定します

次に、`SITECORE_LICENSE` 変数を入力します。以下のPowerShellスクリプトを実行し、`-Path` をSitecoreライセンスファイルの場所に置き換えます。

```powershell
Import-Module SitecoreDockerTools
Set-DockerComposeEnvFileVariable "SITECORE_LICENSE" -Value (ConvertTo-CompressedBase64String -Path "C:\License\license.xml")
```

Sitecore のライセンスファイルは非常に大きいので、すべての環境変数のために [Windows で許可されている最大サイズに合わせて](https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083) 圧縮し、Base64 エンコードする必要があります。SitecoreDockerToolsの `ConvertTo-CompressedBase64String` コマンドレットを使用すると、これを簡単に行うことができます。

> Docker Compose環境ファイルではなく、Windows OS上で環境変数を設定することで、複数のSitecoreインスタンス間で変数を再利用することができます。これは状況によっては好ましいかもしれません。

> あるいは、各サービスにlicense.xmlの入ったフォルダをマウントして、SITECORE_LICENSE_LOCATION変数を設定することもできます。xConnect サービスの場合は、ライセンス ファイルが格納されているフォルダを指定します。その他のすべてのサービスでは、ファイル自体へのパスを指定します。この例は、GitHub の Helix.Examples リポジトリで見ることができます。

### TLS/HTTPS 証明書の設定

最新のブラウザの要件を満たし、デフォルトで安全な環境を提供するために、Sitecoreは [Traefik](https://docs.traefik.io/) を利用してDocker Composeのデフォルトのリバースプロキシまたはエッジルーターとして機能します。

#### traefikフォルダ

*getting-started\traefik* フォルダに移動し、内容を見てみましょう。以下のようなものがあります。

* **certs** - 生成された証明書を置く必要がある空のフォルダ。
* ***config/dynamic/certs_config.yaml** - Traefik コンテナで使用する Traefik 設定ファイル。

この *traefik* フォルダ全体が Docker ボリュームで Traefik `コンテナに公開されます。これがどのように行われるかは、docker-compose.yml` ファイルで確認できます。

```yaml
traefik:
  [...]
  volumes:
    - source: \\.\pipe\docker_engine
      target: \\.\pipe\docker_engine
      type: npipe
    - ./traefik:C:/etc/traefik
  [...]
```

traefikサービスが相対的な `./traefik` フォルダを `C:/etc/traefik` にある実行中のコンテナにマップしていることに注意してください。

> ボリュームの詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/compose-file/#volumes) を参照してください。

このパスはTraefikサービスの設定で使用され、`--providers.file.directory` を `C:/etc/traefik/config/dynamic`（*certs_config.yaml* ファイルが存在する場所）に設定します。

> Traefik の設定の詳細については、[Traefik のドキュメント](https://docs.traefik.io/getting-started/configuration-overview/) を参照してください。

それでは、*certs_config.yaml* ファイルを詳しく見てみましょう。

```yml
tls:
  certificates:
    - certFile: C:\etc\traefik\certs\xp0cm.localhost.crt
      keyFile: C:\etc\traefik\certs\xp0cm.localhost.key
    - certFile: C:\etc\traefik\certs\xp0id.localhost.crt
      keyFile: C:\etc\traefik\certs\xp0id.localhost.key
```

> Traefik での TLS 設定の詳細については、[Traefik のドキュメント](https://docs.traefik.io/https/tls/) を参照してください。

これは、certs フォルダ内の証明書ファイルを参照して、ボリュームマウントされたパス (`C:\etc\traefik`) も使用していることがわかります。これらは次のステップで作成する必要がある証明書です。

これらの証明書を作成するには、[mkcert](https://github.com/FiloSottile/mkcert) ユーティリティを使うことをお勧めします。

#### mkcertのインストール

1. [最新のWindows実行ファイル](https://github.com/FiloSottile/mkcert/releases) （例：[mkcert-v1.4.1-windows-amd64.exe](https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-windows-amd64.exe) ）をダウンロードしてください。
2. ファイル名を `mkcert.exe` に変更します。
3. ファイルをPATH環境変数(例: `C:\Windows\system32`)にあるディレクトリに移動します。*これにより、フルパスを指定せずにmkcertを実行することができます。*
4. 管理者モードでコマンドプロンプトを開き、`mkcert -install`

または、以下のコマンドで [Chocolatey](https://chocolatey.org/) を使ってインストールします。

```powershell
choco install mkcert
mkcert -install
```

#### 証明書の生成

mkcertがインストールされたら、get-startedフォルダ（例：*C:\sitecore\docker-examples\getting-started*）から以下のコマンドを実行して、必要な証明書を生成します。

```powershell
mkcert -cert-file traefik\certs\xp0cm.localhost.crt -key-file traefik\certs\xp0cm.localhost.key "xp0cm.localhost"
mkcert -cert-file traefik\certs\xp0id.localhost.crt -key-file traefik\certs\xp0id.localhost.key "xp0id.localhost"
```

> 証明書ファイル自体は通常ソース管理からは無視されるので、追跡されていないファイルを (git clean などで) 削除すると、それらのファイルを再度生成する必要があることに注意しましょう。

### Windows ホストファイルのエントリの追加

最後に、"xp0cm.localhost" と "xp0id.localhost" を Windows の hosts ファイルに追加します。これらはループバックIPアドレス127.0.0.0.1を指しているはずです。

hostsファイル(例: *C:WIndows\System32\drivers\etc\hosts* )を開いて、以下の項目を追加してください。

```
127.0.0.0.1 xp0cm.localhost
127.0.0.0.1 xp0id.localhost
```

あるいは、別の *SitecoreDockerTools* コマンドレット、`Add-HostsEntry` を使用することもできます。

```powershell
Add-HostsEntry "xp0cm.localhost"
Add-HostsEntry "xp0id.localhost"
```

## Sitecoreの起動

準備が完了したら、Docker Composeコマンド1つでSitecoreインスタンスを起動します。
Composeファイルと同じフォルダ（例：*C:\sitecore\docker-examples\getting-started*）から以下を実行します。

```powershell
docker-compose up -d
```

これにより、いくつかのことを行うことができます。
1. Sitecore Container Registry から必要なイメージをすべてダウンロードします。
2. 使用するデフォルトのネットワークを作成する
3. 設定したサービスごとにコンテナを作成し
4. 設定されたエントリポイントでコンテナを起動します。

> `-d` ("detached mode")はDockerにコンテナをバックグラウンドで起動し、起動したままにしておくよう指示します。これを省略すると、コンテナのログが代わりに出力にストリームされるので、`Ctrl+C` を入力してプロンプトに戻る必要があります。これを行うと、コンテナも停止して削除されます。

> このガイドで使用されているこのコマンドやその他の一般的なコマンドの簡単なリファレンスについては、[Sitecore Docker チートシート](cheat-sheet.md) を参照してください。

おめでとうございます。これで、Sitecore Experience Platform - Single (XP0) インスタンスが稼働しました。

### 実行中のコンテナを見る

`docker ps` コマンドで作成したコンテナを見ることができます。

```powershell
docker ps
```

これは、"Up "のステータスで示されるように、実行中のすべてのコンテナのリストを表示します。また、コンテナID、使用されているイメージ、コンテナが公開されているポートも表示されます。

```powershell
CONTAINER ID  IMAGE                                                                          COMMAND                   CREATED             STATUS                            PORTS                                                 NAMES
75684e9146f2  traefik:v2.2.0-windowsservercore-1809                                          "/traefik --ping --a…"    7 seconds ago       Up 3 seconds (healthy: starting)  80/tcp, 0.0.0.0:443->443/tcp, 0.0.0.0:8079->8080/tcp  sitecore-xp0_traefik_1
67be2b1350e1  scr.sitecore.com/platform/sitecore-xp0-cm:10.0.0-ltsc2019                      "C:\\LogMonitor\\LogMo…"  21 seconds ago      Up 11 seconds (healthy)           80/tcp                                                sitecore-xp0_cm_1
e553b6ab0fb5  scr.sitecore.com/platform/sitecore-xp0-cortexprocessingworker:10.0.0-ltsc2019  "C:\\LogMonitor\\LogMo…"  21 seconds ago      Up 11 seconds (healthy)                                                                 sitecore-xp0_cortexprocessingworker_1
8d40d14da8a2  scr.sitecore.com/platform/sitecore-xp0-xdbautomationworker:10.0.0-ltsc2019     "C:\\LogMonitor\\LogMo…"  21 seconds ago      Up 12 seconds (healthy)                                                                 sitecore-xp0_xdbautomationworker_1
b4279d4f6de7  scr.sitecore.com/platform/sitecore-id:10.0.0-ltsc2019                          "C:\\LogMonitor\\LogMo…"  27 seconds ago      Up 21 seconds (healthy)           80/tcp                                                sitecore-xp0_id_1
41418243fd0d  scr.sitecore.com/platform/sitecore-xp0-xdbsearchworker:10.0.0-ltsc2019         "C:\\LogMonitor\\LogMo…"  27 seconds ago      Up 20 seconds (healthy)                                                                 sitecore-xp0_xdbsearchworker_1
6f4e64033031  scr.sitecore.com/platform/sitecore-xp0-xconnect:10.0.0-ltsc2019                "C:\\LogMonitor\\LogMo…"  27 seconds ago      Up 21 seconds (healthy)           0.0.0.0:8081->80/tcp                                  sitecore-xp0_xconnect_1
33931b923acb  scr.sitecore.com/platform/sitecore-xp0-mssql:10.0.0-ltsc2019                   "powershell -Command…"    About a minute ago  Up 56 seconds (healthy)           0.0.0.0:14330->1433/tcp                               sitecore-xp0_mssql_1
3b362d8ed9a6  scr.sitecore.com/platform/sitecore-xp0-solr:10.0.0-ltsc2019                    "powershell -Command…"    About a minute ago  Up 56 seconds                     0.0.0.0:8984->8983/tcp                                sitecore-xp0_solr_1
```

これは、設定されたヘルスチェック (`docker-compose.yml` ファイルの `healthcheck` を参照してください) を満たすために、まだウォーミングアップ中であることを意味します。`docker ps` コマンドを再度実行すると、最終的にこれらがすべて "(healthy)" に変化していることがわかります。

### Sitecore コンテナにアクセスする

リバースプロキシによってサービスされるコンテナは、設定されたホスト名 (https://xp0cm.localhost など) を使用して HTTPS プロトコルを介してアクセスされます。

公開されている残りのコンテナは、特定のポートを使用するように事前に設定されています（`docker-compose.yml`ファイルの `ports` を参照してください）。Docker Desktop for Windowsのデフォルト設定では、これらのポートにlocalhostでアクセスします。

> Docker Desktop for Windowsでのネットワーキングの詳細については、[Dockerのドキュメント](https://docs.docker.com/docker-for-windows/networking/) を参照してください。

つまり、Sitecore Experience Platform - Single (XP0) コンテナには以下のようにアクセスできます。

* Sitecore Content Management (cm): https://xp0cm.localhost
* Sitecore Identity Server (id): https://xp0id.localhost
* Sitecore xConnect Server (xconnect): http://localhost:8081
* Apache Solr (solr): http://localhost:8984
* Microsoft SQL Server (mssql): localhost,14330
* Traefik: http://localhost:8079

#### SQL Serverへの接続についての注意点

ポートを使用してSQL Serverに接続する場合は、構文が少し異なります。上記のようにコロンではなくカンマを使用する必要があります。SQL Server認証では、"sa" アカウントと `.env` ファイルで `SQL_SA_PASSWORD` に指定した値（`init.ps1`ではデフォルトで "Password12345"）を使用して接続できます。

![SQL Server](/docs/SSMS-Connection.png "SQL Server")

## インスタンスを確認します。

https://xp0cm.localhost を参照すると、Sitecore のデフォルトのウェブサイトが表示されるはずです。

ここで、https://xp0cm.localhost/sitecore を参照して、Sitecore にログインできることを確認します。ユーザー名には「admin」を、パスワードには `.env` ファイルの `SITECORE_ADMIN_PASSWORD` で指定した値（init.ps1のデフォルトでは「Password12345」）を使用します。

最後に、大きな問題がないことを確認するためには、ログを見ておくとよいでしょう。以下のコマンドを実行して、すべてのコンテナのログを確認してください。

```powershell
docker-compose logs -f --tail 20
```

> `-f` (または --follow)はDockerに出力をストリームするように指示し、--tailは初期ログの出力を各コンテナの最後の20行に制限します。

コンテナの前にログの先頭が付いていることがわかります。終了したらCtrl+Cを入力してプロンプトに戻ります。

## Sitecoreを停止する

Docker Composeコマンド1つで、同様にSitecoreインスタンスを停止させることができます。

```powershell
docker-compose stop
```

これでコンテナは停止しますが、コンテナは削除されません。その後、`docker-compose start` で再度起動することができます。さらに一歩進んだ方法としては、down コマンドを使用します。

```powershell
docker-compose down
```

これはコンテナを停止するだけでなく、コンテナと作成されたネットワークも削除します。

> イメージを削除するために --rmi <all/local> を追加することで、さらに強力な削除ができます。

毎日の開発ワークフローでは、これらのコマンドを組み合わせて一日中使用することになるでしょう。おそらく、朝起きて、その日のログオフ前に `down` します。あるいは、あるプロジェクトを `stop` してからジャンプして別のプロジェクトを `start` することもあるでしょう。

これらのコマンドは、使用しているトポロジーにもよりますが、比較的高速であることを覚えておいてください。これに他の[多くの利点を組み合わせる](intro.md#なぜsitecoreとコンテナなのか？) ことで、コンテナベースのSitecore開発がいかに多くの利点を持っているかを理解することができます。

### 永続的なストレージのクリーンアップ

mssql-data と solr-data フォルダにファイルがあることに気づくかもしれません。これらのファイルは [traefik フォルダ](#traefikフォルダ) と同様に、Compose ファイルのボリュームとしてマウントされています。これらがどのように設定されているかは、`docker-compose.yml` ファイルで確認できます。

```yml
mssql:
  [...]
  volumes:
    - type: bind
      source: .\mssql-data
      target: c:\data
solr:
  [...]
  volumes:
    - type: bind
      source: .\solr-data
      target: c:\data
```

> ボリュームの詳細については、[Dockerのドキュメント](https://docs.docker.com/compose/compose-file/#volumes) を参照してください。 

この場合、これらのフォルダはmssqlサービスのデータベースファイルとsolrサービスのインデックスファイルの永続的なストレージとして使用されています。 つまり、データベースとインデックスのデータは、`Docker-compose down` した後も残っています。

しかし、新しく始めたい場合や、古いデータのためにこれらをクリアする必要がある場合もあるでしょう。 例えば、[Sitecoreの管理者パスワードを変更](troubleshooting.md#管理者としてsitecoreにログインできない) した場合などです。 

これらのフォルダ内のファイルを手動で削除するか、付属の `clean.ps1` スクリプトを使用してください。 get-startedフォルダに移動し、PowerShell管理者プロンプトから実行してください。 

```powershell
.\clean.ps1
```

 > これがデフォルトの Sitecore の設定です。 しかし、データを完全に一過性のものにしておきたい場合は、これらのボリュームマウントを削除することで、上記のシナリオを回避することができます。 
 
 ## 次のステップ
 
 コンテナでSitecoreインスタンスを実行する方法を見てきましたが、ソリューションのビルドから始めて、カスタムSitecoreイメージをどのように作成するかについては、以下のリンクを参照してください。
 
* [ソリューションをビルドする](build-solution.md)


## 関連情報

このガイドで使用するコマンドについては、Sitecore Docker チートシートで詳しく説明しています。

* [Sitecore Docker チートシート](cheat-sheet.md)

問題に直面していませんか？ トラブルシューティングガイドをご覧ください。 

* [トラブルシューティング](troubleshooting.md)

Dockerドキュメント 

* https://docs.docker.com/compose 
* https://docs.docker.com/docker-for-windows/networking/
