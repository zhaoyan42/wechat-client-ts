import qs from "qs";
// 应用授权作用域，snsapi_base （不弹出授权页面，直接跳转，只能获取用户openid），snsapi_userinfo （弹出授权页面，可通过openid拿到昵称、性别、所在地。并且，即使在未关注的情况下，只要用户授权，也能获取其信息）
type Scope = "snsapi_base" | "snsapi_userinfo";

abstract class 微信登录Service {
  protected constructor(appid: string, scope: Scope) {
    this.appid = appid;
    this.scope = scope;
  }
  private _code: string | null = null;
  private _redirect_uri = "";

  protected appid: string;

  protected scope: Scope;

  static makeState() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  setAppId(appid: string) {
    this.appid = appid;
  }

  get redirect_uri() {
    return this._redirect_uri;
  }

  set redirect_uri(redirect_uri) {
    this._redirect_uri = encodeURIComponent(redirect_uri);
  }

  get state() {
    return localStorage.getItem("wechat_auth:state");
  }

  set state(state: string | null) {
    if (state === null) localStorage.removeItem("wechat_auth:state");
    else localStorage.setItem("wechat_auth:state", state);
  }

  abstract get authUrl(): string;

  getCodeFromCallback(redirect_uri: string) {
    const parsedUrl = qs.parse(redirect_uri.split("?")[1]);
    if (process.env.NODE_ENV === "development") {
      this.state = null;
      this._code = parsedUrl.code as string;
    } else {
      if (this.state === null) throw "You didn't set state";
      if (parsedUrl.state === this.state) {
        this.state = null;
        this._code = parsedUrl.code as string;
      } else {
        this.state = null;
        throw `Wrong state: ${parsedUrl.state}`;
      }
    }
  }

  get code() {
    if (this._code === null) throw "Not get the code from wechat server!";
    const code = this._code;
    this._code = null;
    return code;
  }
}

export class 微信公众号登录Service extends 微信登录Service {
  constructor(appid: string, scope: Scope) {
    super(appid, scope);
  }
  get authUrl() {
    if (this.appid === null) throw "appid must not be null";
    if (this.redirect_uri === null) throw "redirect uri must not be null";
    this.state = 微信公众号登录Service.makeState();
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appid}&redirect_uri=${this.redirect_uri}&response_type=code&scope=${this.scope}&state=${this.state}#wechat_redirect`;
  }
}

export class 微信开放平台登录Service extends 微信登录Service {
  constructor(appid: string, scope: Scope) {
    super(appid, scope);
  }
  get authUrl() {
    if (this.appid === null) throw "appid must not be null";
    if (this.redirect_uri === null) throw "redirect uri must not be null";
    this.state = 微信公众号登录Service.makeState();
    return `https://open.weixin.qq.com/connect/qrconnect?appid=${this.appid}&scope=${this.scope}&redirect_uri=${this.redirect_uri}&state=${this.state}&login_type=jssdk&self_redirect=default&styletype=&sizetype=&bgcolor=&rst=&style=white`;
  }
}
