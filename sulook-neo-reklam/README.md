# SULOOK Neo — Sosyal Medya Reklamı (9:16 + 4:5)

28,5 sn'lik motion graphics reklam. Hedef kitle: Sulook'u hiç tanımayan, yatırım fikri arayan kişiler.
Sırayla şu dört soruyu cevaplar: **sistem ne? → ürün ne? → teknolojisi ne? → fiyatı ne?**

| Çıktı | Boyut |
|---|---|
| `output/SULOOK_Neo_Reklam_9x16.mp4` | 1080×1920, 30 fps, H.264 + AAC (−14 LUFS) |
| `output/SULOOK_Neo_Reklam_4x5.mp4` | 1080×1350, 30 fps, H.264 + AAC (−14 LUFS) |

## Kurgu (zaman çizelgesi)

| sn | Sahne | Ne oluyor |
|---|---|---|
| 0,0–3,0 | **Hook** | Perdeli ürün videosu (rüzgârda dalgalanan örtü). Kocaman **"ne o?"**: kelimeler tek tek çarparak gelir, "?" dönerek düşer, RGB-glitch vuruşları ve kamera sarsıntısı olur, hareket hiç durmaz. |
| 2,6–3,1 | Geçiş | "o" harfinin içi bir pencereye dönüşür, kamera o deliğin içinden telefona geçer (iris). |
| 3,0–7,2 | **Sistem: harita** | Telefonun içinde "SULOOK Ağım" uygulaması: şehir haritası, rastgele aralıklarla para kazanan noktalar (coin + "+₺"), merkeze akan veri paketleri, haritaya düşen yeni noktalar (5/5 → 7/7), canlı artan Dolum/Ciro sayaçları. Tipografi: *Yeni nesil Otomat İşletmeciliği.* → *Şehrin her noktasından pasif gelir.* → *Hepsini telefonundan yönet*. |
| 6,45–7,2 | Dokunma + zoom | Bir noktaya parmakla dokunulur, kamera noktanın içine dalar. |
| 7,1–10,5 | **Neo street** | Nokta detay ekranı (sokakta otomat + sıradaki kullanıcılar). 2 ödeme olur: temassız ödeme halkaları, "Ödeme alındı" balonları, coinler Günlük Gelir kartına uçar, sayaçlar ve grafik güncellenir. Tipografi: *Kendi kendine satar, sen kazanırsın.* |
| 10,45–11,85 | **Telefona dalış** | Uygulama "Cihaz" sayfasını açar (mavi hero arayüzü). *Peki ürün ne?* Kamera telefon ekranının içine girer, telefon çerçevesi kadrajdan çıkar. |
| 11,9–17,5 | **Ürün + teknoloji** | *SULOOK ne o? → SULOOK Neo.* kelime oyunu, 1330 GPD / 160 L sayaçları. Damacana uçarak dolum kabinine girer (dolum ışığı). Layout animasyonu: LED Aydınlatma (yanıp söner, Açık/Kapalı rozeti), Dolum Kabini (kapak kapanıp açılır), 1330 GPD arıtma, 160 L depo, kartlı ödeme. Ardından ürün kenara kayar: Günlük dolum, Filtre ömrü, Depo seviyesi panelleri ve 3 push bildirimi. |
| 17,5–21,0 | **Kampanya** | *Kampanyaya özel*: Ücretsiz Nakliye · Ücretsiz Kurulum · 1 Yıl Ücretsiz Filtre Bakımı · 1 Yıl Call Center Yardımı · 1 Yıl Ücretsiz Otis Bağlantı Hizmeti (her biri vuruşla, onay işaretiyle). |
| 21,0–23,75 | **Fiyat** | **440.000 TL** → üstüne sert kırmızı çizgi → **399.900 TL** (flaş + sarsıntı) + "Kısa süreliğine" etiketi → yavaşça *%0 vade ile 4 ay taksit imkânı*. |
| 23,75–28,5 | **Anahtar teslim** | Fiyat ifadeleri ekranda kalır, sahne anahtar videosuna geçer. *Anahtar teslim 399.900 TL ile pasif gelir sistemini başlat.* + kayan kampanya şeridi + su-look.com. |

## Kaynaklar

- `source/perde.mp4`, `source/anahtar.mp4`: verilen videolar
- `source/harita.webp`, `source/neo-street.webp`, `source/heroshot.webp`: verilen site ekran görüntüleri
- `src/assets/img/neo_cut.png`: heroshot'tan arka planı ayrılmış ürün (isnet segmentasyon + kenar düzeltme)
- `src/assets/img/damacana.png`: heroshot'taki kesik damacananın simetriyle tamamlanmış hali
- `src/assets/img/harita.jpg`, `sokak.jpg`: ekran görüntülerindeki imleç balonu, sabit coin ve sabit pinler temizlendi; pinler/coinler animasyonlu olarak yeniden çiziliyor
- Font: Lexend (Google Fonts, ₺ glifi dahil)
- Ses: `tools/audio.py` ile tamamen sentezlenmiş müzik yatağı + SFX (telifsiz). `build/audio/` altında `music.wav` / `sfx.wav` ayrı stem olarak da üretilir.

## Yeniden üretim

```bash
./build.sh          # iki format
./build.sh 916      # sadece 9:16
node tools/render.mjs --f 45 --stills 3.5,12.9,22.6   # tek kare önizleme -> stills/
```

Zamanlama `src/main.js` içindeki `T` nesnesinde, format yerleşimleri `LY` nesnesinde.
Tarayıcıda `src/index.html?f=916` açılıp konsolda `seek(12.5)` ile herhangi bir an incelenebilir.

## Notlar / onay bekleyenler

- su-look.com bu bulut ortamından erişilebilir değildi (ağ politikası), site animasyonları verilen ekran görüntülerinden yeniden kuruldu. Sitenin orijinal harita / neo street animasyon dosyaları gelirse sahne 2–3 onlarla değiştirilebilir.
- Uygulama içindeki tüm sayılar (Dolum, Ciro, Litre, ödeme tutarları, filtre ömrü) **temsili**dir, ekranda "Temsili veriler" / "örnek akış" ibaresi var.
- "Dolum Kabini" kapağının açılıp kapanması ve LED'in aç/kapa gösterimi motion grafiktir, gerçek mekanizma ile birebir uyumu onaylanmalı.
- "Otis" yazımı brief'teki gibi kullanıldı (OTİS kısaltması ise güncellenmeli).
- Fiyatın KDV durumu brief'te yok, ekranda belirtilmedi.
- Cihaz üzerindeki yasal etiket bloğu (eski iletişim bilgisi) hiçbir karede okunaklı yakın çekimde gösterilmiyor.
