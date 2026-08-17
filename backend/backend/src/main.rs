use axum::{routing::get, Router, Json};
use serde::Serialize;

#[derive(Serialize)]
struct Message {
    text: String,
}

async fn hello() -> Json<Message> {
    Json(Message { text: "Olá do backend Rust!".to_string() })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/api/hello", get(hello));
    println!("Servidor Rust em http://127.0.0.1:3000");
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

