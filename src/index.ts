import Tokenizer from './tokenizer'
import Parser from './parser'
import * as tokens from './token'

class ApiMarkupLanguage {
  private static async tokenize(source: string): Promise<tokens.Root> {
    const tokenizer = new Tokenizer(source)
    return await tokenizer.tokenize()
  }
  public static async parseToHtml(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    return parser.html()
  }
  public static async parseToMarkdown(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    return parser.markdown()
  }
  public static async parseToPythonHttpx(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    console.log(JSON.stringify(tokens, undefined, 2))

    return ''
  }
}

ApiMarkupLanguage.parseToPythonHttpx(`
from https://api.21cnt.cn/aml/test import *

type genshinServerRegion = (
  cn_gf01: 官服
  cn_qd01: 渠道服
  os_asia: 亚服
  os_euro: 欧服
  os_cht: 港澳台服
  os_usa: 美服
)

type res<T> = {
  num retcode: 返回码 = 0
  str message: 返回消息 = ''
  T data: 返回内容
}

type getAccountGenshinRoleBasicInfoData = {
  str AvatarUrl: 头像URL，总是为空字符串 = ""
  str nickname: 账号昵称
  genshinServerRegion region: 账号所属服务器名称
  num level: 账号冒险等级
  num card_play_level: 未知
}

get getAccountGenshinRoleBasicInfo = {
  url = https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/roleBasicInfo
  query = {
    str role_id: 游戏账号UID
    genshinServerRegion server: 服务器名称
  }
  res<getAccountGenshinRoleBasicInfoData> response

  header = {
    x-rpc-client_type = 5
    DS: X4 DS2
  }
  cookie = {
    ltoken
    ltmid_v2
  }
}
`)

export default ApiMarkupLanguage