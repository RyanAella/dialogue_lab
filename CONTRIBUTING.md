# Contributing / Git-Konventionen

Kurze Nachschlage-Referenz für den Git-Workflow in diesem Repo. Ziel: nicht merken müssen, sondern nachschlagen können.

## Wann mache ich was?

| Situation | Was du machst | Befehl(e) |
|---|---|---|
| Du arbeitest an einem Feature/Bugfix | Neuer Branch, beschreibende Commits | `git switch -c feature/kurz-name` → `git commit -m "Was wurde geändert"` |
| Feature ist fertig | Merge auf `main`, Message beschreibt den Inhalt (nicht "See Changelog"!) | `git merge --no-ff feature/kurz-name -m "Merge: kurz was drin ist"` |
| Ein Feature ist auf `main` gemerged | Changelog-Eintrag unter `## [Unreleased]` ergänzen (sofort, solange es frisch ist) | Eintrag unter der Unreleased-Überschrift ergänzen |
| Neue Version soll raus | `Unreleased` umbenennen → Release-Commit → Tag | siehe Release-Ablauf |
| Kleiner Fix, kein eigener Branch nötig | Direkt auf `main` committen (nur bei trivialen Änderungen) | `git commit -m "Fix: ..."` |

**Merkregel:** "See Changelog - Version X.Y.Z" = Release-Commit. Alle anderen Commits beschreiben, was sie ändern.

## Branches

- Es gibt genau **einen** Produkt-Branch: `main`. Deployments laufen ausschließlich von `main`.
- Arbeits-Branches: `feature/kurz-name`, `fix/kurz-name` – kurzlebig, werden nach dem Merge gelöscht.
- Vor dem Merge: `git fetch origin`, dann `origin/<name>` mergen, falls der Branch lokal fehlt.
- Nach dem Merge: Branch auf beiden Seiten löschen:
  ```bash
  git push origin --delete <name>   # Remote
  git branch -D <name>              # lokal (falls vorhanden)
  ```
- Die früheren Produkt-Branches (`simulation-lab`, `practice-edition`) sind **obsolet** und werden nicht mehr gepflegt. Keine neuen Branches dieser Art anlegen.

## Zeilenenden (`.gitattributes`)

Das Repo speichert LF und checkt auf Windows nativ aus (`.gitattributes`, `* text=auto`). Binär-Assets (Bilder, Fonts, Audio) sind explizit als `binary` markiert – nie manuell an den Zeilenenden "reparieren", das übernimmt Git.

## CHANGELOG laufend pflegen (Unreleased-Muster)

Das Changelog heißt hier **`Changelog.md`** (Großbuchstabe C) und wird **kontinuierlich** gepflegt, nicht erst beim Release:

- Jeder Merge auf `main` ergänzt seinen Eintrag sofort unter der Überschrift `## [Unreleased]` (mit `### Added` / `### Changed` / `### Fixed` / `### Removed` darunter) – solange die Änderung noch frisch ist.
- Die Versionsnummer entsteht **erst beim Release** – vorher steht einfach `## [Unreleased]` oben.
- Derzeit gibt es noch keinen `## [Unreleased]`-Block im Changelog; der nächste Merge legt ihn oben (unter der Intro-Zeile) an.

Die in der App angezeigte Version bleibt davon unberührt: Das Deploy-Skript liest beim Build die erste *numerische* Version aus dem Changelog (`## [X.Y.Z]`) und überspringt `[Unreleased]` automatisch. Die App zeigt also immer die zuletzt *releasede* Version – erst beim Release wandert die Anzeige hoch.

## Release-Ablauf

Vorbedingungen: alle Features für die Version sind auf `main` gemerged, App im Browser getestet (Deploy läuft automatisch über GitHub Pages), Unreleased-Block enthält alles, was in die Version soll.

```bash
# 1. Changelog.md: "## [Unreleased]" umbenennen in "## [X.Y.Z] - Datum"
#    (Datum von heute, Nummer hochzaehlen: Patch fuer Fixes, Minor fuer Features)

# 2. Release-Commit (nur Changelog geaendert)
git add Changelog.md
git commit -m "See Changelog - Version X.Y.Z"

# 3. Tag auf genau diesen Commit
git tag -a vX.Y.Z -m "Release X.Y.Z"

# 4. Hochladen (Tags pusht Git NICHT automatisch!)
git push origin main
git push origin vX.Y.Z
```

Nach dem Release zeigt `git diff vVorherige vX.Y.Z` sofort, was in der Version gelandet ist. Der naechste neue Eintrag beginnt wieder unter einem frischen `## [Unreleased]`.

## CI / Deployment

Bei jedem Push auf `main` läuft der Workflow **Deploy** (`.github/workflows/deploy.yml`): Das Build-Artefakt (`index.html`, `src/`, `scenarios/`, `prompts/`) wird automatisch nach GitHub Pages veröffentlicht. Es gibt hier keinen separaten Validate-Workflow – deswegen gilt: **App nach dem Merge im Browser testen**, rotes Deploy = sofort fixen.

## Optional: `git release`-Alias (lokales Setup)

Der Release-Ablauf oben als ein Befehl (einmalig pro Rechner einrichten, gilt dann in allen Repos mit Changelog im Keep-a-Changelog-Format):

```bash
git config --global alias.release '!f() { v=$(grep -m1 -oP "^## \[\K[0-9.]+" Changelog.md) && git add Changelog.md && git commit -m "See Changelog - Version $v" && git tag -a "v$v" -m "Release $v" && git push origin main && git push origin "v$v"; }; f'
```

Danach: `## [Unreleased]` in `## [X.Y.Z] - Datum` umbenennen, dann `git release`. Der Alias liest die oberste *numerische* Version aus dem Changelog und macht Commit, Tag und beide Pushes automatisch. (Mit `## [Unreleased]` oben findet er keine Nummer – das Umbenennen ist bewusst der manuelle Schritt, weil die neue Versionsnummer ja festgelegt werden muss.)
