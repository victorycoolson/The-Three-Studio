# SULOOK Neo — Reklam V4.1 (dikey 9:16, 40 sn)

**Çıktı:** `../output/SULOOK_Neo_Reklam_V4.1_9x16.mp4` (önceki sürüm: `SULOOK_Neo_Reklam_V4_9x16.mp4`) — 1080×1920, 30 fps (60 fps render + hareket bulanıklığı), H.264, AAC, −14 LUFS, 40 sn.

V3 ile aynı veri ve görseller (kampanya renderı, şeffaf anahtar animasyonu, perde videosu, site haritası/sokak sahnesi), **farklı kurgu**: 120 BPM; anlatım Outfit, vurgu kelimeleri Lemon Milk / Instrument Serif italik; geçişler markanın −π/7 eğik bıçağıyla.

| Zaman | Bölüm | İçerik |
|---|---|---|
| 0–2 | Kanca | Anahtar karanlıkta döner: "Bu anahtar / neyi **açıyor?**" |
| 2–4 | Perde | Örtülü makine: "Bir dükkânı değil. / Bir ofisi değil. / **Kendi işini.**" |
| 4–6 | Açılış (drop 1) | Dev **NEO.** harflerinin önünde ürün döner; "*Akıllı* su dolum otomatı" |
| 6–9,9 | Ağ | Tam ekran harita, noktalar vuruşla düşer; kamera geri çekilir, her şey bir telefonun içindedir: "Hepsini telefonundan yönet." |
| 9,9–12,5 | Sokak | Dokunma → tam ekran sokak; ödemeler, sikkeler: "Kendi kendine satar, sen kazanırsın." |
| 12,5–14 | 7/24 | Saat halkası: "Sen uyurken bile kazanmaya devam." |
| 14–20 | Ürün tanıtımı (V3) | "Yenilenen yüzüyle SULOOK Neo." · 1330 GPD · 160 L; damacana kabine girer; LED, 1330 GPD, kartlı ödeme, dolum kabini (Açık→Kapalı), 160 L etiketleri |
| 20–24 | Panel | Günlük dolum, filtre ömrü, depo; yığılan bildirimler |
| 24–29 | Kampanya | Yumuşak kayan kartlar: Nakliye, Kurulum, Filtre Bakımı, Call Center, Otis Bağlantı → özet liste |
| 29–31 | Lansman | "Lansman **özel fiyatı** ile" |
| 31–34 | Fiyat | 440.000 TL çizilir → **399.900 TL**, anahtarın **35. karesinde** ve **32,0 sn'deki ana müzik vurgusunda**; %0 vade · 4 ay taksit |
| 34–40 | Son kart | Logo üstte, anahtar ortada; "Anahtar teslim 399.900 TL ile pasif gelir sistemini başlat." + kampanya bandı + su-look.com |

Gelir/panel rakamlarının göründüğü sahnelerde "Temsili örnek veridir." notu bulunur.

## Üretim
```bash
./build.sh                                      # tam render + ses + miks
node tools/render.mjs --stills 4.3,15.3,32.05   # tek kare önizleme
```
Zamanlama `src/main.js` içindeki `T` nesnesinde; metinler `phrase()` / `emph()` çağrılarında, ürün kare haritası `PROD_A` / `PROD_B` dizilerinde.

## V4.1 revizesi
- Vuran (scale + blur) yazı girişleri kaldırıldı: anlatım satırları kelime kelime maskenin altından yumuşakça yükselir (Outfit).
- Vurgu kelimeleri harf harf yazılır, ardından kısa bir font geçişiyle (Instrument Serif italik → Outfit 800 → hedef) Lemon Milk ya da serif italiğe oturur; geçişte üç küçük tık, oturuşta yumuşak pop.
- Ritimle zoom ve ekran sarsıntısı kapatıldı; yalnızca fiyat sahnesinden itibaren geri gelir.
- Açılış alt yazısı: **"Akıllı su dolum otomatı"**.
- 14–20 sn: V3'ün ürün tanıtımı (Yenilenen yüzüyle SULOOK Neo., 1330 GPD · 160 L, LED / GPD / kartlı ödeme / dolum kabini / depo etiketleri).
- Kampanya kartları vuruş başına kesme yerine yumuşak kayan karusel.
- "Peki tüm bunlar kaça?" yerine **"Lansman özel fiyatı ile"**.
- Anahtar animasyonu önce akmaya başlar, opaklığı akarken açılır (0,65 sn). Outro değiştirilmedi.
- Ek yazı tipi: Instrument Serif Italic (SIL OFL, `src/fonts/InstrumentSerif-OFL.txt`).
