# Mondkalender für den Garten

## Überblick

Der Mondkalender für den Garten (die Methode der biodynamischen Aussaatkalender von Maria Thun) in Gladys, direkt in der Integration berechnet: kein Konto, kein Schlüssel, keine Verbindung.

- **Frucht-, Wurzel-, Blüten- und Blatttage**: Der Tagestyp folgt dem Sternbild, in dem der Mond steht (Feuer-, Erd-, Luft- und Wassersternbilder), auf die Minute genau.
- **Auf- und absteigender Mond**: je etwa 13,6 Tage, unabhängig von der Phase. Aufsteigend: säen, veredeln, Früchte und Blätter ernten. Absteigend: pflanzen, umpflanzen, schneiden, den Boden bearbeiten.
- **Ungünstige Tage**: die Tage mit Erdnähe, Erdferne, Mondknoten oder Finsternis.

Sie erhalten einen Kalender unter **Meine Kalender**, zwei Dashboard-Widgets, drei Szenen-Auslöser und eine Szenen-Aktion.

![Die Widgets Gärtnermond und Gartenwoche am Sonntag, 15. November 2026, um 8 Uhr (generierte Illustration, kein Bildschirmfoto)](https://raw.githubusercontent.com/William-De71/gladys-lunar-gardening-calendar/main/docs/assets/widgets.de.png)

## Voraussetzungen

- Gladys Assistant 5.3.0 oder neuer.
- Die richtige Zeitzone in Gladys (Einstellungen → System): Tage und Uhrzeiten werden darin berechnet.

## Konfiguration

1. Installieren Sie die Integration unter **Integrationen** (Lunar gardening calendar).
2. Klicken Sie unter **Meine Kalender** auf **Für mich aktivieren**: Der „Mondkalender für den Garten“ erscheint in Ihren Kalendern. Um ihn in Szenen zu nutzen, öffnen Sie ihn unter **Kalender** und teilen Sie ihn mit dem Haushalt.
3. Wählen Sie, was der Kalender zeigt, und die Stunde der Tageszusammenfassung:

| Feld                                   | Standard    | Wirkung                                                                              |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Auf- und absteigender Mond im Kalender | ja          | Ein Ereignis pro Zeitraum, je etwa 13 Tage.                                          |
| Ungünstige Tage im Kalender            | ja          | Ein ganztägiges Ereignis an Tagen mit Erdnähe, Erdferne, Mondknoten oder Finsternis. |
| Stunde der Tageszusammenfassung        | 7           | Der Auslöser „Tageszusammenfassung“ startet jeden Tag zu dieser Stunde (0 bis 23).   |
| Sprache der Texte                      | Automatisch | Szenentexte und Status. Der Kalender folgt immer der Sprache jedes Benutzers.        |

## Verwendung

### Kalender

- „Wurzeltag · Steinbock“ von Sonntag 09:34 bis Dienstag 18:19: ein Ereignis pro Tagestyp, mit den Gemüsen dieses Typs in der Beschreibung.
- „Aufsteigender Mond“ und „Absteigender Mond“: ein Ereignis pro Zeitraum.
- „Ungünstiger Tag: Aufsteigender Mondknoten 12:47“: ein ganztägiges Ereignis, wie in den gedruckten Kalendern, die den ganzen Tag markieren.

Der Kalender umfasst die vergangene Woche und das kommende Jahr. Er rückt jede Nacht weiter.

### Widgets

- **Gärtnermond**: der aktuelle Tagestyp und bis wann, der nächste, die Mondbahn und bis wann, die Phase, der ungünstige Tag und was zu tun ist.
- **Gartenwoche**: eine Zeile pro Tag (3 bis 10 Tage, Einstellung „Tage“): die Tagestypen und die Uhrzeit des Wechsels, ↑ aufsteigender oder ↓ absteigender Mond, ungünstige Tage in Rot.

### Szenen

Auslöser:

- **Neuer Tagestyp**: wenn der Mond in das Sternbild eines neuen Tagestyps eintritt. Filter: die Tagestypen. Variablen: `day_type` (fruit, root, flower, leaf), `day_type_label`, `constellation`, `ends_at`, `summary`, `advice`.
- **Neue Mondbahn**: wenn der Mond auf- oder absteigend wird. Filter: die Mondbahn. Variablen: `trajectory` (ascending, descending), `trajectory_label`, `ends_at`, `summary`, `advice`.
- **Tageszusammenfassung**: jeden Tag zur Stunde der Konfiguration. Filter: der Haupttagestyp des Tages, die Mondbahn, ungünstiger Tag oder nicht. Variablen: dieselben Werte wie die Aktion unten.

Aktion **Gartentag abrufen** (heute oder morgen): `date`, `day_type`, `day_type_label`, `day_types` („Frucht bis 09:34, dann Wurzel“), `constellation`, `trajectory`, `trajectory_label`, `avoid` (yes, no), `avoid_reasons`, `phase` (waxing, waning), `phase_label`, `illumination` (%), `summary`, `advice`.

Beispiele:

- Jeden Abend um 20 Uhr (geplante Szene) → „Gartentag abrufen“ (morgen) → ihre Ausgaben „Zusammenfassung“ und „Gartentipp“ in einer Nachricht senden.
- „Tageszusammenfassung“, Filter Tagestyp = Wurzel und ungünstiger Tag = nein → „{{triggerEvent.data.summary}} {{triggerEvent.data.advice}}“ senden.
- „Neue Mondbahn“, Filter absteigend → „{{triggerEvent.data.advice}}“ senden (pflanzen, umpflanzen, schneiden…).

### Transport

Nur lokal: Alles wird im Container berechnet, nichts verlässt Ihr Netzwerk. Der Katalog zeigt das Abzeichen „lokal“.

## Wie gerechnet wird

- Die Position des Mondes stammt von [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT), auf wenige Bogensekunden genau.
- Die Sternbilder sind die echten des Himmels (IAU-Grenzen), ungleich groß, keine 12 Zeichen zu 30°. Feuer (Widder, Löwe, Schütze): Frucht. Erde (Stier, Jungfrau, Steinbock): Wurzel. Luft (Zwillinge, Waage, Wassermann): Blüte. Wasser (Krebs, Skorpion, Fische): Blatt.
- Der Mond durchquert jeden Monat auch den Schlangenträger, manchmal Fuhrmann, Orion, Walfisch oder Sextant. Wie in den gedruckten Kalendern behalten diese Durchgänge das vorherige Sternbild bis Mitternacht und übernehmen dann das nächste.
- Der auf- oder absteigende Mond eines Tages ist der von 12 Uhr. Ungünstige Tage sind die lokalen Tage mit Erdnähe, Erdferne, Mondknoten oder Finsternis (Halbschatten-Mondfinsternisse eingeschlossen).
- Tag für Tag mit den von icalendrier.fr veröffentlichten Kalendern 2026 und 2027 verglichen: 730 von 730 Tagen, und dieselben Minuten, wo er sie angibt.

## Fehlerbehebung

- **Kein Kalender**: Klicken Sie auf der Seite der Integration unter **Meine Kalender** auf **Für mich aktivieren**. Nicht geteilte Kalender erscheinen nicht in Szenen: Teilen Sie ihn mit dem Haushalt.
- **Uhrzeiten um ein oder zwei Stunden verschoben**: Prüfen Sie die Zeitzone von Gladys (Einstellungen → System) und starten Sie die Integration neu.
- **Ein Tag weicht von Ihrem Papierkalender ab**: Nicht alle Kalender verwenden dieselben Grenzen (manche 12 Zeichen zu 30°, andere teilen den Schlangenträger anders auf) noch dieselben ungünstigen Tage. Öffnen Sie ein Issue mit dem Kalender, dem Tag und seiner Angabe.
- **Die Tageszusammenfassung startet nicht**: Sie startet einmal am Tag, zur eingestellten Stunde oder in der ersten Minute danach. Nach einem Neustart am selben Tag startet sie nicht erneut.
- Protokolle: der Reiter **Protokolle** der Integration. Im Entwicklermodus fügt `DEBUG=gladys-integration-sdk` die SDK-Protokolle hinzu.
