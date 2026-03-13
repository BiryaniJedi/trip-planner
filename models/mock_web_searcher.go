package models

import (
// "math/rand"
// "time"
)

type MockWebSearcher struct{}

func (m *MockWebSearcher) Search(req TripAIRequest, useRealAI bool, apiKey string) (WebSearchResult, error) {
	// delay := time.Duration(2+rand.Intn(6)) * time.Second
	// time.Sleep(delay)
	return WebSearchResult{
		RawText: `
# Trip Research: Mumbai, India
**Departing from:** Newark Liberty International Airport (EWR)
**Duration:** 10 days | **Travelers:** 2 adults | **Budget:** Moderate | **Month:** November

---

## ✈️ Flights — EWR → BOM (Chhatrapati Shivaji Maharaj International Airport)

- **Air India AI-101**: Newark (EWR) → Mumbai (BOM), non-stop, ~15h 30m. Departs ~9:00 PM, arrives ~10:30 PM IST next day. Economy fares in November typically range **$680–$950/person round-trip**.
- **Emirates via DXB**: EWR → Dubai → Mumbai, ~18–20h total travel time. Fares around **$750–$1,100/person** with a comfortable layover option at DXB.
- **United + Air India codeshare**: EWR → Frankfurt → BOM, ~19h. Prices range **$700–$900/person**.
- Best booking window: 6–10 weeks in advance for November travel. November is peak season onset — book early.

---

## 🏨 Accommodation

### Luxury (~$250–$450/night)
- **The Taj Mahal Palace (Colaba)** — Iconic heritage hotel overlooking the Gateway of India. Rooms from ~$380/night. World-renowned service, stunning harbor views, multiple award-winning restaurants on-site.
- **Four Seasons Mumbai (Worli)** — Modern luxury with panoramic city views. Rooms from ~$290/night. Excellent rooftop bar (AER) and proximity to Bandra-Worli Sea Link.

### Mid-Range (~$80–$180/night)
- **Trident Nariman Point** — Business-class comfort in South Mumbai. Rooms from ~$120/night. Great location for exploring Marine Drive and Colaba.
- **ITC Maratha (Andheri East)** — Close to the airport, strong heritage theme. Rooms from ~$110/night. Good for late arrivals/early departures.

### Budget (~$30–$70/night)
- **The Hosteller Mumbai** — Well-rated hostel in Bandra with private rooms from ~$35/night. Social atmosphere, great neighborhood for cafes and nightlife.
- **Hotel Kemps Corner** — No-frills but clean hotel in a central location. Doubles from ~$55/night.

---

## 🛂 Visa Requirements

**US Passport Holders:**
- India requires a visa for US citizens. The most convenient option is the **e-Visa (Tourist)**, applied for online at indianvisaonline.gov.in.
- **e-Tourist Visa**: Valid for 180 days (multiple entry), costs **$25 USD**. Processing time: 72–96 hours. Must apply at least 4 business days before travel.
- On arrival, you'll need: printed e-Visa confirmation, return ticket, proof of accommodation, and sufficient funds.
- **Passport validity**: Must be valid for at least 6 months beyond your travel date with at least 2 blank pages.
- No vaccinations are officially required, but Hepatitis A, Typhoid, and a Malaria prophylaxis consult are recommended by the CDC.

---

## 🏛️ Top Attractions

### Must-See
- **Gateway of India** — The iconic 1924 basalt arch on the harbor. Free to visit, best at sunrise or after dark. Takes ~45 min. Located in Colaba.
- **Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (CSMVS)** — Formerly Prince of Wales Museum. Excellent collection of Indian art, natural history, and decorative arts. Entry ~₹200 ($2.50).
- **Dharavi** — One of Asia's largest urban settlements. Take a guided tour (Reality Tours, ~$15/person) for a respectful, eye-opening experience.
- **Elephanta Caves** — UNESCO-listed rock-cut temple caves on an island ~1hr by ferry from the Gateway of India. Ferry ₹200 round-trip, cave entry ₹600 for foreigners. Dedicated to Lord Shiva.
- **Marine Drive (Queen's Necklace)** — 3.6km promenade along the Arabian Sea. Perfect for evening walks; stunning view of city lights at night.

### Neighborhoods Worth Exploring
- **Bandra West** — Trendy cafes, street art, Mount Mary church, Bandstand promenade.
- **Colaba Causeway** — Street shopping, antiques, the famous Leopold Cafe.
- **Kala Ghoda** — Mumbai's arts district; galleries, boutiques, and the annual Kala Ghoda Arts Festival (usually February, but galleries are open year-round).

### Day Trips
- **Lonavala** (~2h by train) — Hill station with scenic ghats, Bhushi Dam, and the famous chikki (brittle candy).
- **Pune** (~3h by express train) — Aga Khan Palace, Shaniwar Wada fort, and a thriving cafe scene.

---

## 🍽️ Food & Restaurants

### Fine Dining
- **Wasabi by Morimoto (Taj Mahal Palace)** — Iron Chef Morimoto's Mumbai outpost. Exceptional Japanese-fusion; mains ₹2,000–₹5,000 (~$24–$60). Reservations essential.
- **Trishna (Kala Ghoda)** — Legendary seafood restaurant. Famous for butter garlic crab. Mains ₹800–₹2,500. Reserve ahead; consistently ranked among India's best.
- **The Table (Colaba)** — Contemporary global cuisine, locally sourced. Excellent brunch. Mains ₹1,200–₹3,000.

### Local & Mid-Range
- **Britannia & Co. (Ballard Estate)** — Iconic Irani café serving Parsi food since 1923. Try the Berry Pulao (₹450). Closes ~4 PM; cash only.
- **Swati Snacks (Tardeo)** — Best vegetarian Gujarati street food in a sit-down setting. Try the panki and sev usal. Budget-friendly at ₹200–₹500/person.
- **Bastian (Bandra)** — Upscale seafood and burgers. Very popular with locals; book in advance. Mains ₹800–₹2,000.

### Street Food (Must Try)
- **Vada Pav** — Mumbai's iconic spiced potato fritter in a bread roll. Get it from any street cart near CST station (~₹20).
- **Pav Bhaji** — Spiced vegetable mash with buttered rolls. Try at Juhu Beach stalls in the evening.
- **Bhelpuri / Sev Puri** — Puffed rice snacks with chutneys, best at Chowpatty Beach.

> **Dietary Note:** Vegetarian options are plentiful across all price points. Many restaurants clearly mark Jain-friendly dishes. Seafood is excellent and fresh due to Mumbai's coastal location.

---

## 💡 Practical Tips

- **Currency**: Indian Rupee (INR). ~₹83 = $1 USD as of late 2024. ATMs widely available; inform your bank before travel.
- **Transport**: Use the **Mumbai Metro** (expanding network) and **AC local trains** for commuting. Ola/Uber are reliable and cheap (~₹200–₹600 for most city rides). Avoid autos for long distances.
- **Weather in November**: Pleasant and dry. Highs ~32°C (90°F), lows ~22°C (72°F). Post-monsoon, so air is clear. Light cottons recommended; bring a light layer for evenings.
- **SIM Card**: Pick up a prepaid Airtel or Jio SIM at the airport arrivals hall with your passport. Unlimited data plans ~₹300/month.
- **Safety**: Mumbai is generally safe for tourists. Standard precautions apply — watch for pickpockets at busy stations and be wary of unofficial "tour guides."

---

## 🔗 Links

- https://indianvisaonline.gov.in/evisa/tvoa.html
- https://www.airindia.com/us/en/routes/new-york-to-mumbai.html
- https://www.tripadvisor.com/Tourism-g304554-Mumbai_Maharashtra-Vacations.html
- https://whc.unesco.org/en/list/244
- https://www.tajhotels.com/en-in/taj/taj-mahal-palace-mumbai/
- https://www.csmvs.in/
- https://www.reality-gives.org/mumbai-city-tour
- https://www.lonelyplanet.com/india/mumbai
`,
		Sources: []string{
			"https://indianvisaonline.gov.in/evisa/tvoa.html",
			"https://www.airindia.com/us/en/routes/new-york-to-mumbai.html",
			"https://www.tajhotels.com/en-in/taj/taj-mahal-palace-mumbai/",
			"https://whc.unesco.org/en/list/244",
			"https://www.lonelyplanet.com/india/mumbai",
			"https://www.tripadvisor.com/Tourism-g304554-Mumbai_Maharashtra-Vacations.html",
			"https://www.reality-gives.org/mumbai-city-tour",
		},
	}, nil
}
