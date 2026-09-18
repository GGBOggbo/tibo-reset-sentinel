const SHOP_URL = "https://www.16688.com.cn/shop/S144406";

export default function PartnerResourceCard() {
  return (
    <section className="card partner-card partner-top-card reveal reveal-2" aria-labelledby="partner-resource-title">
      <div className="partner-copy">
        <p className="eyebrow"><span className="partner-spark" aria-hidden="true">✦</span> 精选资源 / PARTNER RESOURCE</p>
        <h2 id="partner-resource-title">All in ai</h2>
        <p className="partner-description">GPT Plus 订阅相关服务 · 进入平台查看商品与完整条款</p>
        <p className="partner-disclosure">第三方资源 · 与 OpenAI 无隶属关系 · 请在平台内自行核验商品信息</p>
      </div>
      <a className="partner-btn" href={SHOP_URL} target="_blank" rel="noopener noreferrer">
        <span className="partner-new">NEW</span>
        <span className="partner-btn-copy">
          <strong>精选资源</strong>
          <small>查看 All in ai 店铺</small>
        </span>
        <span className="partner-arrow" aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
