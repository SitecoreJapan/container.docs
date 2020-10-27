---
id: module-reference
title: Sitecore モジュールリファレンス
sidebar_label: Sitecore モジュールリファレンス
---

> **注意:** このページの原文は https://containers.doc.sitecore.com/docs/module-reference です

このページは、Dockerの「アセットイメージ」として利用可能なSitecoreモジュールと、カスタムイメージを構築する際に各ロールに含める必要があるSitecoreランタイムのDockerfile命令のリファレンスとして機能します。

Sitecoreモジュールイメージの詳細と、それらがどのように含まれているかについては、Sitecore PowerShell Extensions (SPE)モジュールとSitecore Experience Accelerator (SXA)モジュールを含む「Sitecoreモジュールの追加」ガイドを参照してください。

Sitecore のパブリックレジストリの使用方法については、Sitecore イメージリファレンスを参照してください。

Sitecore PowerShell Extensions (SPE)

イメージリポジトリ

scr.sitecore.com/sxp/modules/spe-assets
Dockerfileの説明書

ＭＳＳＱＬ

COPY --from=<spe_image> C:\spe_data
RUN C:DepployDatabases.ps1 -ResourcesDirectory C:\spe_data; `
    Remove-Item -Path C:s\spe_data -Recurse -Force.

コピー
センチ

COPY --from=<spe_image> C:\module\cm\content C:\pubwwwroot

コピー
Sitecore Experience Accelerator（SXA

イメージリポジトリ

scr.sitecore.com/sxp/modules/sxa-xm1-assets
scr.sitecore.com/sxp/modules/sxa-xp1-assets
Dockerfileの説明書

ＭＳＳＱＬ

COPY --from=<sxa_image> C:\module
RUN C:DepployDatabases.ps1 -ResourcesDirectory C:\sxa_data; `
    Remove-Item -Path C:\sxa_data -Recurse -Force.

コピー
ソルアー

COPY --from=<sxa_image> C:\module\solr C:\sxa_data
RUN C:\-Add-SolrCores.ps1 -SolrPath C:\solr -SolrSchemaPath C:\sxa_datamanaged-schema -SolrCoreNames 'sitecore_sxa_master_index,sitecore_sxa_web_index'; '
    Remove-Item -Path C:

コピー
ＣＤ

COPY --from=<sxa_image> C:\module\cd\content C:\pub\wwwroot
COPY --from=<sxa_image> C:\module\tools C:\module\tools
RUN C:\module:toolsInitializeizeize-Content.ps1 -TargetPath C:\inetpubwwwroot; `.
    Remove-Item -Path C:module -Recurse -Force.

コピーします。
センチ

COPY --from=<sxa_image> C:\module\cmcontent C:\pubwwwroot
COPY --from=<sxa_image> C:\module\tools C:\module\tools
RUN C:\module:toolsInitializeizeize-Content.ps1 -TargetPath C:\inetpubwwwroot; `.
    Remove-Item -Path C:module -Recurse -Force.

コピーします。
JavaScriptサービス（JSS） / Sitecoreヘッドレスサービス

イメージリポジトリ

scr.sitecore.com/sxp/modules/jss-xm1-assets
scr.sitecore.com/sxp/modules/jss-xp1-assets
Dockerfileの説明書

ＭＳＳＱＬ

COPY --from=<headless_services_image> C:\moduledb C:\jss_data
RUN C:\DeployDatabases.ps1 -ResourcesDirectory C:\jss_data; `
    Remove-Item -Path C:\jss_data -Recurse -Force.

コピー
ＣＤ

COPY --from=<headless_services_image> C:\modulecdcontent C:\pubwwwroot
COPY --from=<headless_services_image> C:\module
RUN C:\module:toolsInitializeizeize-Content.ps1 -TargetPath C:\inetpubwwwroot; `.
    Remove-Item -Path C:module -Recurse -Force.

コピーします。
センチ

COPY --from=<headless_services_image> C:\modulecmcontent C:\pubwwwroot
COPY --from=<headless_services_image> C:\module
RUN C:\module:toolsInitializeizeize-Content.ps1 -TargetPath C:\inetpubwwwroot; `.
    Remove-Item -Path C:module -Recurse -Force.

コピーします。
Sitecore管理サービス

イメージリポジトリ

scr.sitecore.com/sxp/modules/sitecore-management-services-xm1-assets
scr.sitecore.com/sxp/modules/sitecore-management-services-xp1-assets
Dockerfileの説明書

センチ

COPY --from=<management_services_image> C:\modulecmcontent C:\\pubwwwroot

コピー
←