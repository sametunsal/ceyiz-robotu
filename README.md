# Çeyiz Robotu

**AI destekli ev dizme asistanı** — çeyiz alışverişini adım adım planla: bütçeni yönet, koltuk stiline göre halı ve mobilyayı filtrele, renk uyumunu robot önerileriyle güçlendir ve kombinasyonunu tek ekranda özetle.

## Öne çıkanlar

- **4 adımlı sihirbaz:** Koltuk → Halı → Yemek masası → Aydınlatma  
- **Bütçe paneli:** Anlık harcama, kalan tutar ve görsel ilerleme çubuğu  
- **Akıllı filtreleme:** Koltuk stiline göre (Modern / Klasik / Nötr / Zamansız) liste; veri daralırsa nötr renk ve tam kategori fallback’i  
- **Renk uyumu:** Koltuk rengine göre “Robotun Önerisi” rozetleri  
- **Özet & paylaşım:** Harcama dağılımı, AI iç mimar yorumu, stil puanı, kombinasyon kodu, panoya kopyala  
- **Konfeti & mikro etkileşimler:** Tamamlayınca kutlama animasyonu  
- **Mobil uyum:** Sticky bütçe alanı, dokunmatik dostu kontroller, alt önizleme şeridi  

## Teknolojiler

React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide React, `canvas-confetti`.

## Geliştirme

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
npm run preview
```

Ürün verisini yeniden üretmek için:

```bash
node scripts/generate-products.mjs
```

## Yayına alma

### Vercel

1. Repo’yu bağla — **Framework Preset: Vite** (çoğu zaman otomatik).  
2. Build: `npm run build` — çıktı klasörü: `dist`.  
3. Ekstra `vercel.json` gerekmez; tek sayfa uygulaması kökten servis edilir.

### Netlify

1. Build command: `npm run build` — publish directory: `dist`.  
2. `public/_redirects` dosyası SPA yönlendirmesi için `/* → /index.html` kuralını içerir.

## Lisans

Özel proje — kullanım koşullarını repoyu sahibiyle netleştirin.
