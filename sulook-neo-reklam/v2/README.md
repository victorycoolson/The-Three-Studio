# SULOOK Neo — Reklam V2 (dikey 9:16)

**Çıktı:** `../output/SULOOK_Neo_Reklam_V2_9x16.mp4` — 1080×1920, 30 fps (60 fps render + hareket bulanıklığı), H.264 yüksek kalite, AAC, −14 LUFS, ≈29,9 sn.

V1'den farkı: sahneler artık **su-look.com'un kendi kaynaklarıyla** (`victorycoolson/sulook-website`, v1.3.14) kuruldu.

| Sahne | Kaynak |
|---|---|
| Harita | `city-map-v27.png` (temiz şehir plakası), `sulook-point-v28.png` pinleri, `hub-face-v33.png` merkez, sitedeki nokta adları (Mahalle Marketi, Yaşam Sitesi, Meydan, İş Merkezi, Köşe Kafe, Zincir Market, Sahil Sitesi), `network-story.js` bağlantı eğrileri/paketleri |
| Sokak | `street-extended.webp` + `street-shadow.webp` plakaları, `neo-product.webp`, yürüyüş/servis/ödeme-kolu sprite atlası ve sitenin `stop-motion.js` çizim rutinleri; özel koreografi: 1. müşteri kartla öder → kapak açılır → damacanasını alıp gider, 2. müşteri sıradan ilerler → şişeyi koyar → kapak kapanır → öder |
| Ürün | `shared/sequences-v115/neo` (50 kare, 4K kaynaklı portre): ürün dönerek gelir, damacana kabine girer; site gibi 16:9 kaynak penceresi (`source`) ve kabin oklüzyon poligonlarıyla çizilir |
| Kapak | 30. karedeki gerçek kabin kapağı, homografiyle 50. kareye oturtulup kaydırılır |
| Teknoloji | `shared/sequences-v115/filter` (60 kare) arıtma ara sahnesi |
| Filigran | Sitenin `sequence-renderer.js` algoritması: Lemon Milk Bold "SULOOK NEO", −π/7 eğik satırlar, her satır kendi hız/yönünde kayar, ürünün arkasından geçer |
| Tipografi/renk | Outfit (₺ için Lexend), `sulook-renk-paleti.css`, `logo.png` (SULOOK neo) |

## Brief değişiklikleri (V2)
- "ne o" altında dev soru işareti; harita, soru işaretinin noktasından açılır.
- "Peki ürün ne?" yerine **"Yenilenen yüzüyle"**, arkasında kayan SULOOK NEO filigranı.
- Para sesleri yumuşatıldı (düşük perde, yuvarlak, kısa, düşük seviye).
- Anahtar videosu baştan sona (250 kare) kullanıldı; karanlığa kapanan iris geçişiyle girer, fiyat bloğu üzerinde kalır, kamera geri çekilince son karta yerleşir.
- Ürün üzerindeki fiyat etiketi görünebilir (onaylandı).

## Üretim
```bash
./build.sh                                   # tam render + ses + miks
node tools/render.mjs --stills 2.4,12.3,25   # tek kare önizleme
```
Zamanlama `src/main.js` içindeki `T` nesnesinde. Tarayıcıda `src/index.html` açıp konsolda `seek(12.3)` ile herhangi bir an incelenebilir.
