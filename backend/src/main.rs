use axum::{routing::get, Router, Json};
use serde::Serialize;
use sqlx::PgPool;
use std::net::SocketAddr;

#[derive(Serialize)]
struct Message {
    text: String,
}

async fn hello() -> Json<Message> {
    Json(Message { text: "Olá do backend Rust!".to_string() })
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    // Conectar ao Postgres
    let pool = PgPool::connect(&std::env::var("DATABASE_URL").unwrap()).await?;

    let app = Router::new().route("/api/hello", get(hello));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Servidor Rust em http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();

    Ok(())
}

dotenvy::dotenv().ok();
println!("DATABASE_URL = {:?}", std::env::var("DATABASE_URL"));
