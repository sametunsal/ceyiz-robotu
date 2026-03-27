#!/usr/bin/env python3
"""
Çeyiz Robotu - Sahte (Mock) Ürün Veritabanı Oluşturucu
100 adet mock ürün içeren JSON veritabanı oluşturur.
"""

import json
import random
import uuid

random.seed(42)  # Tekrarlanabilirlik için

# Kategoriler
KATEGORILER = ["Koltuk", "Halı", "Perde", "Sehpa", "Yemek Masası", "Aydınlatma"]

# Stiller
STILLER = ["Modern", "Klasik", "Minimalist"]

# Markalar (kategori bazlı)
MARKALAR = {
    "Koltuk": ["Bellona", "İstikbal", "Kelebek", "Dogtas", "Enza Home", "Kilim Mobilya"],
    "Halı": ["Karaca", "Evok", "Cappadocia", "Pierre Cardin", "Uspes Home", "Lova"],
    "Perde": ["Karaca", "Evok", "English Home", "Madame Coco", "Lova", "Uspes Home"],
    "Sehpa": ["Bellona", "Dogtas", "Kelebek", "İstikbal", "Mudo Concept", "Enza Home"],
    "Yemek Masası": ["Bellona", "İstikbal", "Dogtas", "Kelebek", "Enza Home", "World of Decor"],
    "Aydınlatma": ["Lamp 83", "Dilekci Aydınlatma", "Nils Aydınlatma", "Eva Aydınlatma", "Lampmaster", "Fosfor"],
}

# Renk paleti (HEX kodu ve Türkçe adı)
RENKLER = [
    {"hex": "#F5F5DC", "ad": "Bej"},
    {"hex": "#8B4513", "ad": "Kahverengi"},
    {"hex": "#2C3E50", "ad": "Lacivert"},
    {"hex": "#C0392B", "ad": "Bordo"},
    {"hex": "#FFFFFF", "ad": "Beyaz"},
    {"hex": "#E0E0E0", "ad": "Gümüş"},
    {"hex": "#1A1A2E", "ad": "Siyah"},
    {"hex": "#D4A574", "ad": "Meşe"},
    {"hex": "#F0E68C", "ad": "Krem"},
    {"hex": "#556B2F", "ad": "Zeytin Yeşili"},
    {"hex": "#DEB887", "ad": "Ceviz"},
    {"hex": "#708090", "ad": "Gri"},
    {"hex": "#FFD700", "ad": "Altın"},
    {"hex": "#800020", "ad": "Vişne"},
    {"hex": "#4682B4", "ad": "Çelik Mavi"},
    {"hex": "#F5DEB3", "ad": "Buğday"},
    {"hex": "#A0522D", "ad": "Sienna"},
    {"hex": "#E8D5B7", "ad": "Fildişi"},
    {"hex": "#2F4F4F", "ad": "Koyu Yeşil"},
    {"hex": "#B8860B", "ad": "Koyu Altın"},
]

# Ürün ad şablonları (kategori bazlı)
URUN_ADLARI = {
    "Koltuk": [
        "3'lü Koltuk Takımı", "Köşe Koltuk", "L Koltuk", "Chesterfield Koltuk",
        "Berjer Koltuk", "Tekli Koltuk", "İkili Koltuk", "U Koltuk Takımı",
        "Açılır Koltuk", "Divan Koltuk", "Kanepe", "Puf Koltuk",
        "Dinlenme Koltuğu", "TV Koltuğu", "Zigon Koltuk", "Büyük Boy Köşe Koltuk",
        "Modüler Koltuk", "Yataklı Koltuk", "Klasik Koltuk Takımı", "Modern Chesterfield"
    ],
    "Halı": [
        "Yün Halı", "Makine Halısı", "Dokuma Halı", "Shaggy Halı",
        "Patchwork Halı", "Vintage Halı", "Modern Desenli Halı", "Geometrik Halı",
        "Yuvarlak Halı", "İpek Görünümlü Halı", "Kilim", "Banyo Halısı",
        "Yolluk Halı", "Oturma Odası Halısı", "Salon Halısı", "Çocuk Odası Halısı",
        "Post Görünümlü Halı", "İskandinav Halı", "Bohem Halı", "Ekose Desen Halı"
    ],
    "Perde": [
        "Tül Perde", "Stor Perde", "Zebra Perde", "Keten Perde",
        "Kadife Perde", "İpek Perde", "Blackout Perde", "Güneşlik Perde",
        "Katlamalı Perde", "Roma Perdesi", "Dikey Perde", "Jaluzi Perde",
        "Taşlı Tül Perde", "Brode Tül Perde", "Düz Renk Perde", "Çizgili Perde",
        "Çift Katlı Perde", "Mutfak Perdesi", "Bebek Odası Perdesi", "Stor Tül Perde"
    ],
    "Sehpa": [
        "Orta Sehpa", "Yan Sehpa", "TV Sehpa Ünitesi", "Konsol Sehpa",
        "Yuvarlak Sehpa", "Katlanır Sehpa", "Mermer Sehpa", "Cam Sehpa",
        "Ahşap Sehpa", "Metal Sehpa", "Liftli Sehpa", "Salon Sehpa Takımı",
        "Zigon Sehpa", "İskandinav Sehpa", "Endüstriyel Sehpa", "Açılır Sehpa",
        "Sarkaç Sehpa", "C Sehpa", "Fiber Sehpa", "Masaüstü Sehpa"
    ],
    "Yemek Masası": [
        "6 Kişilik Yemek Masası", "8 Kişilik Yemek Masası", "4 Kişilik Yemek Masası",
        "10 Kişilik Yemek Masası", "Açılır Yemek Masası", "Yuvarlak Yemek Masası",
        "Kare Yemek Masası", "Uzun Yemek Masası", "Katlanır Yemek Masası",
        "Sabit Yemek Masası", "Mutfak Masası", "Bar Masası",
        "Konsol Masa", "Bahçe Yemek Masası", "İskandinav Yemek Masası",
        "Endüstriyel Yemek Masası", "Mermer Yemek Masası", "Ahşap Yemek Masası",
        "Cam Yemek Masası", "Metal Ayaklı Yemek Masası"
    ],
    "Aydınlatma": [
        "Avize", "Sarkıt Lamba", "Masa Lambası", "Abajur",
        "Duvar Lambası", "Aplik", "Sarkıt Avize", "Kristal Avize",
        "Modern Avize", "Klasik Avize", "LED Şerit", "Spot Lamba",
        "Gece Lambası", "Okuma Lambası", "Zemin Lambası", "Tavan Lambası",
        "Sarkıt Takımı", "El Yapımı Avize", "Ahşap Sarkıt", "Metal Sarkıt"
    ],
}


def generate_product(product_id: int) -> dict:
    """Tek bir ürün oluşturur."""
    kategori = random.choice(KATEGORILER)
    stil = random.choice(STILLER)
    marka = random.choice(MARKALAR[kategori])
    renk = random.choice(RENKLER)
    ad = random.choice(URUN_ADLARI[kategori])

    # Fiyat: 3.000 - 50.000 TL arası, kategoriye göre ağırlıklı
    fiyat_alt = 3000
    fiyat_ust = 50000

    if kategori == "Koltuk":
        fiyat_alt = 8000
        fiyat_ust = 50000
    elif kategori == "Halı":
        fiyat_alt = 3000
        fiyat_ust = 25000
    elif kategori == "Perde":
        fiyat_alt = 3000
        fiyat_ust = 15000
    elif kategori == "Sehpa":
        fiyat_alt = 3000
        fiyat_ust = 20000
    elif kategori == "Yemek Masası":
        fiyat_alt = 5000
        fiyat_ust = 40000
    elif kategori == "Aydınlatma":
        fiyat_alt = 3000
        fiyat_ust = 20000

    fiyat = random.randint(fiyat_alt // 100, fiyat_ust // 100) * 100

    # Benzersiz görsel URL'si (picsum.photos)
    gorsel_id = random.randint(1, 1000)
    gorsel_url = f"https://picsum.photos/seed/{product_id}/{gorsel_id}/600/600"

    return {
        "id": product_id,
        "kategori": kategori,
        "ad": f"{marka} {ad}",
        "marka": marka,
        "fiyat": fiyat,
        "renk": {
            "hex": renk["hex"],
            "ad": renk["ad"],
        },
        "stil": stil,
        "gorsel_url": gorsel_url,
    }


def main():
    """100 adet mock ürün oluşturur ve JSON dosyasına kaydeder."""
    products = [generate_product(i + 1) for i in range(100)]

    # Kategori dağılımını göster
    kategori_sayilari = {}
    for p in products:
        kategori_sayilari[p["kategori"]] = kategori_sayilari.get(p["kategori"], 0) + 1

    print("Kategori Dağılımı:")
    for k, v in sorted(kategori_sayilari.items()):
        print(f"  {k}: {v} ürün")

    # JSON dosyasına kaydet
    with open("urunler.json", "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n[TAMAM] {len(products)} adet urun basariyla 'urunler.json' dosyasina kaydedildi!")


if __name__ == "__main__":
    main()
