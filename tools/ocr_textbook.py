#!/usr/bin/env python3
"""Підручник (PDF) → точний Markdown по сторінках, щоб звіряти завдання з підручником.

Кожну сторінку надсилаємо моделі через Abacus RouteLLM разом із текстовим шаром PDF
(якщо він є): шар дає точні букви, картинка — наголоси, виділення, таблиці, порядок.
Ключ підставляє проксі середовища; змінна ABACUS_API_KEY не потрібна.

Використання:
  python3 tools/ocr_textbook.py підручник.pdf out_dir [--from 1] [--to 300] [--model M] [--jobs 4]
Результат: out_dir/p0001.md, p0002.md, … (уже готові сторінки пропускаються).
"""
import argparse, base64, json, os, subprocess, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://routellm.abacus.ai/v1/chat/completions"
PROMPT = """Це сторінка шкільного підручника української мови. Перепиши її в Markdown ДОСЛІВНО й ПОВНІСТЮ.
Правила:
- Нічого не виправляй, не скорочуй, не перекладай і не додавай коментарів. Помилки й пропуски букв у вправах (напр. «пр..красний», «сон..це») залишай як є.
- Наголос позначай знаком U+0301 після наголошеної голосної (напр. доне́чка), якщо на сторінці він є.
- Виділені в тексті букви/частини слів/слова: жирний → **…**, курсив → *…*, підкреслене → <u>…</u>.
- Транскрипцію пиши точно як у книзі: [ ], ΄ м’якість, ’ апостроф/напівпом’якшення, дужки над дж/дз — як [дж].
- Заголовки параграфів — ##, рубрики (Правило, Зауважте!, вправи з номерами) зберігай. Таблиці — Markdown-таблиці.
- Малюнки опиши одним рядком у квадратних дужках: [Малюнок: …], лише якщо на них є текст або вони потрібні для вправи.
- Номер сторінки, колонтитули теж перепиши.
Нижче — текстовий шар PDF (букви в ньому зазвичай точні, але немає наголосів і виділень, а порядок може бути збитий). Звіряйся з картинкою."""


def text_layer(pdf, page):
    r = subprocess.run(["pdftotext", "-f", str(page), "-l", str(page), pdf, "-"], capture_output=True, text=True)
    return r.stdout.strip()


def page_md(pdf, page, model, dpi=200):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", str(dpi), "-jpeg", "-jpegopt", "quality=90",
                        "-singlefile", pdf, os.path.join(d, "p")], check=True)
        img = base64.b64encode(open(os.path.join(d, "p.jpg"), "rb").read()).decode()
    layer = text_layer(pdf, page) or "(текстового шару немає — це скан)"
    body = {"model": model, "messages": [{"role": "user", "content": [
        {"type": "text", "text": PROMPT + "\n\n<text_layer>\n" + layer + "\n</text_layer>"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + img}}]}]}
    req = urllib.request.Request(API, json.dumps(body).encode(), {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + os.environ.get("ABACUS_API_KEY", "proxy-injected")})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            return d["choices"][0]["message"]["content"].strip(), d.get("usage", {}).get("credits_used", 0)
        except Exception:  # 502/таймаут — повторюємо з паузою
            if attempt == 3:
                raise
            time.sleep(10 * (attempt + 1))


def pages(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    return int(next(l.split()[-1] for l in out.splitlines() if l.startswith("Pages:")))


def main():
    a = argparse.ArgumentParser()
    a.add_argument("pdf"); a.add_argument("out")
    a.add_argument("--from", dest="first", type=int, default=1)
    a.add_argument("--to", dest="last", type=int, default=0)
    a.add_argument("--model", default="gpt-6.1-terra")
    a.add_argument("--jobs", type=int, default=4)
    a = a.parse_args()
    os.makedirs(a.out, exist_ok=True)
    todo = [p for p in range(a.first, (a.last or pages(a.pdf)) + 1)
            if not os.path.exists(os.path.join(a.out, f"p{p:04d}.md"))]

    def one(p):
        try:
            md, cr = page_md(a.pdf, p, a.model)
        except Exception as e:
            print(f"p{p}: ПОМИЛКА {e}", file=sys.stderr, flush=True)
            return 0
        open(os.path.join(a.out, f"p{p:04d}.md"), "w", encoding="utf-8").write(md + "\n")
        print(f"p{p}: {len(md)} симв., {cr} кред.", file=sys.stderr, flush=True)
        return cr or 0

    with ThreadPoolExecutor(a.jobs) as ex:
        total = sum(ex.map(one, todo))
    print(f"готово: {len(todo)} стор., {total:.1f} кредитів", file=sys.stderr)


if __name__ == "__main__":
    main()
