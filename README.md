# 🏠 Çeyiz Robotu

Çeyiz Robotu, çeyiz alışverişini kolaylaştıran bir web uygulamasıdır. Koltuk, Halı, Perde, Sehpa, Yemek Masası ve Aydınlatma kategorilerinde ürünleri filtreleyerek, karşılaştırarak ve bütçenize göre planlayarak çeyiz listenizi oluşturabilirsiniz.

## 📁 Proje Yapısı

```
ceyiz-robotu/
├── urunler.json        # 100 adet mock ürün veritabanı
├── generate_db.py      # Veritabanı oluşturucu script
└── README.md           # Proje dokümantasyonu
```

## 📊 Veritabanı İçeriği

- **100 adet** sahte (mock) ürün
- **6 Kategori:** Koltuk, Halı, Perde, Sehpa, Yemek Masası, Aydınlatma
- **3 Stil:** Modern, Klasik, Minimalist
- **Fiyat Aralığı:** 3.000 TL - 50.000 TL
- Her ürünün özellikleri:
  - `id` - Benzersiz ürün ID'si
  - `kategori` - Ürün kategorisi
  - `ad` - Ürün adı (Marka + Ürün tipi)
  - `marka` - Ürün markası
  - `fiyat` - Fiyat (TL)
  - `renk` - HEX kodu ve renk adı
  - `stil` - Modern / Klasik / Minimalist
  - `gorsel_url` - picsum.photos görsel linki

## 🚀 Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/KULLANICI_ADINIZ/ceyiz-robotu.git
cd ceyiz-robotu

# Veritabanını yeniden oluşturmak isterseniz
python generate_db.py
```

## 🛠️ Kullanılan Teknolojiler

- Python 3 (veritabanı oluşturucu)
- JSON (veri depolama)

## 📌 Durum

🔴 **1. Adım tamamlandı** - Veritabanı ve altyapı oluşturuldu.

---

*Bu proje çeyiz planlamasını dijitalleştirmek amacıyla geliştirilmektedir.*
