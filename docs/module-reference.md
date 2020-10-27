---
id: module-reference
title: Sitecore モジュールリファレンス
sidebar_label: Sitecore モジュールリファレンス
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/module-reference です

このページは、Dockerの「アセットイメージ」として利用可能なSitecoreモジュールと、カスタムイメージを構築する際に各ロールに含める必要がある[Sitececore ランタイム Dockerfile](build-sitecore-images.md#sitecore-ランタイム-dockerfile)命令のリファレンスとして機能します。

Sitecoreモジュールイメージの詳細と、それらがどのように含まれているかについては、[Sitecore PowerShell Extensions (SPE)](#sitecore-powershell-extensions-spe) モジュールとSitecore Experience Accelerator (SXA)モジュールを含む [Sitecoreモジュールの追加](add-modules.md) ガイドを参照してください。

Sitecore のパブリックレジストリの使用方法については、Sitecore イメージリファレンスを参照してください。

## Sitecore PowerShell Extensions (SPE)

### イメージリポジトリ

* scr.sitecore.com/sxp/modules/spe-assets

### Dockerfile の手順

#### mssql

```
COPY --from=<spe_image> C:\module\db C:\spe_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\spe_data; `
    Remove-Item -Path C:\spe_data -Recurse -Force;

```

#### cm

```
COPY --from=<spe_image> C:\module\cm\content C:\inetpub\wwwroot
```

## Sitecore Experience Accelerator (SXA)

### イメージリポジトリ

* scr.sitecore.com/sxp/modules/sxa-xm1-assets
* scr.sitecore.com/sxp/modules/sxa-xp1-assets

### Dockerfile の手順

#### mssql

```
COPY --from=<sxa_image> C:\module\db C:\sxa_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\sxa_data; `
    Remove-Item -Path C:\sxa_data -Recurse -Force;
```

#### solr

````
COPY --from=<sxa_image> C:\module\solr C:\sxa_data
RUN C:\Add-SolrCores.ps1 -SolrPath C:\solr -SolrSchemaPath C:\sxa_data\managed-schema -SolrCoreNames 'sitecore_sxa_master_index,sitecore_sxa_web_index'; `
    Remove-Item -Path C:\sxa_data -Recurse -Force;
````    

#### cd

```
COPY --from=<sxa_image> C:\module\cd\content C:\inetpub\wwwroot
COPY --from=<sxa_image> C:\module\tools C:\module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath C:\inetpub\wwwroot; `
    Remove-Item -Path C:\module -Recurse -Force;
```

#### cm

```
COPY --from=<sxa_image> C:\module\cm\content C:\inetpub\wwwroot
COPY --from=<sxa_image> C:\module\tools C:\module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath C:\inetpub\wwwroot; `
    Remove-Item -Path C:\module -Recurse -Force;
```

## JavaScriptサービス（JSS） / Sitecoreヘッドレスサービス

### イメージリポジトリ

* scr.sitecore.com/sxp/modules/jss-xm1-assets
* scr.sitecore.com/sxp/modules/jss-xp1-assets

### Dockerfile の手順

#### mssql

```
COPY --from=<headless_services_image> C:\module\db C:\jss_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\jss_data; `
    Remove-Item -Path C:\jss_data -Recurse -Force;
```

#### cd

```
COPY --from=<headless_services_image> C:\module\cd\content C:\inetpub\wwwroot
COPY --from=<headless_services_image> C:\module\tools C:\module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath C:\inetpub\wwwroot; `
    Remove-Item -Path C:\module -Recurse -Force;
```

#### cm

```
COPY --from=<headless_services_image> C:\module\cm\content C:\inetpub\wwwroot
COPY --from=<headless_services_image> C:\module\tools C:\module\tools
RUN C:\module\tools\Initialize-Content.ps1 -TargetPath C:\inetpub\wwwroot; `
    Remove-Item -Path C:\module -Recurse -Force;
```

## Sitecore管理サービス

### イメージリポジトリ

* scr.sitecore.com/sxp/modules/sitecore-management-services-xm1-assets
* scr.sitecore.com/sxp/modules/sitecore-management-services-xp1-assets

### Dockerfile の手順

#### cm

```
COPY --from=<management_services_image> C:\module\cm\content C:\inetpub\wwwroot
```