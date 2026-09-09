use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;
use sqlx::PgPool;
use std::net::SocketAddr;
use std::sync::Arc;

#[derive(Serialize)]
struct Message {
    text: String,
}

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

async fn hello() -> Json<Message> {
    Json(Message { text: "Olá do backend Rust!".to_string() })
}

/// Liveness/readiness probe — confirma que a ligação à base de dados está viva.
async fn health(State(state): State<Arc<AppState>>) -> (StatusCode, Json<serde_json::Value>) {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "status": "healthy" }))),
        Err(e) => {
            tracing::error!(error = %e, "health check falhou: base de dados indisponível");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "status": "unhealthy" })),
            )
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL não definida");
    let pool = PgPool::connect(&database_url).await?;
    let state = Arc::new(AppState { db: pool });

    let app = Router::new()
        .route("/api/hello", get(hello))
        .route("/health", get(health))
        .with_state(state);

    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Servidor Rust em http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.expect("falha ao vincular porta");
    axum::serve(listener, app).await.expect("erro no servidor");

    Ok(())
}

