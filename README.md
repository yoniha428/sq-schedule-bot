# sq-schedule-bot概要

**sq-schedule-bot**は、[MK8DX 150cc Lounge](https://www.mk8dx-lounge.com/)( 以降ラウンジ )のSquad Queueの参加者を自身のサーバーで管理・通知することができるDiscord上のbotです。

ラウンジのsq-scheduleの内容をもとに参加者投票を作り、参加者が集まっている模擬については60分前、30分前にお知らせチャンネルにて通知します。

> [!TIP]
> MK8DX Lounge(以降単にラウンジ)はマリオカート8DXのガチ勢が対戦をするためのDiscordサーバーです。
> また、Squad Queueはラウンジ内にあるモードの1つで、知り合いとチームを組んでチーム戦をすることができます。( 他のモードでは、知らない人とチームになったり、1人対戦をしたりすることができます。 )


# 目次
- [注意](#注意)
- [初期設定](#初期設定)
  - [Discord全般の設定](#discord全般の設定)
  - [bot特有の設定](#bot特有の設定)
    - [sq-followchannelコマンド](#sq-followchannelコマンド)
    - [sq-notifychannelコマンド](#sq-notifychannelコマンド)
    - [sq-needformatコマンド](#sq-needformatコマンド)
- [使い方](#使い方)
- [使用技術](#使用技術)
- [問い合わせ先 (Note for English speaker)](#問い合わせ先)


# 注意

> [!IMPORTANT]
> このプロジェクトはα版です！ユーザーの皆様はβ版リリースまでお待ち下さい！

もし共同開発してくださる方がいたら、 [開発者向け情報(README内リンク)](#開発者向け情報) がありますので、ぜひ読んで参加してみてください！僕はGitHub初心者で初プロジェクトなので気楽にどうぞー！


# 初期設定
## Discord全般の設定

まず、sq-schedule-botをサーバーに招待します。

そして、Loungeサーバーの`sq-schedule`チャンネルを、自分のサーバーのどこかにフォローします。

( できない場合は招待先のサーバーの権限が不足しています。ウェブフック招待権限が必要です。botを招待したい方のサーバー管理者に問い合わせてください。

また、よく分からない場合は管理者権限を付与すればなんでもできるはずです。 )

> [!CAUTION]
> 決してLoungeスタッフに聞かないでください。迷惑がかかってしまいます。


## bot特有の設定

現在は3つのコマンドによる設定が可能で、特に前半2つは必須項目です。


### /sq-followchannelコマンド

ラウンジの`sq-schedule`をフォローしたチャンネル( 以降フォローチャンネル )を、このコマンドで設定します。

必須オプションとしてチャンネルの選択を求められるので、フォローしたチャンネルを選択してください。


### /sq-notifychannelコマンド

人数が集まっていたら通知してほしいチャンネル( 以降通知チャンネル )を、このコマンドで設定します。

上記同様にチャンネルの選択を求められるので、お知らせをしてほしいチャンネルを選択してください。


### /sq-needformatコマンド

投票を作成したり、通知を送信してほしいフォーマットを、このコマンドで設定します。

サブコマンドとして、`add`, `delete`の2つがあります。`add`で追加、`delete`で削除ができます。

それぞれのコマンドを選ぶとフォーマットの選択を求められるので、追加/削除したいフォーマットを選択してください。

デフォルトでは、`2v2, 3v3, 4v4, 6v6`のすべてのフォーマットが有効になっています。


## 使い方

ラウンジの`sq-schedule`チャンネルに新たなSQの予定が投稿されると、自分のサーバーのフォローチャンネルにもその予定が投稿され、botが自動的に投票を作ります。

それぞれのユーザーは参加したい予定にCan joinしましょう。他の予定が入ったらdropを忘れずに。

人数が集まっている模擬の60分前、30分前になると、botがお知らせチャンネルに参加者をメンションして通知してくれます。

> [!WARNING]
> フォローチャンネルにて@everyoneで始まる発言をすると、botが謎の投票を作ります！
> 邪魔だと思うので、フォローチャンネルはbot専用のチャンネルにすることをおすすめします。


# 使用技術
<img src="https://img.shields.io/badge/TypeScript-769BC6.svg?logo=typescript&style=for-the-badge&labelColor=EEEEEE" height="50" alt="TypeScript">
<img src="https://img.shields.io/badge/-Node.js-769BC6.svg?logo=node.js&style=for-the-badge&labelColor=EEEEEE" height="50" alt="Node.js">
<img src="https://img.shields.io/badge/-Discord.js-769BC6.svg?logo=discord&style=for-the-badge&labelColor=EEEEEE" height="50" alt="discord.js">

↑このアイコンかっこよくないですか？shields.ioのbadgeってやつです。


# 開発者向け情報

上にもある通り、このbotは開発中のα版です。共同開発者を募集しているので、協力していただける方はTwitter [@yoniha](https://x.com/yoniha428) までDMをください！

使用技術はTypeScript、Node.js、discord.js( Discord API用のJavaScriptライブラリ )などです。

GitHub初めてのプロジェクトなので、お手柔らかにお願いします！勉強させてください！


## issueについて

誤字とかでもバンバン立ててほしいです！

デバッグは頑張りますが、機能追加については暇だったらやるかも程度に考えていただければと思います。


## Pull requestについて

issueに対応するようにリクエストしていただければと思います！

Discord botでCI/CDを構築するのが難しくて( 詳しい人教えて下さい～ )、人の目で見てからmergeすると思うので、見やすくしていただけると非常にありがたいです。( 逆に僕のコードが見にくかったらそれもissue立てちゃって大丈夫です。 )


# 問い合わせ先

使い方、共同開発希望どちらもTwitter [@yoniha428](https://x.com/yoniha428) のDMまでお願いします！

このREADMEを読んだうえで分からないことなどあればバンバン連絡してください！改善に繋がります！

I'm sorry that I didn't make `README-en.md`. (404 No enought English skill found)

Feel free to send me DMs so that I can improve my English & we can develop together!