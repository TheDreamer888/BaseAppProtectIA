import { useState } from "react";
import "./PortalTab.css";

type PortalSection = "mercado" | "noticias" | "loja";
type NewsFeed = "xtb" | "tecnologia" | "manha";

type Instrument = { symbol: string; name: string; price: string; change: number };

const instruments: Instrument[] = [
  { symbol: "US500", name: "S&P 500", price: "5 842,10", change: 0.42 },
  { symbol: "EURUSD", name: "Euro / Dólar", price: "1,0873", change: -0.11 },
  { symbol: "XAUUSD", name: "Ouro", price: "2 634,50", change: 0.87 },
  { symbol: "BTCUSD", name: "Bitcoin", price: "94 210", change: 1.35 },
  { symbol: "GER40", name: "DAX 40", price: "19 320", change: -0.28 },
];

const newsFeeds: Record<NewsFeed, { label: string; items: { title: string; time: string }[] }> = {
  xtb: {
    label: "Notícias XTB",
    items: [
      { title: "Sessão europeia abre mista com foco nos bancos centrais", time: "07:12" },
      { title: "Petróleo recua antes dos dados de inventários", time: "06:48" },
      { title: "XTB atualiza condições de negociação em índices", time: "06:20" },
    ],
  },
  tecnologia: {
    label: "Tecnologia",
    items: [
      { title: "Novo chip promete mais eficiência energética em servidores", time: "08:05" },
      { title: "Atualização de segurança corrige falhas críticas em navegadores", time: "07:40" },
      { title: "Fedora lança nova versão com foco em estabilidade", time: "07:02" },
    ],
  },
  manha: {
    label: "Notícias da manhã",
    items: [
      { title: "Resumo: os destaques que precisas de saber hoje", time: "06:00" },
      { title: "Previsão do tempo e trânsito nas principais cidades", time: "06:10" },
      { title: "Agenda económica do dia", time: "06:15" },
    ],
  },
};

type StoreCategory = { id: string; name: string; detail: string; status: "disponivel" | "brevemente" };

const storeCategories: StoreCategory[] = [
  { id: "apps", name: "Aplicações e planos", detail: "Subscrições AuryonSafe e extensões de proteção.", status: "disponivel" },
  { id: "fastfood", name: "Restauração (parceiros)", detail: "Pedidos através de parceiros de entrega, sem comissão extra.", status: "brevemente" },
  { id: "cursos", name: "Cursos e escolas", detail: "Formação técnica e certificações ligadas à área de Educação.", status: "brevemente" },
  { id: "mapas", name: "Mapas e rotas", detail: "Localização e trânsito em tempo real.", status: "brevemente" },
];

/** Portal com mercado/trading, notícias e loja. Dados de mercado/loja são de exemplo
 *  até existirem credenciais reais para as APIs externas (XTB, mapas, parceiros). */
export default function PortalTab() {
  const [section, setSection] = useState<PortalSection>("mercado");
  const [feed, setFeed] = useState<NewsFeed>("xtb");
  const activeFeed = newsFeeds[feed];

  return (
    <section className="portal-app">
      <header className="portal-header">
        <div>
          <p className="eyebrow">AuryonSafe Portal</p>
          <h1>Mercado, notícias e loja num só lugar</h1>
          <p>Organizado por secções, sem simulações escondidas: cada bloco indica se usa dados reais ou de exemplo.</p>
        </div>
      </header>

      <nav className="portal-nav" aria-label="Secções do portal">
        <button type="button" className={section === "mercado" ? "active" : ""} onClick={() => setSection("mercado")}>Mercado</button>
        <button type="button" className={section === "noticias" ? "active" : ""} onClick={() => setSection("noticias")}>Notícias</button>
        <button type="button" className={section === "loja" ? "active" : ""} onClick={() => setSection("loja")}>Loja</button>
      </nav>

      {section === "mercado" && (
        <section className="portal-panel" aria-label="Mercado e trading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Trading</p>
              <h2>Cotações em destaque</h2>
            </div>
            <span className="portal-badge pending">Dados de exemplo · ligação à API da XTB pendente de credenciais</span>
          </div>
          <div className="instrument-table">
            <div className="table-head"><span>Instrumento</span><span>Preço</span><span>Variação</span></div>
            {instruments.map((item) => (
              <div className="table-row" key={item.symbol}>
                <div><strong>{item.symbol}</strong><span>{item.name}</span></div>
                <span>{item.price}</span>
                <span className={item.change >= 0 ? "change up" : "change down"}>
                  {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "noticias" && (
        <section className="portal-panel" aria-label="Notícias">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Atualidade</p>
              <h2>Notícias organizadas por tema</h2>
            </div>
          </div>
          <div className="news-tabs" role="tablist" aria-label="Temas de notícias">
            {(Object.keys(newsFeeds) as NewsFeed[]).map((key) => (
              <button key={key} type="button" role="tab" aria-selected={feed === key} className={feed === key ? "active" : ""} onClick={() => setFeed(key)}>
                {newsFeeds[key].label}
              </button>
            ))}
          </div>
          <ul className="news-list">
            {activeFeed.items.map((item) => (
              <li key={item.title}><time>{item.time}</time><span>{item.title}</span></li>
            ))}
          </ul>
        </section>
      )}

      {section === "loja" && (
        <section className="portal-panel" aria-label="Loja">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Loja</p>
              <h2>Catálogo por categoria</h2>
            </div>
          </div>
          <div className="store-grid">
            {storeCategories.map((cat) => (
              <article className="store-card" key={cat.id}>
                <div className="store-card-head">
                  <strong>{cat.name}</strong>
                  <span className={cat.status === "disponivel" ? "portal-badge ok" : "portal-badge pending"}>
                    {cat.status === "disponivel" ? "Disponível" : "Brevemente"}
                  </span>
                </div>
                <p>{cat.detail}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
