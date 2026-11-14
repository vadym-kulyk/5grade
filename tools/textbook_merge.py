#!/usr/bin/env python3
"""md/<book>/p*.md → out/<book>.md (один файл на підручник, з позначками сторінок).

Запуск із робочої теки, де лежать pdf/5_ukrmova_<book>_2022.pdf і md/<book>/ (вихід ocr_textbook.py):
  python3 tools/textbook_merge.py onatiy avramenko …

Сторінка береться з pNNNN.md (розпізнано моделлю: наголоси, виділення, таблиці).
Якщо її немає — з текстового шару PDF (лише букви, без наголосів і виділень) з позначкою.
"""
import os, re, subprocess, sys

TITLES = {
    "onatiy": "Онатій А., Ткачук Т. Українська мова. 5 клас. — Тернопіль: Навчальна книга — Богдан, 2022",
    "avramenko": "Авраменко О. Українська мова. 5 клас. — Київ: Грамота, 2022",
    "golub": "Голуб Н., Горошкіна О. Українська мова. 5 клас. — 2022",
    "litvinova": "Літвінова І. Українська мова. 5 клас. — Харків: Ранок, 2022",
    "voron": "Ворон А., Солопенко В. Українська мова. 5 клас. — Київ: Оріон, 2022",
    "rum": "Петрук О. Українська мова. 5 клас (для шкіл з румунською мовою навчання). — Львів: Світ, 2022",
}
NOTE = ("Видання 2022 р., правопис 2019 р. Розпізнано з PDF (картинка сторінки + текстовий шар) "
        "моделлю gpt-6.1-terra через Abacus RouteLLM. Наголос — знак U+0301 після голосної. "
        "Позначка «<!-- с. N (PDF) -->» — номер сторінки у PDF-файлі (може відрізнятися від друкованого). "
        "Сторінки з позначкою «ЛИШЕ ТЕКСТОВИЙ ШАР» ще не розпізнані моделлю: букви точні, "
        "але немає наголосів, виділень і таблиць.")
CYR = "а-яіїєґА-ЯІЇЄҐ'’́"
# латинські двійники кириличних букв (трапляються в текстовому шарі PDF)
HOMO = str.maketrans("aceiopxyABCEHIKMOPTX", "асеіорхуАВСЕНІКМОРТХ")


def fix_homoglyphs(t):
    def f(m):
        w = m.group(0)
        if re.search(f"[{CYR}]", w) and re.search(r"[a-zA-Z]", w) and not re.search(r"[b-df-hj-np-wzA-Z]", w.translate(HOMO)):
            return w.translate(HOMO)
        return w
    return re.sub(rf"[{CYR}a-zA-Z]+", f, t)


def pages(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    return int(next(l.split()[-1] for l in out.splitlines() if l.startswith("Pages:")))


os.makedirs("out", exist_ok=True)
for book in sys.argv[1:]:
    pdf = f"pdf/5_ukrmova_{book}_2022.pdf"
    parts, ocr, layer = [f"# {TITLES[book]}\n\n> {NOTE}\n"], 0, 0
    for n in range(1, pages(pdf) + 1):
        f = f"md/{book}/p{n:04d}.md"
        if os.path.exists(f):
            t, ocr = open(f, encoding="utf-8").read().strip(), ocr + 1
        else:
            t = subprocess.run(["pdftotext", "-f", str(n), "-l", str(n), pdf, "-"], capture_output=True, text=True).stdout.strip()
            t, layer = "<!-- ЛИШЕ ТЕКСТОВИЙ ШАР: без наголосів і виділень -->\n\n" + t, layer + 1
        parts.append(f"\n<!-- с. {n} (PDF) -->\n\n" + fix_homoglyphs(t) + "\n")
    open(f"out/{book}.md", "w", encoding="utf-8").write("".join(parts))
    print(book, f"розпізнано {ocr}, лише текстовий шар {layer},", os.path.getsize(f"out/{book}.md"), "байт")
