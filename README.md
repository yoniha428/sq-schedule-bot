# 何ができるのか
**sq-schedule-bot**は、[MK8DX 150cc Lounge](https://www.mk8dx-lounge.com/)のSquad Queueの参加者を自身のサーバーで管理・通知することができるDiscord上のbotです。

ラウンジのsq-scheduleの内容をもとに参加者投票を作り、参加者が集まっている模擬については60分前、30分前にお知らせチャンネルにて通知します。

# 使い方
このbotは**招待するだけでは使えません**(今のところは)。具体的には、ユーザーは以下の行動によってbotを使える状態にできます。


* Discord Developer Portalから、botの準備をする。
* Renderで、このリポジトリを用いたサーバーを構築する。
* Google Apps Scriptから、Renderのサーバーを常時アクティブにする。

Render以外のPaaSでサーバーを構築したり、GAS以外のサービスでサーバーをアクティブにすることも可能ですが、このREADMEではRender、GASの利用を想定します。

## 初期設定

### Discord Developer Portalの設定
[Discord Developer Portal](https://discord.com/developers/applications)にて、New Applicationを押します。

任意の名前を設定し、BotメニューからAdd Botを選択します。

Oauth2メニューを選択し、SCOPESはbotのみ、BOT PERMISSIONSはAdministratorを選択します(本当はAdminまではいらない気がします。PERMISSIONSについて理解が深まったら追記しますが、コードを見ていただくと分かる通り怪しいことはしていないので安心してね💋)。

URLが生成されるので、そのURLにブラウザでアクセスしてください。

Discordが開き、招待画面に移るので、招待したいサーバーを選択してください。

これで設定は終了ですが、BotメニューのTOKENはRender設定時に使うので、タブは開いておくと良いです。

### Renderの設定
[Render](render.com/)のアカウントを作成します。

[dashboard](https://dashboard.render.com/)からAdd Newを選択し、Web Serviceを選択します。

Public Git Repositoryタブを選択し、このリポジトリのURL(https://github.com/yoniha428/sq-schedule-bot)を貼り付けます。

以下の通り初期設定します。


| 項目 | 設定 |
|---|---|
| Name | 任意(ユニークである必要があります) |
| Language | Node |
| Branch | master |
| Region | Singapore |
| Build Command | npm install |
| Start Command | node index.js |
| Instance Type | Free |

Advancedメニューを開きSecret Filesの設定を行います。このリポジトリにあるconfig.json.exampleを参照し、config.jsonを作成してください。

discordTokenには先程のDeveloper PortalのbotメニューにあったTOKENを設定してください。

notifyChannelIdには通知を送りたいチャンネルのチャンネルIDを設定してください(Discordの開発者モードをオンにして、チャンネルを右クリックするとメニューからコピーできます)。

noNeedFormatには通知や管理の必要がない形式を入力します。例えば、4v4, 6v6の通知が不要ならば、
```"noNeedFormat": [4, 6]```のようにしてください。

Auto-Deployはこのリポジトリのmasterに変更があるたびにサーバーを構築し直すかどうかのオプションです。
onにしても良いように作るつもりですが、サーバーが不安定になる可能性もあるため、現状の機能に満足している方はoffにすることを推奨します。

### GASの設定
あと1歩です。お手数をおかけして本当にすまない。

あなたが持っているGoogleアカウントにログインした状態で、[GAS](https://script.google.com/home)を開きます。

左のメニューから「新しいプロジェクト」を選択します。

コード.gsの内容を以下の通りにします。なお、URLにはRenderのプロジェクトページに表示されている`https://プロジェクト名.onrender.com`を入力してください。

```
function main(){
  const url = 'ここにURL'
  UrlFetchApp.fetch(url).getContentText();
}
```

最後に、左側のメニューからトリガーを選択し、トリガーを追加します。設定は以下のとおりです。

| 項目 | 設定 |
|---|---|
| 実行する関数を選択 | main |
| 実行するデプロイを選択 | Head |
| イベントのソースを選択 | 時間主導型 |
| 時間ベースのトリガーのタイプを選択 | 分ベースのタイマー |
| 時間の間隔を選択（分） | 10 分おき |
| エラー通知設定 | 任意 |

### Discordサーバーの設定
もうすこし初期設定が続きます。

botを使いたいサーバー(これからサーバーというときは、RenderではなくてDiscordのサーバーのことです)に、`sq-schedule`という名前のチャンネルを作成します。

ラウンジのサーバーのsq-scheduleを開き、「フォローする」を選択します。サーバーはあなたが使いたいサーバーを、チャンネルはsq-scheduleを指定します。ここであなたが使いたいサーバーを選択できないときは、サーバーの管理者に言って管理者権限を貰ってください。

ここまで来れば初期設定完了です！お疲れ様でした！


## botの使い方
ラウンジのsq-scheduleに新たなSQの予定が投稿されると、自分のサーバーのsq-scheduleにもその予定が投稿され、botが自動的に投票を作ります。それぞれのユーザーは参加したい予定にCan joinしましょう。予定が入ったらdropを忘れずに。

人数が集まっている模擬の60分前、30分前になると、botがお知らせチャンネルに参加者をメンションして通知してくれます。

注意！sq-scheduleにて@everyoneで始まる発言をするとbotが謎の投票を作ります！邪魔だと思うので、sq-scheduleはbot専用のチャンネルにすることをおすすめします。

# 使用技術
<center>

![Node.js](https://nodejs.org/static/logos/nodejsDark.svg)

![discord.js](https://discord.js.org/logo.svg)

</center>

# issueについて

誤字とかでもバンバン立ててくれ～

デバッグは頑張りますが、機能追加については暇だったらやるかも程度に考えていただければと思います。