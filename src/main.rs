#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    // Exemplo: valores vindos de ficheiro .env.enc ou outra fonte
    let ciphertext: Vec<u8> = vec![/* bytes encriptados */];
    let key: [u8; 32] = [/* chave AES */];
    let nonce: [u8; 12] = [/* nonce */];

    let db_url = decrypt_env(&ciphertext, &key, &nonce);

    std::env::set_var("DATABASE_URL", db_url);

    let pool = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;

    // resto do código...
    Ok(())
}

