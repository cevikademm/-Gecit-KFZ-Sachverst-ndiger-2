# Katkı Rehberi — Gecit KFZ Sachverständiger

Bu rehber 3 kişilik ekibin (Adem Çevik, Gecit KFZ ofis, Çağrı Duran) aynı dosyalar üzerinde çakışmadan çalışabilmesi için yazılmıştır. **Her oturum öncesi okuyun.**

---

## 1. Asla "Download ZIP" ile çalışmayın

GitHub'ın "Code → Download ZIP" özelliği size **canlı bir kopya değil, anlık bir fotoğraf** verir. Bu fotoğrafla yaptığınız değişiklikleri push edemezsiniz; başkasının push'ladığı yenilikleri çekemezsiniz. Ekipte bu yöntemle çalışan biri varsa, onun ve diğerlerinin işi kaybolur.

**Doğru yol:**

```bash
git clone https://github.com/cevikademm/-Gecit-KFZ-Sachverst-ndiger-2.git gecit-kfz
cd gecit-kfz
npm install
```

Bir kere klonlayın. Aynı klasörü kullanın. ZIP indirmeyin.

---

## 2. Her güne `git pull` ile başlayın

Bilgisayarınızı açtığınızda, kahveyi yapmadan önce:

```bash
git checkout main
git pull origin main
```

Çekmeden önce bir şey yazdıysanız: önce `git stash`, sonra `git pull`, sonra `git stash pop`.

---

## 3. Branch akışı (zorunlu)

`main` koruma altındadır. **Doğrudan main'e push yasaktır** — küçük bir typo bile feature branch + PR ile gider.

| Branch deseni | Ne zaman | Örnek |
|---|---|---|
| `feature/<konu>` | Yeni özellik | `feature/i18n-admin-panel` |
| `fix/<konu>` | Hata düzeltme | `fix/login-modal-overlay` |
| `chore/<konu>` | Bakım, refactor, docs | `chore/landing-split` |
| `hotfix/<konu>` | Üretimde acil yangın | `hotfix/pdf-empty` |

Yeni branch açma:

```bash
git checkout main && git pull
git checkout -b feature/yapacagim-is
```

---

## 4. Conventional Commits (zorunlu — CLAUDE.md §6)

Her commit mesajı şu prefiksten biriyle başlar:

| Prefix | Anlamı |
|---|---|
| `feat:` | Yeni özellik |
| `fix:` | Bug düzeltme |
| `refactor:` | Davranışı değiştirmeyen yeniden yapılanma |
| `chore:` | Bağımlılık, build, config |
| `docs:` | Sadece doküman |
| `style:` | Whitespace / format |
| `test:` | Test ekleme/düzeltme |
| `perf:` | Performans iyileştirmesi |

**Yanlış:** `yenilikler eklendi`, `hatalar giderildi`, `update`
**Doğru:** `feat(i18n): 10 dil desteği ekle`, `fix(login): boş email kabul edilmesini engelle`

Mesaj gövdesi (opsiyonel) "neden" anlatır, "ne" değil — diff zaten neyi gösterir.

---

## 5. PR (Pull Request) kuralı

`main`'e her şey PR ile gider. Self-merge serbest **ama** PR'ı açtıktan sonra:

1. Başlık conventional commit formatında: `feat(scope): kısa özet`
2. Açıklamada: ne değişti, neden, nasıl test edildi
3. CI yeşil olmadan merge etmeyin
4. Çakışma varsa `git rebase main` ile çözün, `merge main` ile değil

---

## 6. Sıcak Dosyalar Uyarısı

Aşağıdaki dosyalara aynı anda **2'den fazla kişi dokunursa çakışma neredeyse kesin:**

- `src/pages/Landing.jsx` (artık parçalandı — bkz. `src/pages/landing/`)
- `src/App.jsx` (12k satır, parçalanması planlanıyor)
- `src/i18n/translations.js` (10 dilli sözlük)

Bu dosyalardan birinde değişiklik yapacaksanız:

1. WhatsApp grubuna yazın: "Landing.jsx'e dokunuyorum"
2. Aynı bölgeye 2. kişi çalışmaya başlamasın
3. İşi bitince push edin ve "ben bittim" deyin

---

## 7. Git kimlik tutarlılığı

Şu an `git shortlog`'da 4 kimlik görünüyor (3 kişi olmamıza rağmen):
- `cevikademm <cevikademm@gmail.com>`
- `cevikademm <cevikademm@github.com>`
- `Gecit KFZ <info@kfz-gutachter-aachen.de>`
- `Gecit KFZ Admin <cevikademm@gmail.com>`

**Çözüm:** Her makinede tek bir kimlik kullanın:

```bash
git config --global user.name "Adem Çevik"
git config --global user.email "cevikademm@gmail.com"
```

Ofis bilgisayarında ofis hesabıyla, kişiselde kişiselle commit atmayın — `git blame` faydasız hâle gelir.

---

## 8. Asla commit'lemeyin

- `.env`, `.env.local`, `.env.production` (zaten `.gitignore`'da)
- API anahtarları, Supabase service role key
- `node_modules/` (zaten ignore'da)
- Üretim PDF çıktıları (zaten ignore'da)
- Kişisel test verisi içeren JSON dump'ları

Yanlışlıkla commit ettiyseniz **`git rm --cached <dosya>` + push** yetmez — anahtar artık geçmişte. **Hemen rotate edin** (Supabase → Settings → API → Reset).

---

## 9. Ajan kullanımı (CLAUDE.md ile uyumlu)

23 uzman ajan var (`.claude/agents/`). Karmaşık iş varsa orchestrator üzerinden gönderin. Doğrudan kod yazmaya başlamadan önce mimar / database / security ajanlarına danışın.

Yeni metin eklediğinizde **her zaman** `t('namespace.key')` kullanın — **asla sabit string yazmayın**. `localization-expert` ajanı 10 dile çevirir.

---

## 10. Sorumluluk Bölgeleri

Çakışmayı azaltmak için:

| Kişi | Birincil sorumluluk |
|---|---|
| Adem Çevik | Backend, Supabase, mimari, ajan ekibi |
| Gecit KFZ | İçerik, marka, müşteri tarafı UI |
| Çağrı Duran | Landing/marketing sayfası, görsel iyileştirme |

Bu sınırlar katı değil — biri tatildeyken diğeri devralır. Ama plansız "ben de düzelteyim"den kaçının.
