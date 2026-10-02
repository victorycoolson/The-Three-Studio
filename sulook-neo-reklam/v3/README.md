# SULOOK Neo — Reklam V3 (dikey 9:16)

**Çıktı:** `../output/SULOOK_Neo_Reklam_V3_9x16.mp4` — 1080×1920, 30 fps (60 fps render + hareket bulanıklığı), H.264 yüksek kalite, AAC, −14 LUFS, ≈29 sn.

V3, `victorycoolson/sulook-website` deposundaki `PNG-Kampanyalar/` renderlarıyla kuruldu:

| Kaynak | Kullanım |
|---|---|
| `SulookNeo_PNG_Kampanya/Kampanya-1-0015…0150.png` (şeffaf) | Ürün sahnesi: ürün döner, kapak açılır, damacana girer, kapak kapanır, kamera geri çekilir. Arkasında sitenin heroshot zemini (`App_Data/panel/heroshot.css`: `#073775 → #06448a → #062a60` + `#007abe` ışık) ve kayan SULOOK NEO filigranı. Kaide alttan zemine eritilir. |
| `Anahtar Teslim PNG/AnahtarTeslim-0001…0250.png` (şeffaf) | Fiyat + kapanış: anahtar gece laciverti zeminde, arkasında takip eden mavi ışık, süzülen ışık zerreleri ve filigranla akar. |

## Brief değişiklikleri (V3)
- **Yeni fiyat, anahtar animasyonunun tam 35. karesinde girer** (`T.newPrice = T.key + 34/30`). Müzikteki ana vurgu (impact + akor + groove dönüşü) aynı ana kilitli; trampet rulosu ve riser bu kareye doğru yükselir. Eski fiyat 8. karede gelir, çizgi 22. karede atılır.
- Filtre/arıtma sekansı kaldırıldı.
- "ne o ?" yazısı ve dev soru işareti, heroshot'taki **"Neo."** kesimiyle (Outfit 400, `#7dd3fc`) yazıldı.
- Telefon bildirimleri yeniden tasarlandı: büyük, beyaz kartlar, SULOOK uygulama ikonu, renk kodlu kategori etiketi ve sağda değer çipi (₺6.720 / %100 / Yarın); en yenisi üstten düşer, eskiler aşağı kayar.
- Özellik etiketleri sitenin "signal-tag" diliyle (koyu mavi cam hap) yeniden çizildi; çizgiler render karesinde izlenen noktalara (homografi izleri, `assets/seq/kampanya/tracks.json`) bağlı. LED aç/kapa gerçek LED şeridi üzerinde, kabin durumu renderdaki kapakla eşzamanlı (Açık → Kapalı).
- Yeni ara sahne: **"7/24 — kesintisiz satış · Sen uyurken bile kazanmaya devam."**
- Son kart: SULOOK neo logosu üstte, anahtar animasyonu ortada, fiyat + "ile pasif gelir sistemini başlat." + taksit + kampanya bandı + su-look.com altta.

## Üretim
```bash
./build.sh                                     # tam render + ses + miks
node tools/render.mjs --stills 12.7,21.7,25    # tek kare önizleme
```
Zamanlama `src/main.js` içindeki `T` nesnesinde, ürün kare haritası `PROD_MAP`'te. Tarayıcıda `src/index.html` açıp konsolda `seek(21.7)` ile herhangi bir an incelenebilir.
