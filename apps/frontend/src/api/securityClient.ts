const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? "http://localhost:8000";

export interface SecurityAnalysis {
  target: string;
  kind: "file" | "url" | "command";
  score: number;
  risk: "Baixo" | "Medio" | "Alto";
  action: "Permitir" | "Rever" | "Bloquear" | "Quarentenar";
  indicators: string[];
  providers: string[];
}

export interface NpmFinding {
  dependency: string;
  version: string;
  severity: "Baixo" | "Medio" | "Alto";
  signal: string;
  recommendation: string;
}

export interface NpmSecurityAnalysis {
  package_name: string;
  score: number;
  risk: "Baixo" | "Medio" | "Alto";
  dependencies_checked: number;
  findings: NpmFinding[];
  summary: string;
  providers: string[];
}

export async function analyzeSecurity(target: string, kind: SecurityAnalysis["kind"] = "file"): Promise<SecurityAnalysis> {
  const response = await fetch(`${API_BASE}/api/security/analyze`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, kind }),
  });
  if (!response.ok) throw new Error(`Falha na análise de segurança (${response.status})`);
  return response.json() as Promise<SecurityAnalysis>;
}

export async function analyzeNpmSecurity(packageName: string, packageJson: Record<string, unknown>): Promise<NpmSecurityAnalysis> {
  const response = await fetch(`${API_BASE}/api/security/npm/analyze`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_name: packageName, package_json: packageJson }),
  });
  if (!response.ok) throw new Error(`Falha na auditoria npm (${response.status})`);
  return response.json() as Promise<NpmSecurityAnalysis>;
}