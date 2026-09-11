import { useEffect, useState } from "react";
import { analyzeNpmSecurity, type NpmSecurityAnalysis } from "../api/securityClient";
import { authClient, type SessionUser } from "../auth/authClient";
import "./NpmGuardTab.css";

type AuditStatus = "ready" | "loading" | "online" | "error" | "authentication";

const exampleManifest = JSON.stringify({
  name: "loja-segura",
  version: "1.0.0",
  scripts: { build: "vite build", postinstall: "node scripts/check.js" },
  dependencies: { react: "^19.2.8", "shared-utils": "github:equipa/shared-utils" },
  devDependencies: { vite: "latest" },
}, null, 2);

type Props = { onOpenAccount: () => void; onReturn: () => void };

export default function NpmGuardTab({ onOpenAccount, onReturn }: Props) {
  const [manifest, setManifest] = useState("");
  const [status, setStatus] = useState<AuditStatus>("ready");
  const [notice, setNotice] = useState("Inicie sessão para enviar um manifesto para análise.");
  const [analysis, setAnalysis] = useState<NpmSecurityAnalysis | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(setSession).finally(() => setSessionLoading(false));
  }, []);

  const auditManifest = async () => {
    if (!session) {
      setStatus("authentication");
      setNotice("Inicie sessão para analisar manifestos no seu espaço de trabalho.");
      return;
    }
    let packageJson: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(manifest);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      packageJson = parsed as Record<string, unknown>;
    } catch {
      setStatus("error");
      setNotice("O manifesto precisa de ser um objeto JSON válido.");
      return;
    }

    const packageName = typeof packageJson["name"] === "string" ? packageJson["name"].trim() : "";
    if (!packageName) {
      setStatus("error");
      setNotice("Indique o campo \"name\" do pacote antes de analisar.");
      return;
    }

    setStatus("loading");
    setNotice("A IA de risco está a analisar dependências e scripts...");
    try {
      const result = await analyzeNpmSecurity(packageName, packageJson);
      setAnalysis(result);
      setStatus("online");
      setNotice("Relatório concluído pela API de segurança.");
    } catch (error) {
      setAnalysis(null);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("(401)")) {
        setStatus("authentication");
        setNotice("Inicie sessão para analisar manifestos no seu espaço de trabalho.");
      } else {
        setStatus("error");
        setNotice("A API de segurança não está disponível. Nenhum manifesto foi enviado para terceiros.");
      }
    }
  };

  return <main className="npm-guard-app">
    <header className="npm-guard-header">
      <div><p className="eyebrow">Aegis NPM Guard</p><h1>Segurança de dependências com IA explicável</h1><p>Detete origens fora do registo, versões instáveis e scripts de instalação antes do deploy.</p></div>
      <div className="npm-header-actions"><button className="npm-quiet-button" type="button" onClick={onReturn}>Central</button><button className="npm-account-button" type="button" onClick={onOpenAccount}>Conta</button></div>
    </header>
    <section className="npm-trust-strip"><span className="npm-trust-mark">N</span><div><strong>O manifesto é analisado pela sua API Aegis.</strong><p>Esta versão não instala pacotes, não executa scripts e não consulta URLs indicados no ficheiro.</p></div><span className={`npm-status ${status}`}>{sessionLoading ? "A confirmar sessão" : status === "loading" ? "A analisar" : status === "online" ? "API ligada" : status === "authentication" ? "Sessão necessária" : status === "error" ? "API indisponível" : session ? "Sessão ativa" : "Sessão necessária"}</span></section>
    <section className="npm-audit-layout">
      {session ? <form className="npm-manifest-panel" onSubmit={(event) => { event.preventDefault(); void auditManifest(); }}>
        <div className="npm-panel-heading"><div><p className="eyebrow">Origem do projeto</p><h2>package.json</h2></div><button className="npm-example-button" type="button" onClick={() => { setManifest(exampleManifest); setAnalysis(null); setStatus("ready"); setNotice("Manifesto de exemplo carregado."); }}>Carregar exemplo</button></div>
        <label htmlFor="npm-manifest">Manifesto npm</label>
        <textarea id="npm-manifest" value={manifest} onChange={(event) => setManifest(event.target.value)} spellCheck="false" aria-describedby="npm-notice" placeholder="Cole aqui o package.json do seu projeto" />
        <div className="npm-submit-row"><p id="npm-notice" aria-live="polite">{notice}</p><button className="npm-audit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "A analisar" : "Analisar pacote"}</button></div>
      </form> : <section className="npm-manifest-panel npm-access-panel"><p className="eyebrow">Espaço protegido</p><h2>Os seus manifestos não ficam expostos</h2><p>O ficheiro e a lista de dependências são visíveis apenas na sessão da sua conta. A análise começa depois da autenticação.</p><button className="npm-audit-button" type="button" onClick={onOpenAccount} disabled={sessionLoading}>{sessionLoading ? "A confirmar sessão" : "Iniciar sessão"}</button></section>}
      <aside className="npm-results-panel" aria-live="polite">
        {session && analysis ? <><div className="npm-result-score"><div className={`npm-score ${analysis.risk.toLowerCase()}`}><strong>{analysis.score}</strong><span>/100</span></div><div><p className="eyebrow">Risco {analysis.risk}</p><h2>{analysis.package_name}</h2><p>{analysis.summary}</p></div></div><div className="npm-result-metrics"><span><b>{analysis.dependencies_checked}</b> dependências</span><span><b>{analysis.findings.length}</b> sinais</span></div><div className="npm-findings"><h3>Achados prioritários</h3>{analysis.findings.length ? analysis.findings.map((finding) => <article key={`${finding.dependency}-${finding.signal}`}><div><strong>{finding.dependency}</strong><span>{finding.version}</span></div><b className={`npm-severity ${finding.severity.toLowerCase()}`}>{finding.severity}</b><p>{finding.signal}</p><small>{finding.recommendation}</small></article>) : <div className="npm-clean-state"><strong>Sem sinais prioritários</strong><span>Continue a manter o lockfile e as revisões de dependência atualizados.</span></div>}</div></> : <div className="npm-empty-result"><span>IA</span><h2>{session ? "O relatório aparece aqui" : "Relatórios privados por conta"}</h2><p>{session ? "A análise apresenta sinais concretos e recomendações, sem classificar pacotes por reputação opaca." : "Inicie sessão para ver os seus manifestos, dependências e recomendações detalhadas."}</p>{!session && !sessionLoading && <button type="button" onClick={onOpenAccount}>Iniciar sessão</button>}</div>}
      </aside>
    </section>
  </main>;
}