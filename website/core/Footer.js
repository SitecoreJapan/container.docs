/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    return `${baseUrl}${docsPart}${doc}`;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <div>
            <h5>ドキュメント</h5>
            <a href={this.docUrl('intro')}>
              はじめに
            </a>
            <a href={this.docUrl('build-solution')}>カスタムの Sitecore イメージの作成</a>
            <a href={this.docUrl('file-deployment')}>
              ローカルの開発とデバッグ
            </a>
            <a href={this.docUrl('dockerfile-best-practices')}>
              リファレンス
            </a> 
                    </div>
          <div>
            <h5>リンク</h5>
            <a href="https://github.com/Sitecore/docker-examples">Docker サンプルリポジトリ</a>
          </div>
        </section>

        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
