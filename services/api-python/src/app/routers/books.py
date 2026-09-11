from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/books", tags=["books"])

class Book(BaseModel):
    id: int
    title: str
    author: str
    category: str
    price: str
    old_price: str = Field(default="", alias="oldPrice")
    color: str
    tag: str
    cover: str
    source: Literal["local"] = "local"


class MarketApi(BaseModel):
    id: str
    name: str
    endpoint: str
    docs: str
    cloud: str
    access: str


BOOKS: tuple[Book, ...] = (
    Book(id=1, title="O mapa das pequenas coisas", author="Ana Pessoa", category="Literatura", price="€14,90", oldPrice="€18,50", color="coral", tag="Mais vendido", cover="MP"),
    Book(id=2, title="O mundo em que vivemos", author="David Attenborough", category="Ciência", price="€21,90", color="ocean", tag="Escolha MultiThings", cover="MV"),
    Book(id=3, title="Hábitos atómicos", author="James Clear", category="Desenvolvimento", price="€17,45", oldPrice="€19,90", color="sun", tag="Oferta", cover="HA"),
    Book(id=4, title="A biblioteca da meia-noite", author="Matt Haig", category="Ficção", price="€16,80", color="plum", tag="Livro do mês", cover="BM"),
    Book(id=5, title="O pequeno príncipe", author="Antoine de Saint-Exupéry", category="Infantil", price="€9,90", color="sky", tag="Clássico", cover="PP"),
    Book(id=6, title="Cozinha de uma panela", author="Marta B. Santos", category="Casa", price="€24,50", oldPrice="€29,90", color="leaf", tag="Novidade", cover="CP"),
)

MARKET_APIS: tuple[MarketApi, ...] = (
    MarketApi(
        id="books-catalog",
        name="MultiThings Books Catalog API",
        endpoint="/api/books/catalog",
        docs="/api/books/docs/catalog",
        cloud="AWS-compatible local gateway",
        access="Digital catalog licensing, local only, no third-party user accounts",
    ),
    MarketApi(
        id="books-trading",
        name="Books Trading API",
        endpoint="/api/books/trading/markets",
        docs="/api/books/docs/trading",
        cloud="Secure cloud-ready boundary",
        access="Profitable digital trading scope with legal local SDK use",
    ),
)


@router.get("/catalog")
def catalog() -> dict[str, object]:
    return {
        "brand": "MultiThings books",
        "books": [book.model_dump(by_alias=True) for book in BOOKS],
    }


@router.get("/market")
def market() -> dict[str, object]:
    return {
        "brand": "MultiThings market",
        "legal": "Mercado digital local e lucrativo, sem acesso a contas de utilizadores de terceiros e dentro dos termos legais aplicáveis.",
        "apis": [api.model_dump() for api in MARKET_APIS],
    }


@router.get("/docs/{topic}")
def docs(topic: Literal["catalog", "trading"]) -> dict[str, object]:
    docs_by_topic = {
        "catalog": {
            "title": "Catalog API",
            "methods": ["GET /api/books/catalog"],
            "dataBoundary": "Dados locais do catálogo MultiThings books.",
        },
        "trading": {
            "title": "Trading API",
            "methods": ["GET /api/books/market", "GET /api/books/trading/markets"],
            "dataBoundary": "Somente metadados de mercado e documentação local; sem credenciais ou contas externas.",
        },
    }
    return docs_by_topic[topic]


@router.get("/trading/markets")
def trading_markets() -> dict[str, object]:
    return {
        "markets": [
            {"id": "publisher-direct", "name": "Publisher Direct", "status": "available", "settlement": "local"},
            {"id": "reader-exchange", "name": "Reader Exchange", "status": "available", "settlement": "local"},
        ],
    }