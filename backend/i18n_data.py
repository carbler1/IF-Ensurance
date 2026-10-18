"""Finnish and Swedish text for GET /v1/me/app. The seed text is English; `localize` swaps each string
the app shows for its translation. A string without an entry stays English. Names and places stay as they are.
Years in a string are matched as "{}" (so "Electrical panel from 1975" covers every preset year)."""

import copy
import re

YEAR = re.compile(r"\b(?:19|20)\d\d\b")


def _key(s: str) -> str:
    return YEAR.sub("{}", s)


# English -> (fi, sv)
_T = {
    # --- risks: data/demo-person.json
    "Electrical panel from 1975": ("Sähkökeskus vuodelta {}", "Elcentral från {}"),
    "Old fuses can overheat and cause fires.": ("Vanhat sulakkeet voivat ylikuumentua ja aiheuttaa tulipalon.", "Gamla proppar kan överhettas och orsaka brand."),
    "Your panel is original. Panels this old often lack residual-current protection, which is a common cause of house fires.": (
        "Keskus on alkuperäinen. Näin vanhoista keskuksista puuttuu usein vikavirtasuoja, ja sen puute on yleinen talopalojen syy.",
        "Centralen är original. Så gamla centraler saknar ofta jordfelsbrytare, vilket är en vanlig orsak till bränder i hus."),
    "A certified electrician inspects the panel and adds a residual-current device if needed.": (
        "Valtuutettu sähköasentaja tarkastaa keskuksen ja lisää tarvittaessa vikavirtasuojan.",
        "En behörig elektriker kontrollerar centralen och lägger vid behov till en jordfelsbrytare."),
    "You cannot do electrical work yourself, but you can book an inspection to confirm the panel is safe.": (
        "Sähkötöitä ei saa tehdä itse, mutta voit varata tarkastuksen, jolla keskuksen turvallisuus varmistetaan.",
        "Du får inte göra elarbeten själv, men du kan boka en kontroll för att försäkra dig om att centralen är säker."),
    "Original water pipes": ("Alkuperäiset vesiputket", "Originalvattenrör"),
    "Copper pipes over 40 years old start to leak.": ("Yli 40 vuotta vanhat kupariputket alkavat vuotaa.", "Kopparrör som är över 40 år gamla börjar läcka."),
    "Pipes from the 1970s are near the end of their life. Small leaks inside walls can go unnoticed for months.": (
        "1970-luvun putket ovat käyttöikänsä lopussa. Seinien sisällä pienet vuodot voivat jäädä huomaamatta kuukausiksi.",
        "Rör från 1970-talet närmar sig slutet av sin livslängd. Små läckor inne i väggarna kan förbli oupptäckta i månader."),
    "A plumber checks the pipes with a camera and pressure test, and replaces weak parts.": (
        "Putkiasentaja tutkii putket kameralla ja painekokeella ja vaihtaa heikot osat.",
        "En rörmokare kontrollerar rören med kamera och tryckprov och byter ut svaga delar."),
    "Check visible joints under sinks for green stains, then book an inspection.": (
        "Tarkista näkyvät liitokset hanojen alta vihreiden jälkien varalta ja varaa sitten tarkastus.",
        "Titta efter gröna fläckar på synliga skarvar under diskbänkarna och boka sedan en kontroll."),
    "No water leak sensor": ("Ei vuotoanturia", "Ingen vattenläckagesensor"),
    "A dishwasher leak can damage floors overnight.": ("Astianpesukoneen vuoto voi vahingoittaa lattiaa yön aikana.", "En läcka från diskmaskinen kan skada golvet över natten."),
    "Water damage is the most common home claim in Finland. A sensor with auto shut-off stops the water in seconds.": (
        "Vesivahinko on yleisin kotivakuutuskorvaus Suomessa. Automaattisululla varustettu anturi katkaisee veden sekunneissa.",
        "Vattenskador är den vanligaste hemskadan i Finland. En sensor med automatisk avstängning stoppar vattnet på några sekunder."),
    "A partner installs leak sensors and a shut-off valve.": ("Kumppani asentaa vuotoanturit ja sulkuventtiilin.", "En partner installerar läckagesensorer och en avstängningsventil."),
    "Place sensors under the dishwasher and sink yourself, then book a quick check.": (
        "Aseta anturit itse astianpesukoneen ja tiskialtaan alle ja varaa sitten pikatarkastus.",
        "Placera sensorer under diskmaskinen och diskbänken själv och boka sedan en snabb kontroll."),
    "Roof not checked in 6 years": ("Kattoa ei ole tarkastettu 6 vuoteen", "Taket har inte kontrollerats på 6 år"),
    "Damaged tiles let in snow melt.": ("Rikkoutuneet tiilet päästävät sulamisvedet läpi.", "Skadade tegelpannor släpper in smältvatten."),
    "Roofs should be checked every 3–5 years. Winter snow load makes small cracks worse.": (
        "Katto kannattaa tarkastaa 3–5 vuoden välein. Talven lumikuorma pahentaa pieniä halkeamia.",
        "Tak bör kontrolleras vart 3–5:e år. Vinterns snölast förvärrar små sprickor."),
    "A roofer inspects the tiles, flashings and underlay.": ("Kattoasentaja tarkastaa tiilet, vesipellit ja aluskatteen.", "En takläggare kontrollerar tegelpannorna, plåtarna och underlagstaket."),
    "Look for loose tiles from the ground with binoculars, then book an inspection.": (
        "Etsi irtonaisia tiiliä maasta kiikarilla ja varaa sitten tarkastus.",
        "Leta efter lösa tegelpannor från marken med kikare och boka sedan en kontroll."),
    "Thin attic insulation": ("Ohut ullakon eristys", "Tunn isolering på vinden"),
    "Heat loss can cause ice dams on the roof.": ("Lämpövuoto voi aiheuttaa jääpatoja katolle.", "Värmeförlust kan ge isproppar på taket."),
    "Insulation from 1975 is usually thinner than today's standard.": (
        "Vuoden {} eristys on yleensä nykyistä vaatimusta ohuempi.", "Isolering från {} är oftast tunnare än dagens standard."),
    "A partner measures and adds blown insulation.": ("Kumppani mittaa eristyksen ja lisää puhallusvillaa.", "En partner mäter och blåser in extra isolering."),
    "Measure the insulation depth in the attic, then book a check.": (
        "Mittaa eristeen paksuus ullakolla ja varaa sitten tarkastus.", "Mät isoleringens tjocklek på vinden och boka sedan en kontroll."),
    "Cottage pipes not drained for winter": ("Mökin putkia ei ole tyhjennetty talveksi", "Stugans rör är inte tömda inför vintern"),
    "Frozen pipes burst and flood the floor in spring.": ("Jäätyneet putket halkeavat ja vesi tulvii lattialle keväällä.", "Frusna rör spricker och översvämmar golvet på våren."),
    "Water left in the pipes of an empty cottage freezes, bursts the pipes and floods the floor when it thaws.": (
        "Tyhjän mökin putkiin jäänyt vesi jäätyy, rikkoo putket ja tulvii lattialle sulaessaan.",
        "Vatten som lämnas kvar i rören i en tom stuga fryser, spräcker rören och översvämmar golvet när det tinar."),
    "A plumber drains the pipes and the water heater and closes the main valve before the frost.": (
        "Putkiasentaja tyhjentää putket ja lämminvesivaraajan ja sulkee pääventtiilin ennen pakkasia.",
        "En rörmokare tömmer rören och varmvattenberedaren och stänger huvudventilen före frosten."),
    "Drain the pipes yourself with a checklist, then book a quick check.": (
        "Tyhjennä putket itse tarkistuslistan avulla ja varaa sitten pikatarkastus.", "Töm rören själv med hjälp av en checklista och boka sedan en snabb kontroll."),
    "Fireplace chimney not swept": ("Takan savupiippua ei ole nuohottu", "Eldstadens skorsten är inte sotad"),
    "Soot in the flue can catch fire.": ("Savuhormin noki voi syttyä tuleen.", "Sot i rökkanalen kan fatta eld."),
    "Soot builds up in a flue that is not swept every year. The cottage chimney was last swept in 2023.": (
        "Noki kertyy hormiin, jota ei nuohota vuosittain. Mökin piippu nuohottiin viimeksi vuonna {}.",
        "Sot samlas i en rökkanal som inte sotas varje år. Stugans skorsten sotades senast {}."),
    "A chimney sweep cleans the flue and checks the fireplace.": ("Nuohooja puhdistaa hormin ja tarkastaa tulisijan.", "En sotare rengör rökkanalen och kontrollerar eldstaden."),
    "You cannot sweep the flue yourself safely, but you can book the sweep for the start of the season.": (
        "Hormia ei voi nuohota turvallisesti itse, mutta voit varata nuohouksen kauden alkuun.",
        "Du kan inte sota rökkanalen själv på ett säkert sätt, men du kan boka sotning inför säsongens början."),
    "Boat engine not serviced in two years": ("Veneen moottoria ei ole huollettu kahteen vuoteen", "Båtmotorn har inte servats på två år"),
    "Worn fuel lines can fail at sea.": ("Kuluneet polttoaineletkut voivat pettää merellä.", "Slitna bränsleledningar kan gå sönder till havs."),
    "An unserviced engine is the most common reason a boat breaks down or catches fire at sea.": (
        "Huoltamaton moottori on yleisin syy siihen, että vene hajoaa tai syttyy tuleen merellä.",
        "En motor utan service är den vanligaste orsaken till att en båt går sönder eller börjar brinna till havs."),
    "A boat mechanic services the engine, the fuel line and the cooling system.": (
        "Venemekaanikko huoltaa moottorin, polttoaineletkun ja jäähdytysjärjestelmän.", "En båtmekaniker servar motorn, bränsleledningen och kylsystemet."),
    "Check the fuel line and the impeller yourself, then book a service check.": (
        "Tarkista polttoaineletku ja vesipumpun siipipyörä itse ja varaa sitten huoltotarkastus.",
        "Kontrollera bränsleledningen och impellern själv och boka sedan en servicekontroll."),
    "Boat stored outdoors without a cover": ("Vene säilytetään ulkona ilman suojaa", "Båten förvaras utomhus utan skydd"),
    "Snow and ice crack the hull over winter.": ("Lumi ja jää halkaisevat rungon talven aikana.", "Snö och is spräcker skrovet under vintern."),
    "Snow and melt water collect in an uncovered boat; the weight and the frost crack the hull and the deck.": (
        "Lumi ja sulamisvesi kertyvät suojaamattomaan veneeseen; paino ja pakkanen halkaisevat rungon ja kannen.",
        "Snö och smältvatten samlas i en obetäckt båt; vikten och frosten spräcker skrovet och däcket."),
    "A boat yard stores the boat indoors or fits a winter cover.": ("Venevarikko säilyttää veneen sisällä tai asentaa talvipeitteen.", "En båtvarv förvarar båten inomhus eller monterar ett vinterkapell."),
    "Fit a winter cover yourself, then book a quick check.": ("Asenna talvipeite itse ja varaa sitten pikatarkastus.", "Montera ett vinterkapell själv och boka sedan en snabb kontroll."),
    "Winter tyres over five years old": ("Yli viisi vuotta vanhat talvirenkaat", "Vinterdäck som är över fem år gamla"),
    "Old rubber grips the ice far worse.": ("Vanha kumi pitää jäällä paljon huonommin.", "Gammalt gummi greppar isen mycket sämre."),
    "Your winter tyres are from 2019. Rubber hardens with age and the braking distance on ice grows.": (
        "Talvirenkaasi ovat vuodelta {}. Kumi kovettuu iän myötä ja jarrutusmatka jäällä pitenee.",
        "Dina vinterdäck är från {}. Gummit hårdnar med åldern och bromssträckan på is blir längre."),
    "A tyre shop checks the tread and fits new winter tyres if needed.": (
        "Rengasliike tarkastaa kuvioinnin ja asentaa tarvittaessa uudet talvirenkaat.", "En däckverkstad kontrollerar mönstret och monterar vid behov nya vinterdäck."),
    "Measure the tread depth yourself, then book a tyre check.": ("Mittaa kuviosyvyys itse ja varaa sitten rengastarkastus.", "Mät mönsterdjupet själv och boka sedan en däckkontroll."),
    "Car not serviced in the last year": ("Autoa ei ole huollettu viimeisen vuoden aikana", "Bilen har inte servats under det senaste året"),
    "Worn brakes go unnoticed without a service.": ("Kuluneet jarrut jäävät huomaamatta ilman huoltoa.", "Slitna bromsar upptäcks inte utan service."),
    "The last service was in March 2025. Worn brakes and old fluids go unnoticed without a yearly service.": (
        "Viimeisin huolto oli maaliskuussa {}. Kuluneet jarrut ja vanhat nesteet jäävät huomaamatta ilman vuosihuoltoa.",
        "Senaste servicen var i mars {}. Slitna bromsar och gamla vätskor upptäcks inte utan årlig service."),
    "A garage services the car and checks the brakes.": ("Korjaamo huoltaa auton ja tarkastaa jarrut.", "En verkstad servar bilen och kontrollerar bromsarna."),
    "Check the oil and the lights yourself, then book the service.": ("Tarkista öljy ja valot itse ja varaa sitten huolto.", "Kontrollera oljan och lamporna själv och boka sedan service."),
    "Ruska's vaccinations are out of date": ("Ruskan rokotukset ovat vanhentuneet", "Ruskas vaccinationer är inte aktuella"),
    "Parvovirus and distemper need long, costly care.": ("Parvovirus ja penikkatauti vaativat pitkää ja kallista hoitoa.", "Parvovirus och valpsjuka kräver lång och dyr vård."),
    "An unvaccinated dog can catch parvovirus or distemper, which need long and costly care.": (
        "Rokottamaton koira voi sairastua parvovirukseen tai penikkatautiin, jotka vaativat pitkää ja kallista hoitoa.",
        "En ovaccinerad hund kan få parvovirus eller valpsjuka, som kräver lång och dyr vård."),
    "A vet renews the vaccinations.": ("Eläinlääkäri uusii rokotukset.", "En veterinär förnyar vaccinationerna."),
    "There is no way to do this yourself; book a vet visit.": ("Tätä ei voi tehdä itse; varaa aika eläinlääkärille.", "Det går inte att göra själv; boka ett veterinärbesök."),
    "Older large dog without a joint check": ("Iäkäs suuri koira ilman niveltarkastusta", "Äldre stor hund utan ledkontroll"),
    "Hip problems get worse without early care.": ("Lonkkavaivat pahenevat ilman varhaista hoitoa.", "Höftproblem blir värre utan tidig vård."),
    "Large dogs over six years old often develop hip and elbow problems that get worse without care.": (
        "Yli kuusivuotiaille suurille koirille kehittyy usein lonkka- ja kyynärvaivoja, jotka pahenevat ilman hoitoa.",
        "Stora hundar över sex år får ofta problem med höfter och armbågar som blir värre utan vård."),
    "A vet checks the hips and the elbows.": ("Eläinlääkäri tarkastaa lonkat ja kyynärpäät.", "En veterinär kontrollerar höfterna och armbågarna."),
    "Watch for stiffness after walks, then book a vet check.": (
        "Seuraa jäykkyyttä lenkkien jälkeen ja varaa sitten eläinlääkärin tarkastus.", "Håll utkik efter stelhet efter promenader och boka sedan en veterinärkontroll."),
    # --- risks: backend/presets.py EXTRA_RISKS
    "Ventilation filters not changed": ("Ilmanvaihdon suodattimia ei ole vaihdettu", "Ventilationsfiltren är inte bytta"),
    "Clogged filters raise damp and energy use.": ("Tukkeutuneet suodattimet lisäävät kosteutta ja energiankulutusta.", "Igensatta filter ökar fukten och energiförbrukningen."),
    "Ventilation filters need changing about once a year; clogged ones let damp build up.": (
        "Ilmanvaihdon suodattimet pitää vaihtaa noin kerran vuodessa; tukkeutuneet suodattimet päästävät kosteuden kertymään.",
        "Ventilationsfilter behöver bytas ungefär en gång om året; igensatta filter gör att fukt byggs upp."),
    "A partner cleans the ducts and changes the filters.": ("Kumppani puhdistaa kanavat ja vaihtaa suodattimet.", "En partner rengör kanalerna och byter filtren."),
    "Change the filters yourself, then book a duct check.": ("Vaihda suodattimet itse ja varaa sitten kanavatarkastus.", "Byt filtren själv och boka sedan en kanalkontroll."),
    "Smoke alarms not tested": ("Palovaroittimia ei ole testattu", "Brandvarnarna är inte testade"),
    "A dead battery gives no warning in a fire.": ("Tyhjä paristo ei varoita tulipalossa.", "Ett urladdat batteri varnar inte vid brand."),
    "Smoke alarms should be tested every few months and replaced after about ten years.": (
        "Palovaroittimet pitää testata muutaman kuukauden välein ja vaihtaa noin kymmenen vuoden jälkeen.",
        "Brandvarnare bör testas med några månaders mellanrum och bytas efter ungefär tio år."),
    "A partner tests the alarms and replaces old ones.": ("Kumppani testaa varoittimet ja vaihtaa vanhat uusiin.", "En partner testar varnarna och byter ut gamla."),
    "Press the test button on each alarm, then book a check if one fails.": (
        "Paina jokaisen varoittimen testipainiketta ja varaa tarkastus, jos jokin ei toimi.", "Tryck på testknappen på varje varnare och boka en kontroll om någon inte fungerar."),
    # --- tasks
    "Shut off outdoor tap": ("Sulje ulkohana", "Stäng av utekranen"),
    "Clean gutters": ("Puhdista vesikourut", "Rensa hängrännorna"),
    "Change heat pump filter": ("Vaihda lämpöpumpun suodatin", "Byt värmepumpens filter"),
    "Check roof snow load": ("Tarkista katon lumikuorma", "Kontrollera takets snölast"),
    "Inspect drainage well": ("Tarkasta salaojakaivo", "Kontrollera dräneringsbrunnen"),
    "Test smoke alarms": ("Testaa palovaroittimet", "Testa brandvarnarna"),
    "Last cleaned 14 months ago": ("Viimeksi puhdistettu 14 kuukautta sitten", "Senast rensat för 14 månader sedan"),
    "Filter is 11 months old": ("Suodatin on 11 kuukautta vanha", "Filtret är 11 månader gammalt"),
    "Heavy snow is common in January": ("Runsas lumi on tammikuussa yleistä", "Mycket snö är vanligt i januari"),
    "Recommended in partner report": ("Suositeltu kumppanin raportissa", "Rekommenderas i partnerns rapport"),
    "Required by the Rescue Act": ("Pelastuslain vaatima", "Krävs enligt räddningslagen"),
    # --- history labels (demo + presets.HISTORY)
    "Heat pump installed (2015)": ("Lämpöpumppu asennettu ({})", "Värmepump installerad ({})"),
    "Smoke alarms registered": ("Palovaroittimet rekisteröity", "Brandvarnare registrerade"),
    "Roof check aged": ("Kattotarkastus vanhentunut", "Takkontrollen har blivit gammal"),
    "Missed gutter cleaning": ("Vesikourujen puhdistus jäi tekemättä", "Rensning av hängrännor uteblev"),
    "Fire extinguisher registered": ("Sammutin rekisteröity", "Brandsläckare registrerad"),
    "Engine service missed in 2024": ("Moottorin huolto jäi tekemättä vuonna {}", "Motorservicen uteblev {}"),
    "Clean driving record, 3 years": ("Puhdas ajohistoria, 3 vuotta", "Ren körhistorik, 3 år"),
    "Driver safety course": ("Ajoturvallisuuskurssi", "Körsäkerhetskurs"),
    "Insured since a puppy": ("Vakuutettu pennusta asti", "Försäkrad sedan valpen"),
    "Microchip registered": ("Mikrosiru rekisteröity", "Mikrochip registrerad"),
    "Water leak sensor installed": ("Vuotoanturi asennettu", "Vattenläckagesensor installerad"),
    "Electrical check done": ("Sähkötarkastus tehty", "Elkontroll utförd"),
    "Chimney swept": ("Piippu nuohottu", "Skorstenen sotad"),
    # --- home details and insurance object names
    "Detached house": ("Omakotitalo", "Fristående hus"),
    "Semi-detached house": ("Paritalo", "Parhus"),
    "Row house": ("Rivitalo", "Radhus"),
    "Flat": ("Kerrostaloasunto", "Lägenhet"),
    "Oil": ("Öljy", "Olja"),
    "Direct electric": ("Suora sähkölämmitys", "Direktverkande el"),
    "District heating": ("Kaukolämpö", "Fjärrvärme"),
    "Ground heat pump": ("Maalämpöpumppu", "Jordvärmepump"),
    "Air heat pump": ("Ilmalämpöpumppu", "Luftvärmepump"),
    "Wood": ("Puu", "Ved"),
    "Pellet": ("Pelletti", "Pellets"),
    "Gas": ("Kaasu", "Gas"),
    "Oil → heat pump (2015)": ("Öljy → lämpöpumppu ({})", "Olja → värmepump ({})"),
    "Summer cottage, Nauvo": ("Kesämökki, Nauvo", "Sommarstuga, Nauvo"),
    "Buster XL motorboat": ("Buster XL -moottorivene", "Buster XL motorbåt"),
    # --- tiers (data/score-model.json)
    "Bronze": ("Pronssi", "Brons"),
    "Silver": ("Hopea", "Silver"),
    "Gold": ("Kulta", "Guld"),
    "Platinum": ("Platina", "Platina"),
    "Seasonal reminders": ("Kausimuistutukset", "Säsongspåminnelser"),
    "1 free checkup / year": ("1 ilmainen tarkastus / vuosi", "1 gratis kontroll / år"),
    "One month off one insurance": ("Yksi kuukausi veloituksetta yhdestä vakuutuksesta", "En månad gratis på en försäkring"),
    "Free yearly home check": ("Ilmainen vuosittainen kotitarkastus", "Gratis årlig hemkontroll"),
    "A weekend trip for two": ("Viikonloppumatka kahdelle", "En weekendresa för två"),
}
TABLE = {_key(k): v for k, v in _T.items()}

_MATERIAL = {"galvanized steel": ("galvanoitu teräs", "galvaniserat stål"), "copper": ("kupari", "koppar"),
             "plastic": ("muovi", "plast"), "pex": ("PEX", "PEX")}

# (regex over the English text, fi, sv): groups fill {0}, {1} ...; a group that is a _MATERIAL word is translated.
TEMPLATES = [
    (re.compile(r"^(\d+)% partner discount$"), "{0} % kumppanialennus", "{0} % partnerrabatt"),
    (re.compile(r"^Frost forecast in (.+)$"), "Pakkasennuste: {0}", "Frostprognos: {0}"),
    (re.compile(r"^(.+) pipes from (\d{4}) are over (\d+) years old\.$"),
     "Putket ({0}) vuodelta {1} ovat yli {2} vuotta vanhat.", "Rör ({0}) från {1} är över {2} år gamla."),
    (re.compile(r"^Pipes from (\d{4}) \((.+)\) are near the end of their life\. Small leaks inside walls can go unnoticed for months\.$"),
     "Vuoden {0} putket ({1}) ovat käyttöikänsä lopussa. Seinien sisällä pienet vuodot voivat jäädä huomaamatta kuukausiksi.",
     "Rör från {0} ({1}) närmar sig slutet av sin livslängd. Små läckor inne i väggarna kan förbli oupptäckta i månader."),
]

_WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
DAYS = {"fi": dict(zip(_WD, ["ma", "ti", "ke", "to", "pe", "la", "su"])), "sv": dict(zip(_WD, ["mån", "tis", "ons", "tors", "fre", "lör", "sön"]))}
MONTHS = {"fi": dict(zip(_MO, ["tammik.", "helmik.", "maalisk.", "huhtik.", "toukok.", "kesäk.", "heinäk.", "elok.", "syysk.", "lokak.", "marrask.", "jouluk."])),
          "sv": dict(zip(_MO, ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"]))}
DATE = re.compile(rf"^(?:({'|'.join(_WD)}) )?(?:(\d{{1,2}}) )?({'|'.join(_MO)})$")


def _date(s: str, lang: str) -> str | None:
    """"Tue 20 Oct" -> "ti 20. lokak." (fi) or "tis 20 okt" (sv); "23 Oct" and "Jan" work too."""
    m = DATE.match(s)
    if not m:
        return None
    wd, day, mon = m.groups()
    day = (day + (". " if lang == "fi" else " ")) if day else ""
    return (DAYS[lang][wd] + " " if wd else "") + day + MONTHS[lang][mon]


def tr(s, lang: str):
    """The text in lang, or s itself when there is no entry."""
    if lang not in ("fi", "sv") or not isinstance(s, str):
        return s
    i = 0 if lang == "fi" else 1
    if (d := _date(s, lang)) is not None:
        return d
    if (hit := TABLE.get(_key(s))) is not None:
        out = hit[i]
        for y in YEAR.findall(s):
            out = out.replace("{}", y, 1)
        return out
    for rx, *words in TEMPLATES:
        if m := rx.match(s):
            parts = [_MATERIAL[g.lower()][i] if g.lower() in _MATERIAL else g for g in m.groups()]
            return words[i].format(*parts)
    return s


def localize(data: dict, lang: str) -> dict:
    """A copy of the app data with its English seed text in lang (fi or sv); en returns data unchanged."""
    if lang not in ("fi", "sv"):
        return data
    d = copy.deepcopy(data)

    def each(rows, *fields):
        for row in rows:
            for f in fields:
                if isinstance(row.get(f), str):
                    row[f] = tr(row[f], lang)

    each([d.get("home", {})], "type", "heating")
    each(d.get("insurances", []), "object")
    each(d.get("risks", []), "title", "why", "explain", "fix", "diy")
    each(d.get("history", []), "label")
    each(d.get("bids", []), "date")
    each(d.get("tasks", []), "title", "due", "reasonText")
    for t in d.get("tiers", []):
        t["name"] = tr(t["name"], lang)
        t["rewards"] = [tr(r, lang) for r in t["rewards"]]
    return d
