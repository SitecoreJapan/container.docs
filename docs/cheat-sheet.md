---
id: cheat-sheet
title: Sitecore Dockerチートシート
sidebar_label: Sitecore Dockerチートシート
---

Dockerの公式ドキュメントは素晴らしいものですが、最初は少し圧倒されるかもしれません。このページでは、ローカルの開発環境でSitecoreをDockerで管理する際に便利なコマンドをいくつか紹介します。
ここでは、コマンドシェルとしてPowerShellを使用することを前提としています。

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/cheat-sheet です

## 全般

利用可能なコマンドをすべてリストアップします。

```powershell
docker help
docker-compose help
```

`--help` を使うと、特定のコマンドの詳細情報を表示することができます。

```powershell
docker <command> --help
docker-compose <command> --help
```

Docker環境の高レベル情報（バージョン、ルートディレクトリ、デフォルトのアイソレーションモードなど）を表示するには、以下のようにします。

```powershell
docker info
```

## イメージの管理

**イメージをリストアップ** (中間画像を含む場合は -a を使用)

```powershell
docker image ls
docker images
```

> 結果は`--format`オプションを使って[フォーマット](#フォーマット結果)することができます。有効なプレースホルダーのリストはDockerのドキュメントを参照してください。

**イメージの削除**

```powershell
docker image rm <image>
docker rmi <image>
```

`<image>` には、画像のIDかフルネームのどちらかを指定することができます。特筆すべきことは、id はそれを一意に識別するために最低限の文字数しか必要としないということです。例えば、次のようなイメージリストがあるとします。

```powershell
REPOSITORY                            TAG       IMAGE ID      CREATED       SIZE
mcr.microsoft.com/windows/servercore  ltsc2019  8351e66084ac  2 months ago  4.82GB
mcr.microsoft.com/windows/nanoserver  1809      880394ef5494  2 months ago  251MB
```

これら3つのコマンドはすべてナノサーバーイメージを削除します。

```powershell
docker image rm mcr.microsoft.com/windows/nanoserver
docker rmi 880394ef5494
docker rmi 88
```

すべてのイメージを削除するには、次のようにします。

```powershell
docker rmi $(docker images -a -q)
```

しかし、より多くの場合は、より選択的に使用したいと思うでしょう。そのためには、findstrと組み合わせた画像リストの書式設定を利用します。例えば、特定の名前やタグを持つすべての画像を削除するには、以下のようにします。

```powershell
docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}"|findstr "<search_text>")
```

**イメージの検査**

```powershell
docker image inspect <image>
docker inspect <image>
```

画像の詳細情報が表示されます。より興味深い詳細情報が表示されます。

* Id - 画像の完全な一意の識別子です。
* WorkingDir - 画像の中で対話型シェルを実行する際の落とし所です。これは、独自のカスタマイズでイメージを拡張するときに便利になります。
* Entrypoint - このイメージをコンテナ内で実行する際のデフォルトの入り口。これは、イメージがDocker Composeで使用されているときに知っておくと便利です。
* VirtualSize - イメージのサイズをバイト単位で指定します。

> ここでも[出力をフォーマット](#フォーマット結果)することができます。

## コンテナを管理する

**コンテナをリストアップする** (停止したコンテナを含めるには `-a` を使用します)

```powershell
docker container ls
docker ps
```

`-f` (または `--filter`) オプションを使って結果をフィルタリングすることができます。例えば、実行中のSitecore CMイメージだけを表示するには、以下のようにします。

```powershell
docker ps -f "name=cm"
```

> 結果は `--format` オプションを使って[フォーマット](#フォーマット結果)することもできます。有効なプレースホルダーのリストは[Dockerのドキュメント](https://docs.docker.com/engine/reference/commandline/ps/#formatting)を参照してください。


**コンテナの削除** (ボリュームを削除するには `-v` を使います)

```powershell
docker container rm <container>
docker rm <container>
```

[イメージ](#イメージの管理)と同様に、`<container>`にはコンテナID(フルまたはパーシャル)かフルネームを指定できます。

停止しているコンテナをすべて削除するには、次のようにします。

```powershell
docker rm $(docker ps -a -q)
```

(実行中のコンテナを削除するには `--force` を追加します)。

**コンテナの検査**

```powershell
docker container inspect <container>
docker inspect <container>
```

コンテナの詳細情報が表示されます。より興味深い詳細情報のいくつかをご紹介します。

* Id - コンテナの完全な一意の識別子。
* Image - コンテナが実行しているイメージ。
* NetworkSettings - ポート、IPアドレス、および任意のエイリアスを含むネットワーク情報。
* LogPath - コンテナのログファイルへのファイルシステムパスです。
* Volumes - ホストシステムとコンテナ間のボリュームマッピングを表示します。
* WorkingDir - コンテナで対話型シェルを実行する際にドロップされる場所です。

ここでも、出力を[フォーマット](#フォーマット結果)することができます。

**コンテナの起動と停止**

コンテナは個別に起動・停止することができます。

```powershell
docker container start <container>
docker start <container>
docker container stop <container>
docker stop <container>
```

しかし、Sitecore開発の場合、通常は[Docker Compose](#docker-composeを使う)を使って一度に複数のコンテナを使って作業することになります。

**コンテナとローカルファイルシステム間でファイルをコピーする**

```powershell
docker cp <src_path> <container>:<dest_path>
docker cp <container>:<src_path> <dest_path>
```

例えば、ファイルをコンテナにコピーするには

```powershell
docker cp file.txt 2c26f76568d4:/tools/
```

またはコンテナからフォルダをコピーします。

```powershell
docker cp 2c26f76568d4:/inetpub/wwwroot/App_Config/ ./
```

> コンテナはプロセス分離された状態で実行されている必要があります。Hyper-V コンテナに対するファイルシステム操作はサポートされていません。

**ログの表示**

```powershell
docker container logs <container>
docker logs <container>
```

`-f` (または `--follow`) を使用してログ出力をストリーム配信することができます。

```powershell
docker logs -f <container>
```

`Ctrl+C` を入力して終了します。

これらはほとんどのコンテナではかなり大きくなりますので、 `--tail` や `--until` オプションを使って制限したいと思うでしょう。例えば、最後の20件のログのみを表示するには、次のようにします。

```powershell
docker logs -f --tail 20 <container>
```

## フォーマット結果

Dockerコマンドの多くは結果をフォーマットするために`--format`や`-f`オプションを提供しており、表示用の出力を構築したり、他のスクリプトに渡したりすることができます。フォーマット文字列は[Goテンプレート](https://golang.org/pkg/text/template/)に従っていますので、多少の学習が必要かもしれませんが、一般的には結果から必要な情報を得るのは非常に簡単です。

inspectコマンドの場合、出力データはすでにJSON形式になっているので、データ構造は簡単です。

いくつかの例を紹介します。

**コンテナのイメージ名を取得する**

```powershell
docker inspect --format='{{.Config.Image}}' <container>
```

**コンテナのIPアドレスを取得する**

```powershell
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container>
```

リストコマンドの場合、出力はテーブル形式になっているので、利用可能なプロパティを見つけるにはもう少し調べる必要があります。Dockerのドキュメントを参照するか（[イメージについてはこちら](https://docs.docker.com/engine/reference/commandline/images/#format-the-output)、[コンテナについてはこちら](https://docs.docker.com/engine/reference/commandline/ps/#formatting)を参照）、以下のコマンドを使って出力をJSONとしてフォーマットすることができます。

```powershell
docker images --format "{{json .}}"
docker ps --format "{{json .}}"
```

いくつかの例

**カスタムイメージリスト**

```powershell
docker images --format "{{.ID}}: {{.Repository}}"
```

**カスタムコンテナリスト** (table ディレクティブを使用)

```powershell
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}"
```

## イメージ内での対話型シェルの実行

`powershell` は、それをサポートしているイメージでのみ使用できます。省略した場合は、デフォルトの`cmd`シェルが使用されます。

```powershell
docker run -it --rm <image> [powershell]
```

`exit` と入力すると、コンテナから前のシェルセッションに戻ることができます。

これは新しいコンテナを起動し (`run`)、対話型シェルにドロップし (`-it`)、終了後にコンテナを破棄します (`--rm`)。

デフォルトの `ENTRYPOINT` によっては、これがすべてのイメージで動作しない場合があることに注意してください。その場合は、デタッチドモードで実行する必要があります。

```powershell
docker run -d <image>
```

を実行し、[実行中のコンテナで対話型シェル](#コンテナ内で対話型シェルを実行する)を実行します。

## コンテナ内で対話型シェルを実行する

以下のようにすれば、実行中の Windows コンテナ内で対話型のシェルプロンプトを開くことができます。 `powershell` は、それをサポートしているイメージ上でのみ使用できます。

```powershell
docker exec -it <container> powershell
docker exec -it <container> cmd
```

`exit` と入力して、コンテナから前のシェルセッションに戻ります。

## クリーンアップ

Dockerは自動的に未使用のリソースを削除するわけではありません。時間が経つと、不要なリソースが蓄積されてディスクスペースを食いつぶしてしまうことがあります。

これを助けるために最も便利なコマンドは、以下の通りです。

```powershell
docker system prune
```

デフォルトでは、続行を促すプロンプトが表示されます。バイパスするには、`-f` (または `--force`) オプションを使用します。

以下のものが削除されます

* 停止しているすべてのコンテナ
* 少なくとも1つのコンテナで使用されていないすべてのネットワーク
* すべてのぶら下がり画像（タグ付けされておらず、どのコンテナからも参照されない
* すべてのビルドキャッシュ

このデフォルトは、一般的にはいつでも使用しても安全です。しかし、以下のオプションを追加することで、もう少し攻撃的に (そして破壊的に) することができます。

* `--volumes` - 少なくとも 1 つのコンテナで使用されていないすべてのボリュームを削除します。
* `-a` (または `--all`) - 少なくとも 1 つのコンテナに関連づけられていないすべての画像を削除する

> 個々のDockerオブジェクト（イメージ、コンテナなど）ごとにpruneコマンドがありますが、それらはあまり使われていません。詳細は[Dockerのドキュメント](https://docs.docker.com/config/pruning/)を参照してください。

## Docker Composeを使う

これらのコマンドは、Compose ファイルの場所から実行されます。Compose ファイルの名前が `docker-compose.yml` であることを前提としています。また、追加の `docker-compose.override.yml` があれば、自動的にロードされます。

Compose ファイルの名前が他のものである場合は、`-f` フラグを使用して明示的に指定します。

```powershell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

必要な数だけファイルを指定することができます。Compose はそれらのファイルを順番に一つの設定にまとめ、後続のファイルは前のファイルを上書きしたり、追加したりします。

集約された結果を実際に見るには `config` を使用します。例えば、以下のようになります。

```powershell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config
```

これは、結合されたコンパイルファイルや.envなどを含む、解決されたアプリケーションの設定を表示します。これは、Sitecore の世界では `/admin/showconfig.aspx` に相当するものと考えてください。

各コマンドでは、1つまたは複数のサービスの名前を追加することもできます。これにより、個々のサービス/コンテナをターゲットにすることができます。例えば、次のような Compose ファイルがあるとします。

```yml
version: "3"
services:
  mssql: [...]
  solr: [...]
  id: [...]
  cm: [...]
```

を使って id と cm コンテナだけを `restart` することができます。

```powershell
docker-compose restart id cm
```

**コンテナの作成と起動**

```powershell
docker-compose up -d
```

これにより、Composeの設定で定義されたすべてのサービスのコンテナが作成され、実行されます。

`-d `("detached mode") は、コンテナをバックグラウンドで起動し、実行したままにしておくことを指示します。これを省略すると、コンテナのログが出力され、`Ctrl+C`を入力してプロンプトに戻る必要があります。これを行うと、コンテナを停止して削除することもできます。

**コンテナの停止**

```powershell
docker-compose stop
```

これでコンテナは停止しますが、削除はしません。

**コンテナの起動**

```powershell
docker-compose start
```

これにより、以前に停止していた既存のコンテナが起動します。

**コンテナの再起動**

```powershell
docker-compose restart
```

これにより、停止しているすべてのコンテナと実行中のコンテナが再起動されます。

**コンテナの停止と削除** (ボリュームを削除するには `-v` を使用)

```powershell
docker-compose down
```

これにより、すべてのコンテナが潔く停止し、すべて停止したら削除します。`up` によって作成されたネットワークも削除されます。

**コンテナの一覧表示** (停止しているコンテナを含めるには `-a` を使用)

```powershell
docker-compose ps
```

サービスの名前をリストアップするには、`-services` オプションを使用します。

```powershell
docker-compose ps --services
```

**イメージを構築する**

```powershell
docker-compose build
```

これはビルドを定義しているすべてのサービスのイメージを `build` して作成します。

`up` で `--build` フラグを使用すると、最新のコードでコンテナを再ビルドして実行することもできます。

```powershell
docker-compose up --build -d
```

**ログの表示**

```powershell
docker-compose logs
```

これはすべてのコンテナからのログを表示することに注意してください。`-tail` オプションを使用すると、行数を制限したり、特定のコンテナに対してフィルタリングしたりすることができます。例えば、cm と xconnect コンテナからの最後の 20 件のログエントリのみを表示するには、--tail オプションを使用します。

```powershell
docker-compose logs --tail 20 cm xconnect
```

また、`-f` (または `--follow`) を使用してログ出力をストリーム配信することもできます。

```powershell
docker-compose logs -f --tail 20
```

`Ctrl+C` を入力して終了します。
